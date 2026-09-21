const { Op, fn, col } = require("sequelize");
const { Student, Teacher, Staff, Fee, Enrollment, School } = require("../models");
const logger = require("../utils/logger");

// KPIs pro DashboardHome — antes disso a tela era só um cartão de perfil,
// sem nenhum número (ver docs/project-rules.md, seção 7, "Painel com
// números (KPIs)"). Escopo intencionalmente enxuto: só o que um
// ADMIN/DIRECTOR/STAFF normalmente espera ver de cara. TEACHER e STUDENT
// não ganham KPIs aqui — não há um "meu resumo" óbvio pra eles ainda sem
// modelar turma/disciplina de verdade (ver seção 7, "Turma pedagógica").
async function getDashboardSummary(req, res) {
  try {
    // req.schoolId vem do requireSchool: null só quando SUPER_ADMIN não
    // filtrou por ?schoolId= — nesse caso devolve um resumo da plataforma
    // inteira em vez de números de uma escola específica.
    if (!req.schoolId) {
      const [schoolsTotal, schoolsActive, studentsTotal, teachersTotal] = await Promise.all([
        School.count(),
        School.count({ where: { status: "ACTIVE" } }),
        Student.count(),
        Teacher.count(),
      ]);

      return res.status(200).json({
        scope: "PLATFORM",
        schoolsTotal,
        schoolsActive,
        schoolsInactive: schoolsTotal - schoolsActive,
        studentsTotal,
        teachersTotal,
      });
    }

    const school = await School.findByPk(req.schoolId, { attributes: ["academicModel"] });
    if (!school) return res.status(404).json({ message: "School not found." });

    const today = new Date().toISOString().slice(0, 10);

    // Fee não tem schoolId próprio — isolamento via join no Student dono
    // do registro, mesmo padrão do resto do sistema (ver
    // docs/project-rules.md, seção 5).
    const feeStudentScope = {
      model: Student,
      as: "student",
      required: true,
      attributes: [],
      where: { schoolId: req.schoolId },
    };

    const [studentsTotal, teachersTotal, staffTotal, feesPendingCount, overdueRows] =
      await Promise.all([
        Student.count({ where: { schoolId: req.schoolId } }),
        Teacher.count({ where: { schoolId: req.schoolId } }),
        Staff.count({ where: { schoolId: req.schoolId } }),
        Fee.count({ where: { status: "PENDING" }, include: [feeStudentScope] }),
        Fee.findAll({
          where: { status: "PENDING", dueDate: { [Op.lt]: today } },
          include: [feeStudentScope],
          // col() é referência bruta de SQL, não resolvida contra o model —
          // precisa qualificar pra não ambiguar com o "id" do Student que
          // entra no JOIN (o include tem attributes: [], mas a tabela ainda
          // aparece no FROM). IMPORTANTE: qualificar com o alias que o
          // Sequelize dá à query ("Fee", o nome do model), não com o nome
          // real da tabela ("fees", ver backend/models/fee.js tableName) —
          // o SQL gerado é `FROM "fees" AS "Fee"`, então `fees.id` não bate
          // com nenhum alias e quebra com `missing FROM-clause entry for
          // table "fees"` no PostgreSQL (era "Unknown column" no MySQL).
          attributes: [
            "currency",
            [fn("COUNT", col("Fee.id")), "count"],
            [fn("SUM", col("Fee.amount")), "total"],
          ],
          group: ["currency"],
          raw: true,
        }),
      ]);

    const feesOverdue = overdueRows.map((row) => ({
      currency: row.currency,
      count: Number(row.count),
      amount: Number(row.total),
    }));

    let enrollmentsPendingCount = null;
    if (school.academicModel === "HIGHER_ED") {
      enrollmentsPendingCount = await Enrollment.count({
        where: { status: "PENDING" },
        include: [
          {
            model: Student,
            as: "student",
            required: true,
            attributes: [],
            where: { schoolId: req.schoolId },
          },
        ],
      });
    }

    return res.status(200).json({
      scope: "SCHOOL",
      studentsTotal,
      teachersTotal,
      staffTotal,
      feesPendingCount,
      feesOverdue,
      enrollmentsPendingCount,
    });
  } catch (error) {
    logger.requestError("[Error building dashboard summary]", req, error);
    return res.status(500).json({ message: "An error occurred while building the dashboard summary." });
  }
}

module.exports = { getDashboardSummary };

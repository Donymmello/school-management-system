const { Op } = require("sequelize");
const {
  Student,
  User,
  Turma,
  School,
  Enrollment,
  CourseOffering,
  Course,
  CourseOfferingSubject,
  TurmaSubject,
  Subject,
  Teacher,
  Grade,
} = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const {
  isUniqueConstraintError,
  respondUniqueConstraint,
  isValidationError,
  respondValidationError,
} = require("../utils/dbErrors");
const { calculateStudentResult } = require("../services/gradeCalculation.service");

const TURMA_INCLUDE = { model: Turma, as: "turma", required: false, attributes: ["id", "name", "grade"] };

async function validateStudentData({ idNumber, userId, studentId = null }) {
  if (idNumber) {
    const conflictDoc = await Student.findOne({
      where: {
        idNumber,
        ...(studentId && { id: { [Op.ne]: studentId } })
      },
      attributes: ['id']
    });
    if (conflictDoc) throw new Error("A student with this ID number already exists.");
  }

  if (userId) {
    const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
    if (!user) throw new Error("The user linked to this student was not found.");
    if (user.role !== "STUDENT") throw new Error("The linked user must have the role of STUDENT.");

    const conflictUser = await Student.findOne({
      where: {
        userId,
        ...(studentId && { id: { [Op.ne]: studentId } })
      },
      attributes: ['id']
    });
    if (conflictUser) throw new Error("This user is already linked to another student.");
  }
}

const blankToNull = (value) => (value === "" ? null : value);

function errorTreatment(res, error, standardMessage) {
  if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
  // Valor recusado por um validate: {...} do model é culpa do pedido, não do
  // servidor — sem isto subia até ao 500 genérico lá em baixo.
  if (isValidationError(error)) return respondValidationError(res, error);

  const map = {
    "A student with this ID number already exists.": { status: 400, message: error.message },
    "The user linked to this student was not found.": { status: 404, message: error.message },
    "The linked user must have the role of STUDENT.": { status: 400, message: error.message },
    "This user is already linked to another student.": { status: 400, message: error.message },
  };

  const knownError = map[error.message];
  if (knownError) {
    return res.status(knownError.status).json({ message: knownError.message });
  }

  console.error(`[Error]: ${standardMessage}`, error);
  return res.status(500).json({ message: standardMessage });
}


// Listar todos os estudantes
async function getAllStudents(req, res) {
  try {
    const students = await Student.findAll({
      where: tenantWhere(req),
      include: [
        { model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] },
        TURMA_INCLUDE,
      ],
      order: [["id", "DESC"]],
    });
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      message: "An error occurred while fetching students." });
  }
}

// Portal do aluno: o próprio registro, resolvido pelo userId do token — não
// pelo :id da URL, senão um aluno poderia trocar o parâmetro e ver outro
// (ver docs/project-rules.md, seção 6, item 5).
async function getMyProfile(req, res) {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id },
      include: [
        { model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] },
        TURMA_INCLUDE,
      ],
    });

    if (!student) return res.status(404).json({ message: "Student profile not found for this user." });
    return res.status(200).json(student);
  } catch (error) {
    console.error("[Error fetching own student profile]:", error);
    return res.status(500).json({ message: "An error occurred while fetching your profile." });
  }
}

// "Meu plano de estudos" (Fase 9c, ver docs/project-rules.md, seção 6) —
// o dado já existia, só não estava exposto pro aluno:
// - HIGHER_ED: não existe um Student.courseId de verdade usado em lugar
//   nenhum (a associação existe no model mas nunca é preenchida por
//   nenhum controller) — a fonte real de "quais disciplinas são minhas" é
//   Enrollment (matrícula APPROVED) -> CourseOffering -> CourseOfferingSubject.
// - SECONDARY: Student.turmaId -> TurmaSubject, já usado desde a Fase 6.
// Resposta normalizada num shape só (subjectName/teacherName/weeklyHours/
// context), pra frontend não precisar saber a diferença.
async function getMyStudyPlan(req, res) {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id },
      attributes: ["id", "turmaId", "schoolId"],
      include: [{ model: School, as: "school", attributes: ["academicModel"] }],
    });
    if (!student) return res.status(404).json({ message: "Student profile not found for this user." });

    if (student.school?.academicModel === "HIGHER_ED") {
      const enrollments = await Enrollment.findAll({
        where: { studentId: student.id, status: "APPROVED" },
        include: [
          {
            model: CourseOffering,
            as: "courseOffering",
            include: [
              { model: Course, as: "course", attributes: ["id", "displayName"] },
              {
                model: CourseOfferingSubject,
                as: "subjects",
                include: [
                  { model: Subject, as: "subject", attributes: ["id", "name"] },
                  { model: Teacher, as: "teacher", attributes: ["id", "name"], required: false },
                ],
              },
            ],
          },
        ],
      });

      const items = enrollments.flatMap((enrollment) => {
        const offering = enrollment.courseOffering;
        return (offering?.subjects || []).map((cos) => ({
          subjectId: cos.subject?.id ?? null,
          subjectName: cos.subject?.name || "—",
          teacherName: cos.teacher?.name || null,
          weeklyHours: cos.weeklyHours,
          status: cos.status,
          context: offering ? `${offering.course?.displayName || ""} · ${offering.code}` : null,
        }));
      });

      return res.status(200).json({ academicModel: "HIGHER_ED", items });
    }

    // SECONDARY (ou escola sem academicModel resolvido — fallback seguro
    // pro caminho que não depende de matrícula/oferta).
    if (!student.turmaId) {
      return res.status(200).json({ academicModel: "SECONDARY", items: [] });
    }

    const assignments = await TurmaSubject.findAll({
      where: { turmaId: student.turmaId },
      include: [
        { model: Subject, as: "subject", attributes: ["id", "name"] },
        { model: Teacher, as: "teacher", attributes: ["id", "name"], required: false },
      ],
    });

    const items = assignments.map((assignment) => ({
      subjectId: assignment.subject?.id ?? null,
      subjectName: assignment.subject?.name || "—",
      teacherName: assignment.teacher?.name || null,
      weeklyHours: assignment.weeklyHours,
      status: null,
      context: null,
    }));

    return res.status(200).json({ academicModel: "SECONDARY", items });
  } catch (error) {
    console.error("[Error fetching study plan]:", error);
    return res.status(500).json({ message: "An error occurred while fetching your study plan." });
  }
}

// "Minha situação curricular" (Fase 9d, ver docs/project-rules.md, seção
// 6) — decisão explícita do usuário: reaproveitar o cálculo de
// aprovado/reprovado que já existe (AcademicPolicy) só pro HIGHER_ED;
// SECONDARY não tem esse conceito modelado (não existe critério de
// aprovação por escola), então ganha uma versão mais simples: média por
// disciplina a partir de Grade, sem aprovado/reprovado.
async function getMyAcademicStatus(req, res) {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id },
      attributes: ["id"],
      include: [{ model: School, as: "school", attributes: ["academicModel"] }],
    });
    if (!student) return res.status(404).json({ message: "Student profile not found for this user." });

    if (student.school?.academicModel === "HIGHER_ED") {
      const enrollments = await Enrollment.findAll({
        where: { studentId: student.id, status: "APPROVED" },
        include: [
          {
            model: CourseOffering,
            as: "courseOffering",
            include: [
              {
                model: CourseOfferingSubject,
                as: "subjects",
                include: [{ model: Subject, as: "subject", attributes: ["id", "name"] }],
              },
            ],
          },
        ],
      });

      const items = [];
      for (const enrollment of enrollments) {
        const offering = enrollment.courseOffering;
        for (const cos of offering?.subjects || []) {
          try {
            const result = await calculateStudentResult(req, {
              enrollmentId: enrollment.id,
              courseOfferingSubjectId: cos.id,
            });
            items.push({
              subjectId: cos.subject?.id ?? null,
              subjectName: cos.subject?.name || "—",
              context: offering.code,
              ...result,
            });
          } catch (resultError) {
            // Sem política acadêmica ativa nessa escola (404 do service) —
            // não derruba a lista inteira, só marca esse item como
            // indisponível (o frontend mostra "não calculado ainda").
            items.push({
              subjectId: cos.subject?.id ?? null,
              subjectName: cos.subject?.name || "—",
              context: offering.code,
              unavailable: true,
              message: resultError.message,
            });
          }
        }
      }

      return res.status(200).json({ academicModel: "HIGHER_ED", items });
    }

    // SECONDARY: média simples por disciplina, sem aprovado/reprovado
    // formal (não modelado — ver docs/project-rules.md, seção 6).
    const grades = await Grade.findAll({
      where: { studentId: student.id },
      include: [{ model: Subject, as: "subject", attributes: ["id", "name"] }],
    });

    const bySubject = new Map();
    for (const grade of grades) {
      const key = grade.subjectId;
      if (!bySubject.has(key)) {
        bySubject.set(key, { subjectId: key, subjectName: grade.subject?.name || "—", scores: [] });
      }
      bySubject.get(key).scores.push(Number(grade.score));
    }

    const items = Array.from(bySubject.values()).map(({ subjectId, subjectName, scores }) => ({
      subjectId,
      subjectName,
      gradeCount: scores.length,
      averageScore: Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(2)),
    }));

    return res.status(200).json({ academicModel: "SECONDARY", items });
  } catch (error) {
    console.error("[Error building academic status]:", error);
    return res.status(500).json({ message: "An error occurred while building your academic status." });
  }
}

// Buscar estudante por ID
async function getStudentById(req, res) {
  try {
    const student = await Student.findOne({
      where: tenantWhere(req, { id: req.params.id }),
      include: [
        { model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] },
        TURMA_INCLUDE,
      ],
    });

    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.status(200).json(student);
  } catch (error) {
    console.error("[Error fetching student]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the student." });
  }
}

// Atualizar estudante
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const student = await Student.findOne({ where: tenantWhere(req, { id }) });
    if (!student) return res.status(404).json({ message: "Student not found." });


    const {
      name,
      age,
      grade,
      email,
      telephone,
      idCard,
      idNumber,
      notes,
      userId,
      turmaId,
    } = req.body;

    await validateStudentData({
      idNumber: idNumber !== undefined ? idNumber : student.idNumber,
      userId: userId !== undefined ? userId : student.userId,
      studentId: student.id,
    });

    // turmaId é anulável de propósito (desvincular o aluno de uma turma) —
    // checa presença da chave em vez de "??", mesma correção aplicada em
    // courseOfferingSubject.controller.js (ver docs/project-rules.md,
    // seção 6). Valida contra a escola do aluno antes de aceitar.
    if ("turmaId" in req.body && turmaId) {
      const turma = await Turma.findOne({ where: tenantWhere(req, { id: turmaId }) });
      if (!turma) return res.status(404).json({ message: "Turma not found in this school." });
    }

    await student.update({
      name: name ?? student.name,
      age: age ?? student.age,
      grade: grade ?? student.grade,
      email: email ?? student.email,
      telephone: telephone ?? student.telephone,
      // "" do formulário significa "sem documento", não a string vazia — o
      // isIn de idCard recusaria "" e o índice único de idNumber tratava ""
      // como valor real (NULL não colide, "" colide).
      idCard: "idCard" in req.body ? blankToNull(idCard) : student.idCard,
      idNumber: "idNumber" in req.body ? blankToNull(idNumber) : student.idNumber,
      notes: notes ?? student.notes,
      userId: userId ?? student.userId,
      turmaId: "turmaId" in req.body ? turmaId : student.turmaId,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "Student",
      entityId: student.id,
      description: `Updated student with ID ${student.id}`,
    });

    return res.status(200).json({ message: "Student updated successfully.", student});
  } catch (error) {
    return errorTreatment(res, error, "An error occurred while updating the student.");
  }
}

// Apagar estudante
async function deleteStudent(req, res) {
  try {

    const student = await Student.findOne({ where: tenantWhere(req, { id: req.params.id }) });
    if (!student) return res.status(404).json({ message: "Student not found." });
    
    await student.destroy();

    await registerLogAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "Student",
      entityId: student.id,
      description: `Deleted student with ID ${student.id}`,
    });

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("[Error deleting student]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the student." });
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  getMyProfile,
  getMyStudyPlan,
  getMyAcademicStatus,
  updateStudent,
  deleteStudent,
};
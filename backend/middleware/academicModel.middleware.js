const { School } = require("../models");

/*
  Bloqueia módulos exclusivos de um modelo acadêmico (ver docs/project-rules.md,
  seção 5): Course/CourseOffering/CourseOfferingSubject/Enrollment/Schedule/
  Assessment/StudentAssessment/Results/AcademicPolicy só fazem sentido pra
  escolas HIGHER_ED (créditos/ofertas). Escolas SECONDARY usam Classroom +
  Student.grade + Grade/Attendance direto, sem passar por essas rotas.

  Deve rodar depois do requireSchool (usa req.schoolId). SUPER_ADMIN sem
  ?schoolId= (req.schoolId === null) não é restrito — mesma semântica de
  "sem filtro, vê tudo" que tenantWhere já usa.

  Consulta o banco em vez de confiar num claim do JWT de propósito: o
  SUPER_ADMIN escolhe a escola por request via ?schoolId=, então o valor
  certo só existe resolvendo req.schoolId no momento da chamada.
*/
function requireAcademicModel(model) {
  return async (req, res, next) => {
    if (!req.schoolId) return next();

    try {
      const school = await School.findByPk(req.schoolId, { attributes: ["academicModel"] });

      if (!school || school.academicModel !== model) {
        return res.status(403).json({
          message: `This feature is only available for ${model} institutions.`,
        });
      }

      return next();
    } catch (error) {
      console.error("[requireAcademicModel]:", error);
      return res.status(500).json({ message: "An error occurred while checking the institution type." });
    }
  };
}

module.exports = requireAcademicModel;

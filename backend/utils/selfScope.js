const { Student, Teacher, TurmaSubject, CourseOfferingSubject, Enrollment } = require("../models");

/*
  Resolve o registro operacional (Student/Teacher) do usuário logado a partir
  do userId do token — é assim que o "portal" de cada papel se restringe aos
  próprios dados em vez de operar sobre o de terceiros (ver
  docs/project-rules.md, seção 6, item 5). Devolve null se o usuário não tiver
  um registro correspondente (ex: token de STUDENT sem Student vinculado).
*/
async function resolveOwnStudentId(req) {
  const student = await Student.findOne({ where: { userId: req.user.id }, attributes: ["id"] });
  return student ? student.id : null;
}

async function resolveOwnTeacherId(req) {
  const teacher = await Teacher.findOne({ where: { userId: req.user.id }, attributes: ["id"] });
  return teacher ? teacher.id : null;
}

/*
  Os alunos que um professor leciona. Duas origens, conforme o academicModel da
  escola — mas consultamos as duas sem perguntar qual é: numa escola SECONDARY
  o professor simplesmente não tem linhas em CourseOfferingSubject, e vice-versa.
  Poupa uma consulta à School e evita que a função fique errada se uma escola
  vier a usar os dois modelos.

    SECONDARY  TurmaSubject.teacherId -> turma -> alunos com esse turmaId
    HIGHER_ED  CourseOfferingSubject.teacherId -> oferta -> matrículas APPROVED

  Calculado sempre das atribuições ATUAIS: deixar de lecionar uma disciplina
  significa deixar de aceder aos alunos dela, incluindo notas que o próprio
  lançou (decisão explícita — ver docs/project-rules.md, seção 4). O registo não
  se perde: continua visível para secretaria e direção.
*/
async function resolveOwnStudentIds(teacherId) {
  const [turmaAssignments, offeringAssignments] = await Promise.all([
    TurmaSubject.findAll({ where: { teacherId }, attributes: ["turmaId"] }),
    CourseOfferingSubject.findAll({ where: { teacherId }, attributes: ["courseOfferingId"] }),
  ]);

  const turmaIds = [...new Set(turmaAssignments.map((a) => a.turmaId).filter(Boolean))];
  const offeringIds = [...new Set(offeringAssignments.map((a) => a.courseOfferingId).filter(Boolean))];

  const [porTurma, porMatricula] = await Promise.all([
    turmaIds.length
      ? Student.findAll({ where: { turmaId: turmaIds }, attributes: ["id"] })
      : [],
    offeringIds.length
      ? Enrollment.findAll({
          where: { courseOfferingId: offeringIds, status: "APPROVED" },
          attributes: ["studentId"],
        })
      : [],
  ]);

  return [
    ...new Set([
      ...porTurma.map((s) => s.id),
      ...porMatricula.map((e) => e.studentId),
    ]),
  ];
}

module.exports = { resolveOwnStudentId, resolveOwnTeacherId, resolveOwnStudentIds };

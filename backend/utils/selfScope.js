const { Student, Teacher } = require("../models");

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

module.exports = { resolveOwnStudentId, resolveOwnTeacherId };

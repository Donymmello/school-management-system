const { resolveOwnTeacherId, resolveOwnStudentIds } = require("../utils/selfScope");

/*
  ==========================================================
  MIDDLEWARE DE ESCOPO DO PROFESSOR
  ==========================================================
  Deve rodar depois do authMiddleware e do requireSchool.

  Mesmo par que requireSchool/tenantWhere: o middleware resolve uma vez por
  request e o helper síncrono ownStudentsWhere() mescla o filtro no where.
  Sem isso, cada handler teria de repetir a mesma consulta assíncrona.

  Só atua sobre TEACHER. Qualquer outro papel sai daqui com
  req.teacherStudentIds === undefined, e o helper não filtra nada — um ADMIN
  continua a ver a escola inteira.

  Um professor sem nenhuma atribuição fica com uma lista vazia, e o helper
  traduz isso em "nenhum aluno" em vez de "todos". A diferença importa: tratar
  lista vazia como ausência de filtro daria a um professor sem turmas acesso a
  toda a escola.
*/
const attachTeacherScope = async (req, res, next) => {
  if (req.user.role !== "TEACHER") return next();

  try {
    const teacherId = await resolveOwnTeacherId(req);
    if (!teacherId) {
      return res.status(404).json({ message: "Teacher profile not found for this user." });
    }

    req.teacherId = teacherId;
    req.teacherStudentIds = await resolveOwnStudentIds(teacherId);
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = attachTeacherScope;

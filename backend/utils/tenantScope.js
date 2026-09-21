/*
  Mescla o filtro de escola (req.schoolId, setado pelo middleware requireSchool)
  num `where` existente. req.schoolId === null (SUPER_ADMIN sem ?schoolId=) => sem
  filtro, vê registros de todas as escolas.
*/
function tenantWhere(req, where = {}) {
  return req.schoolId ? { ...where, schoolId: req.schoolId } : where;
}

/*
  Mescla o filtro "só os meus alunos" (req.teacherStudentIds, setado pelo
  middleware attachTeacherScope) num `where` de Student.

  undefined => quem chama não é TEACHER, não filtra.
  []        => é TEACHER e não leciona a ninguém, devolve nenhum aluno.
               `id: []` gera `IN (NULL)` no SQL, que não casa com nada — é o
               resultado correto, e diferente de não filtrar.
*/
function ownStudentsWhere(req, where = {}) {
  if (!Array.isArray(req.teacherStudentIds)) return where;

  // Se o where já pede um id concreto, CRUZAR com a lista em vez de a
  // sobrepor. A primeira versão fazia `{ ...where, id: teacherStudentIds }`,
  // o que substituía o id pedido: `validateRelations` perguntava pelo aluno 2,
  // ficava a perguntar pelos alunos [1], encontrava o aluno 1, dava a
  // validação por boa — e a nota era gravada para o aluno 2. Apanhado por
  // teste de fumo (backend/scripts/smoke-teacher-scope.js).
  if (where.id !== undefined) {
    const pedidos = Array.isArray(where.id) ? where.id : [where.id];
    const permitidos = pedidos.filter((id) => req.teacherStudentIds.includes(Number(id)));
    return { ...where, id: permitidos };
  }

  return { ...where, id: req.teacherStudentIds };
}

// Escola + "meus alunos" numa só chamada, que é como as consultas de Student
// quase sempre precisam.
function studentWhere(req, where = {}) {
  return ownStudentsWhere(req, tenantWhere(req, where));
}

module.exports = { tenantWhere, ownStudentsWhere, studentWhere };

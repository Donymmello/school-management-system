/*
  Mescla o filtro de escola (req.schoolId, setado pelo middleware requireSchool)
  num `where` existente. req.schoolId === null (SUPER_ADMIN sem ?schoolId=) => sem
  filtro, vê registros de todas as escolas.
*/
function tenantWhere(req, where = {}) {
  return req.schoolId ? { ...where, schoolId: req.schoolId } : where;
}

module.exports = { tenantWhere };

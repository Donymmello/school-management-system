/*
  ==========================================================
  MIDDLEWARE DE ISOLAMENTO MULTI-TENANT
  ==========================================================
  Deve rodar depois do authMiddleware.

  - SUPER_ADMIN não pertence a nenhuma escola: pode ver tudo (req.schoolId = null)
    ou filtrar por uma escola específica via ?schoolId=.
  - Qualquer outro papel fica preso à própria escola (req.user.schoolId do token).
*/
const requireSchool = (req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") {
    req.schoolId = req.query.schoolId ? Number(req.query.schoolId) : null;
    return next();
  }

  if (!req.user.schoolId) {
    return res.status(403).json({ message: "User is not linked to a school." });
  }

  req.schoolId = req.user.schoolId;
  return next();
};

module.exports = requireSchool;

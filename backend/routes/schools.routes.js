const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  registerSchool,
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
} = require("../controllers/school.controller");

// Auto-cadastro público: escola nova + primeiro ADMIN, sem precisar de um SUPER_ADMIN
router.post("/register", registerSchool);

// Só o dono da plataforma cria/lista escolas manualmente (via bootstrap/suporte)
router.post("/", authMiddleware, authorizeRoles("SUPER_ADMIN"), createSchool);
router.get("/", authMiddleware, authorizeRoles("SUPER_ADMIN"), getAllSchools);

// A própria escola pode ver/editar os próprios dados (checagem de posse dentro do controller)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"),
  getSchoolById
);
router.patch("/:id", authMiddleware, authorizeRoles("SUPER_ADMIN"), updateSchool);

module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  createFee,
  getAllFees,
  getFeeById,
  updateFee,
  markFeeStatus,
  deleteFee,
} = require("../controllers/fee.controller");

// STAFF = secretaria: lança propina junto com nota e inscrição (ver
// docs/project-rules.md, seção 4). SECRETARY foi unificado em STAFF — não
// entra mais aqui de propósito (ver seção 7).
const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];
// STUDENT só entra na listagem (portal do aluno, auto-escopado no
// controller) — não em criar/editar/excluir nem em getFeeById.
const READ_ROLES = [...MANAGE_ROLES, "STUDENT"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, createFee);
router.get("/", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, getAllFees);
router.get("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getFeeById);
router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, updateFee);
router.patch("/:id/status", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, markFeeStatus);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  deleteFee
);

module.exports = router;

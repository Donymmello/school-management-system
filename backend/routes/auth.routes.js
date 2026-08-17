const express = require("express");
const router = express.Router();

// Importa as funções do controller de autenticação
const {
  bootstrapAdmin,
  registerUser,
  registerStudent,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

// Importa o middleware de autenticação
const authMiddleware = require("../middleware/auth.middleware");


// Rota para criar um admin inicial (apenas para desenvolvimento)
router.post("/bootstrap-admin", bootstrapAdmin);

// Registo público do estudante
router.post("/register-student", registerStudent);

// Registo interno de utilizadores administrativos
router.post("/register-user", authMiddleware, registerUser);

// Fazer login
router.post("/login", login);

// Buscar dados do utilizador autenticado
router.get("/me", authMiddleware, getMe);

// Trocar a própria senha, logado (senha atual + nova)
router.patch("/change-password", authMiddleware, changePassword);

// Recuperação de password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
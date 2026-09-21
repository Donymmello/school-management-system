/*
  Teste de fumo do escopo do professor (ver docs/project-rules.md, seção 4).

  Assina um token de desenvolvimento para um utilizador existente e bate nos
  endpoints reais. Não é login: não usa palavra-passe, apenas o JWT_SECRET do
  ambiente. Serve para exercitar a cadeia authMiddleware -> authorizeRoles ->
  attachTeacherScope sem depender de um browser autenticado.

  NÃO correr contra produção: assina tokens arbitrários.

  Uso (de dentro do container do backend):
    docker compose exec -T api_backend node scripts/smoke-teacher-scope.js
*/
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:5000";

function tokenPara(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, schoolId: user.schoolId },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
}

async function pedir(caminho, token) {
  const r = await fetch(BASE + caminho, { headers: { Authorization: "Bearer " + token } });
  let corpo = null;
  try {
    corpo = await r.json();
  } catch {
    corpo = null;
  }
  return { status: r.status, corpo };
}

function resumir(corpo) {
  if (Array.isArray(corpo)) {
    return corpo.length + " registo(s)";
  }
  if (corpo && Array.isArray(corpo.items)) {
    return corpo.items.length + " item(ns)";
  }
  return JSON.stringify(corpo);
}

function nomesDeAlunos(corpo) {
  if (!Array.isArray(corpo)) return "-";
  const nomes = corpo.map((x) => x.name || (x.student && x.student.name)).filter(Boolean);
  return nomes.length ? nomes.join(", ") : "(nenhum)";
}

async function main() {
  const professor = await User.findOne({ where: { role: "TEACHER" } });
  const admin = await User.findOne({ where: { role: "ADMIN" } });

  if (!professor || !admin) {
    console.log("Precisa de um TEACHER e um ADMIN na base para correr.");
    process.exit(1);
  }

  for (const [rotulo, user] of [["PROFESSOR " + professor.name, professor], ["ADMIN " + admin.name, admin]]) {
    const token = tokenPara(user);
    console.log("\n=== " + rotulo + " ===");

    for (const caminho of ["/api/students", "/api/grades", "/api/attendance"]) {
      const { status, corpo } = await pedir(caminho, token);
      console.log(
        "  %s  HTTP %d  %s  alunos: %s",
        caminho.padEnd(18),
        status,
        String(resumir(corpo)).padEnd(14),
        nomesDeAlunos(corpo)
      );
    }

    const meu = await pedir("/api/teachers/me/subjects", token);
    console.log("  %s  HTTP %d  %s", "/teachers/me/subjects".padEnd(18), meu.status, resumir(meu.corpo));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("falhou:", e.message);
  process.exit(1);
});

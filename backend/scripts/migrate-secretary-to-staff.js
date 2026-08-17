/*
  Migração pontual (rodar UMA VEZ, manualmente): converte qualquer usuário
  com role "SECRETARY" pra "STAFF" — os dois papéis foram unificados porque
  faziam a mesma coisa administrativa (ver docs/project-rules.md, seção 7).
  Não faz parte de `sequelize.sync()`/boot normal do servidor de propósito:
  é uma correção de dado existente, não uma migração de schema.

  Uso: node backend/scripts/migrate-secretary-to-staff.js
  (precisa das mesmas variáveis de ambiente que o server usa pra conectar
  no MySQL — roda com o mesmo .env do backend.)
*/
require("dotenv").config();
const { sequelize, User } = require("../models");

async function main() {
  await sequelize.authenticate();

  const [affected] = await User.update(
    { role: "STAFF" },
    { where: { role: "SECRETARY" } }
  );

  console.log(`${affected} usuário(s) SECRETARY convertido(s) para STAFF.`);
  await sequelize.close();
}

main().catch((error) => {
  console.error("[migrate-secretary-to-staff] Falhou:", error);
  process.exit(1);
});

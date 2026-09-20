const sequelize = require("./db");
const logger = require("../utils/logger");

/**
 * SINCRONIZAÇÃO DA BASE DE DADOS
 * Alinha os modelos do Sequelize com as tabelas do PostgreSQL em ambiente de desenvolvimento.
 *
 * Chamado pelo boot do servidor (server.js). Quem decide o comportamento é o
 * .env:
 *   DB_SYNC=true   -> deixa o Sequelize criar o que falta (CREATE TABLE IF NOT EXISTS)
 *   DB_ALTER=true  -> além de criar, tenta ALTERAR tabelas já existentes
 *
 * DB_ALTER deve ficar em `false` no dia a dia: no PostgreSQL um `ENUM` é um
 * tipo criado com `CREATE TYPE`, não um modificador de coluna como era no
 * MySQL, e o `alter` do Sequelize v6 tropeça nisso quando roda repetidamente
 * sobre as 21 colunas ENUM deste projeto. Ligar pontualmente ao mudar schema,
 * desligar depois — ou usar migration de verdade (`sequelize-cli`).
 */
async function syncDatabase() {
  const sync = process.env.DB_SYNC === "true";
  const alter = process.env.DB_ALTER === "true";

  if (!sync) {
    logger.info("Sincronização automática desativada.");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    logger.warn("Sincronização IGNORADA em ambiente de produção por motivos de segurança.");
    return;
  }

  try {
    if (alter) {
      logger.warn("Atenção: DB_ALTER está ativo. O Sequelize vai tentar modificar a estrutura das tabelas existentes.");
    }

    // Executa a sincronização segura
    await sequelize.sync({ alter });

    logger.info("Base de dados sincronizada com sucesso.", { context: { alter } });
  } catch (error) {
    // Registra o erro de infraestrutura em detalhe e devolve a decisão pra quem
    // chamou: subir um servidor com schema quebrado esconde o problema até a
    // primeira query falhar em runtime, então o boot (server.js) aborta.
    logger.error("Erro crítico ao sincronizar a base de dados:", {
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
}

module.exports = syncDatabase;

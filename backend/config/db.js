const { Sequelize } = require("sequelize");
require("dotenv").config();

/*
  Aqui configuramos a conexão com a base de dados PostgreSQL.
  O Sequelize vai usar essas credenciais para se conectar.
*/
const sequelize = new Sequelize(
  process.env.DB_NAME,       // nome da base de dados
  process.env.DB_USER,       // utilizador do PostgreSQL
  process.env.DB_PASS,   // senha do PostgreSQL
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // se quiser ver queries SQL no terminal, mude para true
  }
);

module.exports = sequelize;

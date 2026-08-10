/*
  Isolamento em banco relacional (o "I" de ACID) não se garante checando "já existe?"
  em JS antes de criar — duas requisições concorrentes podem passar pela checagem ao
  mesmo tempo. Quem garante unicidade de verdade é a constraint UNIQUE no MySQL; o
  checapoint em JS é só UX (mensagem de erro amigável no caso comum, sem race).
  Por isso toda rota de criação deve ter uma UNIQUE constraint por trás E tratar o erro
  que o MySQL devolve quando a constraint pega uma corrida que o JS não viu.

  Docs: https://sequelize.org/docs/v6/other-topics/transactions/
        https://sequelize.org/api/v6/class/src/errors/validation/unique-constraint-error.ts~uniqueconstrainterror
*/
function isUniqueConstraintError(error) {
  return error?.name === "SequelizeUniqueConstraintError";
}

// Responde 409 com o(s) campo(s) que colidiram, sem vazar detalhes internos do SQL.
function respondUniqueConstraint(res, error) {
  const fields = error.errors?.map((e) => e.path).filter(Boolean) || [];
  return res.status(409).json({
    message: fields.length
      ? `A record with this ${fields.join(", ")} already exists.`
      : "A record with these values already exists.",
    fields,
  });
}

module.exports = { isUniqueConstraintError, respondUniqueConstraint };

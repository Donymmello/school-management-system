/*
  Isolamento em banco relacional (o "I" de ACID) não se garante checando "já existe?"
  em JS antes de criar — duas requisições concorrentes podem passar pela checagem ao
  mesmo tempo. Quem garante unicidade de verdade é a constraint UNIQUE no PostgreSQL; o
  checapoint em JS é só UX (mensagem de erro amigável no caso comum, sem race).
  Por isso toda rota de criação deve ter uma UNIQUE constraint por trás E tratar o erro
  que o PostgreSQL devolve quando a constraint pega uma corrida que o JS não viu.

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

/*
  Erro de validação do próprio Sequelize (validate: {...} no model), distinto
  do UniqueConstraintError acima. Sem isto, um valor inválido enviado pela API
  (ex: um tipo de documento fora da lista) sobe até ao catch genérico e vira
  500 — erro do servidor, quando o errado foi o pedido.
  Nota: UniqueConstraintError herda de ValidationError no Sequelize, mas os
  dois têm `name` distinto ("SequelizeUniqueConstraintError" vs
  "SequelizeValidationError"), por isso a comparação por nome não os confunde.
*/
function isValidationError(error) {
  return error?.name === "SequelizeValidationError";
}

function respondValidationError(res, error) {
  const fields = error.errors?.map((e) => e.path).filter(Boolean) || [];
  return res.status(400).json({
    message: error.errors?.[0]?.message || "Invalid value.",
    fields,
  });
}

module.exports = {
  isUniqueConstraintError,
  respondUniqueConstraint,
  isValidationError,
  respondValidationError,
};

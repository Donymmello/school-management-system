/*
  Validações de input pequenas e reutilizadas em mais de um controller —
  evita duplicar a mesma checagem (currency aparece em Fee e School). Mesmo
  princípio do ALLOWED_STATUSES em attendance.controller.js: validar antes
  de tocar o banco, pra devolver um 400 limpo em vez de deixar o MySQL
  estourar um erro cru (achado no code review desta rodada — ver
  docs/project-rules.md).
*/
function validateAmount(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: "amount must be a positive number." };
  }
  return { value: parsed };
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || currency.trim().length === 0 || currency.trim().length > 3) {
    return { error: "currency must be a string of up to 3 characters." };
  }
  return { value: currency.trim().toUpperCase() };
}

module.exports = { validateAmount, validateCurrency };

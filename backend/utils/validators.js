/*
  Validações de input pequenas e reutilizadas em mais de um controller —
  evita duplicar a mesma checagem (currency aparece em Fee e School). Mesmo
  princípio do ALLOWED_STATUSES em attendance.controller.js: validar antes
  de tocar o banco, pra devolver um 400 limpo em vez de deixar o MySQL
  estourar um erro cru (achado no code review desta rodada — ver
  docs/project-rules.md).
*/
// Núcleo compartilhado por validateAmount/validatePositiveNumber — extraído
// em code review (fase 5 do roadmap de execução) ao notar que
// assessment.controller.js validava peso/nota máxima com `Number(x)` cru,
// sem checar NaN nem negativo: um weight tipo "abc" virava NaN, e
// `NaN > 100` é sempre false, então o guard de "peso não pode passar de
// 100%" passava batido e a query de update quebrava lá na frente com um
// SequelizeDatabaseError cru.
function validatePositiveNumber(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: `${fieldName} must be a positive number.` };
  }
  return { value: parsed };
}

function validateAmount(amount) {
  return validatePositiveNumber(amount, "amount");
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || currency.trim().length === 0 || currency.trim().length > 3) {
    return { error: "currency must be a string of up to 3 characters." };
  }
  return { value: currency.trim().toUpperCase() };
}

module.exports = { validateAmount, validateCurrency, validatePositiveNumber };

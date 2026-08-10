// O backend sempre devolve { message: "..." } nos erros (ver
// backend/utils/dbErrors.js e os catch blocks dos controllers). Centraliza a
// extração pra não repetir esse fallback em cada tela.
export function getErrorMessage(error, fallback = "Ocorreu um erro inesperado.") {
  return error?.response?.data?.message || fallback;
}

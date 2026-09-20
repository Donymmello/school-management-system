// Referência de pagamento local (Fase 8, ver docs/project-rules.md, seção 6).
//
// IMPORTANTE — o que isto NÃO é: sistemas reais de referência bancária
// (Multibanco em Portugal, Multicaixa Express em Angola/Moçambique) usam um
// dígito de controlo calculado com um algoritmo (mod 97) definido pelo banco,
// dentro de um contrato de "entidade aderente" — sem esse contrato/API não
// dá pra gerar uma referência validável pelo banco de verdade. Este gerador
// só cria um número interno único por propina, pra:
//   1. identificar a propina de forma legível/copiável (secretaria passa pro
//      encarregado de educação pagar e depois confirmar manualmente);
//   2. servir de chave de busca pro endpoint de webhook (ver
//      backend/controllers/feeWebhook.controller.js) quando um gateway real
//      for integrado no futuro — nesse dia, a geração real do banco deve
//      substituir esta função, mantendo o mesmo formato de string.
//
// Reaproveita o próprio Fee.id como base em vez de manter um contador ou
// gerar aleatório com checagem de colisão — o id do banco já é único por
// construção, então não tem retry nem corrida possível.
function generateReference(feeId) {
  return String(feeId).padStart(9, "0");
}

module.exports = { generateReference };

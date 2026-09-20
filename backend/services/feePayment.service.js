// Serviço reutilizável de confirmação/reversão de pagamento de propina
// (Fase 8, ver docs/project-rules.md, seção 6). Extraído do controller pra
// ter UM lugar só que decide o que significa "marcar uma propina como
// paga" — usado hoje pelo fluxo manual (STAFF confirma depois de conferir
// o comprovativo, ver fee.controller.js markFeeStatus) e é o ponto de
// extensão pronto pro dia que um gateway de pagamento real existir (ver
// backend/controllers/feeWebhook.controller.js).
async function confirmFeePayment(fee, { method, confirmedByUserId = null, transaction } = {}) {
  return fee.update(
    {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: method,
      confirmedById: confirmedByUserId,
    },
    { transaction }
  );
}

// Reverter pra pendente (usado quando STAFF desfaz uma confirmação manual
// errada) — limpa os campos de confirmação, não só o status, pra não deixar
// "paymentMethod: MANUAL" mentindo numa propina que voltou a ser pendente.
async function revertFeePayment(fee, { transaction } = {}) {
  return fee.update(
    {
      status: "PENDING",
      paidAt: null,
      paymentMethod: null,
      confirmedById: null,
    },
    { transaction }
  );
}

module.exports = { confirmFeePayment, revertFeePayment };

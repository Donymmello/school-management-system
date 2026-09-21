const { Fee } = require("../models");
const { confirmFeePayment } = require("../services/feePayment.service");
const logger = require("../utils/logger");

// Ponto de extensão pronto pra um gateway de pagamento real (Fase 8, ver
// docs/project-rules.md, seção 6) — NENHUM provedor está integrado ainda.
// Isso existe só pra não precisar redesenhar o schema/fluxo quando um
// gateway (M-Pesa, banco etc.) for escolhido no futuro: basta apontar o
// webhook do provedor pra esta rota.
//
// Sem authMiddleware de propósito — um provedor externo não tem (nem
// deveria ter) um JWT deste sistema. A segurança aqui é um segredo
// compartilhado simples (header x-webhook-secret comparado a
// process.env.PAYMENT_WEBHOOK_SECRET), não autenticação de usuário.
// Quando um gateway real for integrado, trocar por qualquer verificação de
// assinatura que esse gateway específico usar (HMAC, etc.) — isso aqui é
// deliberadamente genérico porque não temos um provedor concreto ainda.
//
// Também não registra log de auditoria (registerLogAudit): LogAudit não
// tem schoolId próprio, o isolamento por escola do log é feito via join no
// User (ver logAudit.controller.js) — um pagamento confirmado por webhook
// não tem um User específico por trás (userId ficaria null), e um log
// assim ficaria invisível pra qualquer ADMIN de escola (join obrigatório
// exclui linhas sem User correspondente). A rastreabilidade fica no
// próprio Fee (paymentMethod=WEBHOOK, paidAt), visível na tela de
// propinas/alertas sem precisar do log de auditoria.
async function receivePaymentConfirmation(req, res) {
  try {
    const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!configuredSecret) {
      // Sem segredo configurado = webhook desligado de propósito (nenhum
      // gateway real integrado ainda, ver comentário acima). Não aceita
      // nada até alguém configurar PAYMENT_WEBHOOK_SECRET no .env.
      return res.status(503).json({ message: "Payment webhook is not configured on this server." });
    }

    const receivedSecret = req.headers["x-webhook-secret"];
    if (receivedSecret !== configuredSecret) {
      return res.status(401).json({ message: "Invalid webhook secret." });
    }

    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: "reference is required." });
    }

    const fee = await Fee.findOne({ where: { reference: String(reference) } });
    if (!fee) return res.status(404).json({ message: "No fee found for this reference." });

    // Idempotente: se o provedor reenviar a mesma notificação (comum em
    // webhooks reais, que costumam ter at-least-once delivery), não
    // reprocessa nem sobrescreve quem/quando confirmou originalmente.
    if (fee.status === "PAID") {
      return res.status(200).json({ message: "Fee was already marked as paid.", fee });
    }

    await confirmFeePayment(fee, { method: "WEBHOOK" });

    return res.status(200).json({ message: "Payment confirmed.", fee });
  } catch (error) {
    logger.requestError("[Error processing payment webhook]", req, error);
    return res.status(500).json({ message: "An error occurred while processing the payment webhook." });
  }
}

module.exports = { receivePaymentConfirmation };

const { LogAudit } = require("../models");


// options.transaction era aceito por vários call sites (registerUser,
// registerStudent, e agora resetPassword em auth.controller.js) mas nunca
// foi usado aqui — o LogAudit.create() rodava sempre fora da transaction
// que o caller pretendia, mesmo passando `{ transaction: t }` de propósito.
// Bug pego ao adicionar o log de auditoria do fluxo de redefinição de
// senha (fase 3 do roadmap de execução): se a transaction principal desse
// rollback, o log "senha alterada" ficava gravado do mesmo jeito, mentindo
// sobre o que de fato aconteceu.
async function registerLogAudit(
  { userId = null, action, entity, entityId = null, description = null },
  options = {}
) {
  try {
    await LogAudit.create(
      {
        userId,
        action: action,
        entity: entity,
        entityId: entityId,
        description: description,
      },
      options.transaction ? { transaction: options.transaction } : undefined
    );
  } catch (error) {
    console.error("Error to register audit log:", error);

    // Engolir o erro só é defensável fora de uma transaction, onde a auditoria
    // é mesmo acessória e falhar nela não deve derrubar a operação principal.
    //
    // Dentro de uma transaction, engolir é pior que inútil no PostgreSQL: um
    // comando falhado aborta a transaction inteira, e todos os comandos
    // seguintes passam a devolver "current transaction is aborted". O caller
    // continua a correr às cegas e só rebenta no COMMIT, com um erro genérico
    // que não diz nada sobre a causa real — 500 opaco em vez do erro
    // verdadeiro. No MySQL isto passava despercebido, porque lá um comando
    // falhado não contamina os seguintes.
    //
    // Relançar mantém também a simetria com a decisão de cima: se a operação
    // reverter, o log não fica gravado; se o log falhar, a operação reverte.
    if (options.transaction) throw error;
  }
}

module.exports = registerLogAudit;
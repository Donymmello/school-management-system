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
  }
}

module.exports = registerLogAudit;
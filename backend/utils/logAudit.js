const { LogAudit } = require("../models");


async function registerLogAudit({
  userId = null,
  action,
  entity,
  entityId = null,
  description = null,
}) {
  try {
    await LogAudit.create({
      userId,
      action: action,
      entity: entity,
      entityId: entityId,
      description: description,
    });
  } catch (error) {
    console.error("Error to register audit log:", error);
  }
}

module.exports = registerLogAudit;
const { LogAudit, User } = require("../models");


async function getAllLogsAudit(req, res) {
  try {
    const logs = await LogAudit.findAll({
      include: [
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Error to list logs of audit:", error);

    return res.status(500).json({
      message: "Error occurred while listing audit logs.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  BUSCAR LOG POR ID
  ==========================================================
*/
async function getLogAuditById(req, res) {
  try {
    const { id } = req.params;

    const log = await LogAudit.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
    });

    if (!log) {
      return res.status(404).json({
        message: "Log de auditoria não encontrado.",
      });
    }

    return res.status(200).json(log);
  } catch (error) {
    console.error("Error to find audit log:", error);

    return res.status(500).json({
      message: "Error occurred while finding audit log.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR LOGS DO UTILIZADOR AUTENTICADO
  ==========================================================
*/
async function getMyAudits(req, res) {
  try {
    const logs = await LogAudit.findAll({
      where: {
        userId: req.user.id,
      },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Error to list my audit logs:", error);

    return res.status(500).json({
      message: "Error occurred while listing my audit logs.",
      error: error.message,
    });
  }
}

module.exports = {
  getAllLogsAudit,
  getLogAuditById,
  getMyAudits,
};
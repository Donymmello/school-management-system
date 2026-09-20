const { LogAudit, User } = require("../models");


async function getAllLogsAudit(req, res) {
  try {
    // req.schoolId vem do requireSchool: null pro SUPER_ADMIN sem filtro
    // (vê tudo), preso à própria escola pra ADMIN. LogAudit não tem
    // schoolId próprio — o isolamento só é possível via join no User dono
    // do log, com required:true quando há filtro (vira inner join, exclui
    // logs de outras escolas em vez de só anexar o dado).
    const logs = await LogAudit.findAll({
      include: [
        {
          model: User,
          as: "user",
          required: Boolean(req.schoolId),
          attributes: ["id", "name", "email", "role", "active"],
          where: req.schoolId ? { schoolId: req.schoolId } : undefined,
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
          required: Boolean(req.schoolId),
          attributes: ["id", "name", "email", "role", "active"],
          where: req.schoolId ? { schoolId: req.schoolId } : undefined,
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
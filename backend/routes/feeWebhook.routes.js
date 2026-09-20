const express = require("express");
const router = express.Router();

const { receivePaymentConfirmation } = require("../controllers/feeWebhook.controller");

// Sem authMiddleware/requireSchool de propósito — ver comentário em
// backend/controllers/feeWebhook.controller.js. A busca do Fee é por
// reference (única globalmente), não precisa de schoolId pra isolar.
router.post("/payment-confirmation", receivePaymentConfirmation);

module.exports = router;

const { Classroom } = require("../models");

function getTypePrefix(type) {
  const prefixes = {
    NORMAL: "SALA",
    LAB: "LAB",
    AUDITORIUM: "AUD",
    OFFICE: "GAB",
    OTHER: "OUT",
  };

  return prefixes[type] || "SALA";
}

async function generateClassroomCode(data = {}) {
  const { block, type = "NORMAL" } = data;

  const normalizedBlock = block ? String(block).trim().toUpperCase() : null;
  const normalizedType = type || "NORMAL";

  const blockCode = normalizedBlock ? `BL-${normalizedBlock}` : "BL-GERAL";
  const typeCode = getTypePrefix(normalizedType);

  const count = await Classroom.count({
    where: {
      block: normalizedBlock,
      type: normalizedType,
    },
  });

  const sequence = String(count + 1).padStart(3, "0");

  return `${blockCode}-${typeCode}-${sequence}`;
}

module.exports = generateClassroomCode;
const {User, Student, Subject} = require('../models');

/**
 * Generate unique code with prefix, date, and random suffix
 * ponytail: Merged from generateCodigoMutuario and generateReferencia
 */
async function generateCode(prefix, model) {
  let code;
  let exists = true;

  while (exists) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(100000 + Math.random() * 900000);

    code = `${prefix}-${year}${month}${day}-${random}`;

    const record = await model.findOne({
      where: { [prefix === 'MUT' ? 'codigoMutuario' : 'referencia']: code },
    });

    if (!record) {
      exists = false;
    }
  }

  return code;
}

module.exports = {
  generateStudentCode: () => generateCode('STU', Student),
  generateEmployeeCode: () => generateCode('EMP', User),
  generateSubjectCode: () => generateCode('SUBJ', Subject),
  generateCode,
};
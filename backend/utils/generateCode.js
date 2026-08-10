const {User, Student, Subject} = require('../models');

/**
 * Generate unique code with prefix, date, and random suffix.
 * BUG CORRIGIDO: a versão anterior checava duplicidade numa coluna
 * "referencia"/"codigoMutuario" que não existe em nenhum model (Student usa
 * studentCode, User usa employeeCode, Subject usa code) — toda chamada
 * quebrava a consulta. Agora recebe o nome real da coluna de cada model.
 */
async function generateCode(prefix, model, field) {
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
      where: { [field]: code },
    });

    if (!record) {
      exists = false;
    }
  }

  return code;
}

module.exports = {
  generateStudentCode: () => generateCode('STU', Student, 'studentCode'),
  generateEmployeeCode: () => generateCode('EMP', User, 'employeeCode'),
  generateSubjectCode: () => generateCode('SUBJ', Subject, 'code'),
  generateCode,
};
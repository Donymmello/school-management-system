const { Subject } = require("../models");

async function generateSubjectCode() {

    let code;
    let exists = true;

    while (exists) {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const random = Math.floor(1000 + Math.random() * 9000);

        code = `SUBJ${year}${month}${random}`;

        const existingSubject = await Subject.findOne({
            where: { code: code }
        });

        if (!existingSubject) {
            exists = false;
        }
    }

    return code;
} 

module.exports = generateSubjectCode;
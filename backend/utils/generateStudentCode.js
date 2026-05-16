const { Student } = require("../models");

async function generateStudentCode() {

    let code;
    let exists = true;

    while (exists) {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const random = Math.floor(1000 + Math.random() * 9000);

        code = `STU${year}${month}${day}${random}`;

        const existingStudent = await Student.findOne({
            where: { studentCode: code }
        });

        if (!existingStudent) {
            exists = false;
        }
    }

    return code;
} 

module.exports = generateStudentCode;
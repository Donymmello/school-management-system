const { User } = require("../models");

async function generateEmployeeCode() {

    let code;
    let exists = true;

    while (exists) {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const random = Math.floor(1000 + Math.random() * 9000);

        code = `EMP${year}${month}${day}${random}`;

        const existingUser = await User.findOne({
            where: { employeeCode: code }
        });

        if (!existingUser) {
            exists = false;
        }
    }

    return code;
} 

module.exports = generateEmployeeCode;
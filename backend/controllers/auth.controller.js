const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const generateStudentCode = require('../utils/generateStudentCod');
const registerLogAudit = require('../utils/logAudit');


/*  ==========================================================
  BOOTSTRAP ADMIN
  ==========================================================
*/
const bootstrapAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required.",
            });
        }

        const adminExistente = await User.findOne({
            where: { role: "ADMIN" },
        });

        if (adminExistente) {
            return res.status(403).json({
                message: "There is already at least one ADMIN in the system. Bootstrap not allowed.",
            });
        }

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "There is already a user with this email.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: "ADMIN",
            active: true,
        });

        await registerLogAudit({
            userId: user.id,
            action: "BOOTSTRAP_ADMIN",
            entity: "User",
            entityId: user.id,
            description: `First administrator created with email ${user.email}.`,
        });

        return res.status(201).json({
            message: "Initial administrator created successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active,
            },
        });
    } catch (error) {
        console.error("Error creating initial administrator:", error);

        return res.status(500).json({
            message: "Error occurred while creating initial administrator.",
            error: error.message,
        });
    }
};

/*
  ==========================================================
  TOKEN JWT
  ==========================================================
*/
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};

/*
    ==========================================================
    STAFF
    ==========================================================
*/

async function registerStaff(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Only administrators can register staff members.",
            });
        }

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Name, email, password and role are required.",
            });
        }

        const permittedRoles = ["ADMIN", "DIRETOR", "SECRETARIO"];

        if (!permittedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Only ADMIN, DIRETOR or SECRETARIO can be registered.",
                permittedRoles,
            });
        }

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "There is already a user with this email.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role,
            active: true,
        });

        await registerLogAudit({
            userId: user.id,
            action: "REGISTER_STAFF",
            entity: "User",
            entityId: user.id,
            description: `Staff member registered with email ${user.email}.`,
        });

        return res.status(201).json({
            message: "Staff member registered successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active,
            },
        });
    } catch (error) {
        console.error("Error registering staff member:", error);

        return res.status(500).json({
            message: "Error occurred while registering staff member.",
            error: error.message,
        });
    }
};

/*
  ==========================================================
  STUDENT
  ==========================================================
*/

const registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      grade,
      telephone,
      idCard,
      idNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already in use.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "STUDENT",
      active: true,
    });

    const studentCode = generateStudentCod();

    const student = await Student.create({
      studentCode,
      name,
      age,
      grade,
      email,
      telephone,
      idCard,
      idNumber,
      userId: user.id,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "Student registered successfully.",
      token,
      user,
      student,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error registering student.",
      error: error.message,
    });
  }
};

/*
  ==========================================================
  LOGIN
  ==========================================================
*/
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        if (!user.ativo) {
            return res.status(403).json({
                message: "User is inactive. Contact the administrator.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password.",
            });
        }

        const token = generateToken(user);

        await registerLogAudit({
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            description: `successful login for user ${user.email}.`,
        });

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active,
            },
        });
    } catch (error) {
        console.error("Error during login:", error);

        return res.status(500).json({
            message: "Internal error occurred while logging in.",
            error: error.message,
        });
    }
};

/*
  ==========================================================
  PERFIL DO UTILIZADOR AUTENTICADO
  ==========================================================
*/
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ["id", "name", "email", "role", "active", "created_at", "updated_at"],
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);

        return res.status(500).json({
            message: "Internal error occurred while fetching profile.",
            error: error.message,
        });
    }
};

module.exports = {
    bootstrapAdmin,
    registerStaff,
    registerStudent,
    login,
    getMe,
};
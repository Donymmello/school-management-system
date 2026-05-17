const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Student, Teacher, Staff } = require("../models");
const generateStudentCode = require("../utils/generateStudentCode");
const generateEmployeeCode = require("../utils/generateEmployeeCode");
const registerLogAudit = require("../utils/logAudit");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

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
        message: "There is already at least one ADMIN in the system.",
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
    const employeeCode = await generateEmployeeCode();

    const user = await User.create({
      employeeCode,
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
        employeeCode: user.employeeCode,
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

const registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      birthday,
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

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already in use.",
      });
    }

    const existingStudentByEmail = await Student.findOne({
      where: { email },
    });

    if (existingStudentByEmail) {
      return res.status(409).json({
        message: "A student with this email already exists.",
      });
    }

    if (idNumber) {
      const existingStudentByIdNumber = await Student.findOne({
        where: { idNumber },
      });

      if (existingStudentByIdNumber) {
        return res.status(409).json({
          message: "A student with this ID number already exists.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      employeeCode: null,
      name,
      email,
      passwordHash,
      role: "STUDENT",
      active: true,
    });

    const studentCode = await generateStudentCode();

    const student = await Student.create({
      studentCode,
      userId: user.id,
      name,
      email,
      birthday: birthday || null,
      grade: grade || null,
      telephone: telephone || null,
      idCard: idCard || null,
      idNumber: idNumber || null,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "Student registered successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      student,
    });
  } catch (error) {
    console.error("Error registering student:", error);

    return res.status(500).json({
      message: "Error registering student.",
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,

      birthday,
      grade,
      telephone,
      idCard,
      idNumber,
      position,
      department,

      subject,
    } = req.body;

    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only administrators can register users.",
      });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required.",
      });
    }

    const permittedRoles = [
      "ADMIN",
      "DIRECTOR",
      "SECRETARY",
      "STAFF",
      "TEACHER",
      "STUDENT",
    ];

    if (!permittedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
        permittedRoles,
      });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        message: "There is already a user with this email.",
      });
    }

    if (role === "STUDENT") {
      const existingStudentByEmail = await Student.findOne({
        where: { email },
      });

      if (existingStudentByEmail) {
        return res.status(409).json({
          message: "A student with this email already exists.",
        });
      }

      if (idNumber) {
        const existingStudentByIdNumber = await Student.findOne({
          where: { idNumber },
        });

        if (existingStudentByIdNumber) {
          return res.status(409).json({
            message: "A student with this ID number already exists.",
          });
        }
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const employeeCode =
      role === "STUDENT" ? null : await generateEmployeeCode();

    const user = await User.create({
      employeeCode,
      name,
      email,
      passwordHash,
      role,
      active: true,
    });

    let student = null;
    let teacher = null;
    let staff = null;

    if (role === "STUDENT") {
      const studentCode = await generateStudentCode();

      student = await Student.create({
        studentCode,
        userId: user.id,
        name,
        email,
        birthday: birthday || null,
        grade: grade || null,
        telephone: telephone || null,
        idCard: idCard || null,
        idNumber: idNumber || null,
      });
    }

    if (role === "TEACHER") {
      teacher = await Teacher.create({
        employeeCode,
        userId: user.id,
        name,
        email,
        subject: subject || null,
      });
    }

    if (role === "STAFF") {
  staff = await Staff.create({
    userId: user.id,
    employeeCode,
    name,
    email,
    position: position || "Staff",
    department: department || null,
  });
}

    await registerLogAudit({
      userId: req.user.id,
      action: "REGISTER_USER",
      entity: "User",
      entityId: user.id,
      description: `User registered with email ${user.email} and role ${user.role}.`,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      student,
      teacher,
      staff,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(500).json({
      message: "Error occurred while registering user.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!user.active) {
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
      description: `Successful login for user ${user.email}.`,
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
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

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "employeeCode",
        "name",
        "email",
        "role",
        "active",
        "created_at",
        "updated_at",
      ],
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
  registerStudent,
  registerUser,
  login,
  getMe,
};
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Student, Teacher, Staff, School, Turma, PasswordResetToken, sequelize } = require("../models");
const { generateStudentCode, generateEmployeeCode } = require("../utils/generateCode");
const registerLogAudit = require("../utils/logAudit");
const {
  isUniqueConstraintError,
  respondUniqueConstraint,
  isValidationError,
  respondValidationError,
} = require("../utils/dbErrors");
const sendEmail = require("../utils/email");
const logger = require("../utils/logger");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const mapUserToResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  schoolId: user.schoolId,
  active: user.active,
  ...(user.school
    ? {
        school: {
          id: user.school.id,
          name: user.school.name,
          address: user.school.address,
          academicModel: user.school.academicModel,
        },
      }
    : {}),
});

// Cria o dono da plataforma (SUPER_ADMIN, sem escola). Só existe um no sistema todo.
const bootstrapAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const [superAdminExisting, existingUser] = await Promise.all([
      User.findOne({ where: { role: "SUPER_ADMIN" }, attributes: ["id"] }),
      User.findOne({ where: { email }, attributes: ["id"] }),
    ]);

    if (superAdminExisting) {
      return res.status(403).json({
        message: "There is already a SUPER_ADMIN in the system.",
      });
    }

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
      role: "SUPER_ADMIN",
      schoolId: null,
      active: true,
    });

    await registerLogAudit({
      userId: user.id,
      action: "BOOTSTRAP_ADMIN",
      entity: "User",
      entityId: user.id,
      description: `Platform SUPER_ADMIN created with email ${user.email}.`,
    });

    return res.status(201).json({
      message: "Platform administrator created successfully.",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    logger.requestError("[Bootstrap Error]", req, error);
    return res.status(500).json({ message: "Error occurred while creating the platform administrator." });
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
      turmaId,
    } = req.body;

    if (!req.user || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only administrators can register users.",
      });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required.",
      });
    }

    // SECRETARY foi unificado em STAFF (papéis se sobrepunham por completo —
    // ver docs/project-rules.md, seção 7): não é mais oferecido pra
    // cadastro de usuário novo. Continua existindo no ENUM do banco só pra
    // não quebrar linhas antigas que já tenham esse valor.
    const permittedRoles = [
      "ADMIN",
      "DIRECTOR",
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

    // ADMIN só cria gente dentro da própria escola. SUPER_ADMIN não tem escola
    // própria, então precisa indicar em qual escola o usuário entra.
    const schoolId = req.user.role === "ADMIN" ? req.user.schoolId : req.body.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        message:
          req.user.role === "ADMIN"
            ? "Your admin account is not linked to a school."
            : "schoolId is required when a SUPER_ADMIN registers a user.",
      });
    }

    const [existingUser, existingStudent] = await Promise.all([
      User.findOne({ where: { email }, attributes: ["id"] }),
      role === "STUDENT"
        ? Student.findOne({
            where: {
              [Op.or]: [
                { email },
                ...(idNumber ? [{ idNumber }] : []),
              ],
            },
            attributes: ["id", "email", "idNumber"],
          })
        : null,
    ]);

    if (existingUser) {
      return res.status(409).json({
        message: "There is already a user with this email.",
      });
    }

    if (existingStudent) {
      if (existingStudent.email === email) {
        return res.status(409).json({ message: "A student with this email already exists." });
      }
      return res.status(409).json({ message: "A student with this ID number already exists." });
    }

    // Turma pedagógica (SECONDARY) — ver docs/project-rules.md, seção 6
    // (fase 6 do roadmap de execução). Opcional: nada impede cadastrar o
    // aluno sem turma ainda e atribuir depois via updateStudent.
    if (role === "STUDENT" && turmaId) {
      const turma = await Turma.findOne({ where: { id: turmaId, schoolId } });
      if (!turma) return res.status(404).json({ message: "Turma not found in this school." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employeeCode = role === "STUDENT" ? null : await generateEmployeeCode();

    const result = await sequelize.transaction(async (t) => {
      const user = await User.create(
        {
          employeeCode,
          name,
          email,
          passwordHash,
          role,
          schoolId,
          active: true,
        },
        { transaction: t }
      );

      let student = null;
      let teacher = null;
      let staff = null;

      if (role === "STUDENT") {
        const studentCode = await generateStudentCode();
        student = await Student.create(
          {
            studentCode,
            userId: user.id,
            schoolId,
            name,
            email,
            birthday: birthday || null,
            grade: grade || null,
            telephone: telephone || null,
            idCard: idCard || null,
            idNumber: idNumber || null,
            turmaId: turmaId || null,
          },
          { transaction: t }
        );
      }

      if (role === "TEACHER") {
        teacher = await Teacher.create(
          {
            employeeCode,
            userId: user.id,
            schoolId,
            name,
            email,
            subject: subject || null,
          },
          { transaction: t }
        );
      }

      if (role === "STAFF") {
        staff = await Staff.create(
          {
            userId: user.id,
            schoolId,
            employeeCode,
            name,
            email,
            position: position || "Staff",
            department: department || null,
          },
          { transaction: t }
        );
      }

      await registerLogAudit(
        {
          userId: req.user.id,
          action: "REGISTER_USER",
          entity: "User",
          entityId: user.id,
          description: `User registered with email ${user.email} and role ${user.role}.`,
        },
        { transaction: t }
      );

      return { user, student, teacher, staff };
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: mapUserToResponse(result.user),
      student: result.student,
      teacher: result.teacher,
      staff: result.staff,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    if (isValidationError(error)) return respondValidationError(res, error);
    logger.requestError("[Error registering user]", req, error);
    return res.status(500).json({ message: "Error occurred while registering user." });
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
      schoolId,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (!schoolId) {
      // ponytail: rota pública sem noção de subdomínio/slug ainda — exige schoolId
      // explícito no body. Trocar por resolução via slug/subdomínio quando o
      // onboarding de escola (roadmap item 2) definir como o front informa o tenant.
      return res.status(400).json({ message: "schoolId is required." });
    }

    const school = await School.findByPk(schoolId, {
      attributes: ["id", "name", "address", "status", "academicModel"],
    });
    if (!school || school.status !== "ACTIVE") {
      return res.status(404).json({ message: "School not found or inactive." });
    }

    // 2. CORREÇÃO: Removido o User.findOne isolado que duplicava a variável 'existingUser'
    const [existingUser, existingStudent] = await Promise.all([
      User.findOne({ where: { email }, attributes: ["id"] }),
      Student.findOne({
        where: {
          [Op.or]: [
            ...(idCard ? [{ idCard }] : []),
            ...(idNumber ? [{ idNumber }] : []),
          ],
        },
        attributes: ["id", "idCard", "idNumber"],
      }),
    ]);

    if (existingUser) return res.status(409).json({ message: "Email already in use." });

    if (existingStudent) {
      const msg =
        existingStudent.idCard === idCard
          ? "A student with this ID card already exists."
          : "A student with this ID number already exists.";
      return res.status(409).json({ message: msg });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sequelize.transaction(async (t) => {
      const user = await User.create(
        {
          employeeCode: null,
          name,
          email,
          passwordHash,
          role: "STUDENT",
          schoolId,
          active: true,
        },
        { transaction: t }
      );

      const studentCode = await generateStudentCode();

      const student = await Student.create(
        {
          studentCode,
          userId: user.id,
          schoolId,
          name,
          email,
          birthday: birthday || null,
          grade: grade || null,
          telephone: telephone || null,
          idCard: idCard || null,
          idNumber: idNumber || null,
        },
        { transaction: t }
      );

      // CORREÇÃO: Tratamento para evitar quebra caso registerStudent seja uma rota pública (sem req.user)
      await registerLogAudit(
        {
          userId: req.user ? req.user.id : user.id,
          action: "REGISTER_STUDENT",
          entity: "Student",
          entityId: student.id,
          description: `Student registered with email ${student.email}.`,
        },
        { transaction: t }
      );

      return { user, student };
    });

    // result.user não veio de uma query com include: [School] — anexa a
    // instância já buscada acima pra validação, sem round-trip extra.
    result.user.school = school;

    return res.status(201).json({
      message: "Student registered successfully.",
      token: generateToken(result.user),
      user: mapUserToResponse(result.user),
      student: {
        id: result.student.id,
        studentCode: result.student.studentCode,
        name: result.student.name,
        userId: result.student.userId,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    logger.requestError("[Error registering student]", req, error);
    return res.status(500).json({
      message: "Error registering student.",
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

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: School,
          as: "school",
          attributes: ["id", "name", "address", "status", "academicModel"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // IMPORTANTE: valida a senha ANTES de revelar qualquer coisa sobre o
    // status da conta (ativo/inativo, escola ativa/inativa). Checar esses
    // status antes da senha era um bug de segurança real — permitia que
    // qualquer um, sem saber a senha, descobrisse se um email cadastrado
    // pertence a uma conta desativada ou a uma escola suspensa, só
    // chamando /auth/login com esse email e uma senha qualquer (oracle de
    // enumeração de contas). Com a senha validada primeiro, uma tentativa
    // sem a senha correta sempre cai no 401 genérico, exista a conta ativa
    // ou não.
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password.",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "User is inactive. Contact the administrator.",
      });
    }

    // Bloqueio de acesso por escola inativa (inadimplência/suspensão) — ver
    // docs/project-rules.md, roadmap item 4 (Billing). SUPER_ADMIN não tem
    // escola (schoolId null), então nunca cai aqui.
    if (user.school && user.school.status !== "ACTIVE") {
      return res.status(403).json({
        message: "This school's account is not active. Contact the platform administrator.",
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
      user: mapUserToResponse(user),
    });
  } catch (error) {
    logger.requestError("[Error during login]", req, error);
    return res.status(500).json({ message: "Internal error occurred while logging in." });
  }
};

const getMe = async (req, res) => {
  try {
    // 3. CORREÇÃO: Ajustados atributos para convenção padrão Sequelize (createdAt/updatedAt)
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "employeeCode",
        "schoolId",
        "name",
        "email",
        "role",
        "active",
        "created_at",
        "updated_at",
      ],
      // Precisa do include mesmo sem estar no getMe original: é o único jeito
      // do front saber o academicModel da escola depois de um refresh de
      // página (AuthContext chama fetchMe() no mount, não só no login()).
      include: [
        { model: School, as: "school", attributes: ["id", "name", "address", "academicModel"] },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json(user);
  } catch (error) {
    logger.requestError("[Error fetching profile]", req, error);
    return res.status(500).json({ message: "Internal error occurred while fetching profile." });
  }
};

// Trocar a própria senha, logado. Fecha uma promessa que já existia no
// formulário de criação de aluno/professor ("pode trocar depois do primeiro
// acesso") mas nunca tinha sido implementada — ver docs/project-rules.md,
// seção 6, item 5. Diferente de forgotPassword/resetPassword (que são pra
// quem perdeu acesso, ainda sem envio de email de verdade — ver seção 7):
// aqui a pessoa já está autenticada, só precisa confirmar a senha atual.
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "newPassword must be at least 6 characters long." });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await registerLogAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      description: "Password changed by the user.",
    });

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    logger.requestError("[Error changing password]", req, error);
    return res.status(500).json({ message: "An error occurred while changing the password." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email é obrigatório." });

    const user = await User.findOne({ where: { email }, attributes: ["id", "name", "email"] });

    // Mensagem genérica sempre igual, exista o email ou não — não dá pra
    // usar isso pra descobrir se um email está cadastrado no sistema.
    const genericResponse = { message: "Se o email existir, receberá instruções para redefinição." };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({ userId: user.id, token, expiresAt });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/redefinir-senha?token=${token}`;

    try {
      await sendEmail(
        user.email,
        "Redefinição de senha",
        `Olá, ${user.name}.\n\nRecebemos um pedido para redefinir a sua senha. Clique no link abaixo (válido por 15 minutos):\n\n${resetLink}\n\nSe não foi você quem pediu, pode ignorar este email.`
      );
    } catch (emailError) {
      // sendEmail() depende de EMAIL_USER/EMAIL_PASS (Gmail via nodemailer,
      // ver backend/utils/email.js) — se não estiver configurado (ex: dev
      // local sem essas credenciais), não derruba o pedido: cai pro
      // console.log de dev que já existia antes, pra não bloquear teste
      // local sem conta de email de verdade.
      logger.warn("[ForgotPassword] Falha ao enviar email, caindo para log de dev", {
        error: emailError.message,
        userId: req?.user?.id ?? null,
        endpoint: req.originalUrl,
        method: req.method,
      });
      console.log(`[DEV ONLY] Link de Reset: ${resetLink}`);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    logger.requestError("[ForgotPassword Error]", req, error);
    return res.status(500).json({ message: "Erro interno." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token e password são obrigatórios" });

    const resetToken = await PasswordResetToken.findOne({ where: { token, used: false } });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Token inválido ou expirado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sequelize.transaction(async (t) => {
      await User.update({ passwordHash: hashedPassword }, { where: { id: resetToken.userId }, transaction: t });
      resetToken.used = true;
      await resetToken.save({ transaction: t });

      await registerLogAudit(
        {
          userId: resetToken.userId,
          action: "UPDATE",
          entity: "User",
          entityId: resetToken.userId,
          description: "Password redefinida via fluxo de esqueci minha senha.",
        },
        { transaction: t }
      );
    });

    return res.status(200).json({ message: "Password redefinida com sucesso." });
  } catch (error) {
    logger.requestError("[ResetPassword Error]", req, error);
    return res.status(500).json({ message: "Erro interno." });
  }
};

module.exports = {
  bootstrapAdmin,
  registerStudent,
  registerUser,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  generateToken,
  mapUserToResponse,
};
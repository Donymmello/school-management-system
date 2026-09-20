const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const School = sequelize.define("School", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plan: {
    type: DataTypes.ENUM("FREE", "BASIC", "PREMIUM"),
    allowNull: false,
  },
  // Decide se a escola opera no modelo de ensino secundário (turma fixa por
  // série, Classroom/Student.grade/Grade/Attendance) ou técnico/superior
  // (créditos/ofertas, Course/CourseOffering/Enrollment/Assessment). Fixo no
  // cadastro de propósito — ver docs/project-rules.md, seção 5: os dois
  // modelos de dado são incompatíveis o suficiente pra não valer a pena um
  // toggle editável depois sem uma migração de dado real por trás.
  academicModel: {
    type: DataTypes.ENUM("SECONDARY", "HIGHER_ED"),
    allowNull: false,
    field: "academic_model",
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
    defaultValue: "ACTIVE"
  },
  // Moeda usada pras propinas (Fee) dessa escola — cada Fee copia esse
  // valor no momento da criação, então mudar isso aqui não altera
  // lançamentos já existentes. Editável por ADMIN/SUPER_ADMIN, sem lista
  // fixa de valores (o sistema aceita qualquer código de 3 letras, não só
  // MZN — uma escola pode querer cobrar em USD, por exemplo). Default MZN
  // (Metical) porque o mercado principal do sistema é Moçambique.
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: "MZN",
    field: "currency",
  },
  // "Entidade" do sistema de referência de pagamento (padrão Multicaixa
  // Express/ATM usado em Moçambique/Angola: Entidade + Referência + Valor).
  // Configurável pela própria escola (ver docs/project-rules.md, seção 6,
  // fase 8) — nula até a escola configurar; Fee.entity só é preenchido se
  // isso estiver definido no momento em que a propina é criada. NÃO é uma
  // entidade validada por nenhum banco de verdade, é só o código que a
  // escola decide usar/divulgar aos pais — sem integração real com
  // banco/M-Pesa neste sistema (ver ressalvas na fase 8 do roadmap).
  paymentEntity: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: "payment_entity",
  },
},
{
    tableName: "schools",
    underscored: true,
    timestamps: true,
});

module.exports = School;
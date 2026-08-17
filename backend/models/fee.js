const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Propina/mensalidade do aluno. Ledger manual — v1 explícita:
  - Sem cálculo automático de multa/juros; STAFF lança e atualiza o status
    à mão.
  - "Atrasado" NÃO é um valor de status guardado: é derivado em tela
    (status === PENDING && dueDate no passado), pra não deixar dado
    parado ficar mentindo depois que o relógio passa do vencimento.
  - Sem gateway de pagamento — o pagamento acontece fora do sistema
    (transferência, dinheiro etc.), STAFF só registra que aconteceu.
  - Sem schoolId próprio: isolamento por escola via join no Student dono
    do registro, mesmo padrão de Grade/Attendance (ver docs/project-rules.md,
    seção 5).
  Ver docs/project-rules.md, seção 6, item 5 (Portal do Staff) e seção 7.
*/
const Fee = sequelize.define(
  "Fee",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "description",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "amount",
    },
    // Moeda copiada da School no momento da criação (não é um FK vivo pra
    // School.currency) — se a escola trocar de moeda depois, lançamentos
    // antigos continuam mostrando a moeda em que foram cobrados de fato.
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      field: "currency",
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "due_date",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID"),
      allowNull: false,
      defaultValue: "PENDING",
      field: "status",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "notes",
    },
  },
  {
    tableName: "fees",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["student_id"] }],
  }
);

module.exports = Fee;

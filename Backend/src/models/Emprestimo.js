const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Usuario = require("./Usuario");
const Livro = require("./Livro");

const Emprestimo = sequelize.define("Emprestimo", {
  data_emprestimo: { type: DataTypes.DATEONLY, allowNull: false },
  data_prevista: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM("Ativo", "Devolvido", "Atrasado"),
    defaultValue: "Ativo",
  },
});

// Relacionamentos
Usuario.hasMany(Emprestimo, { foreignKey: "usuario_id" });
Emprestimo.belongsTo(Usuario, { foreignKey: "usuario_id" });

Livro.hasMany(Emprestimo, { foreignKey: "livro_id" });
Emprestimo.belongsTo(Livro, { foreignKey: "livro_id" });

module.exports = Emprestimo;

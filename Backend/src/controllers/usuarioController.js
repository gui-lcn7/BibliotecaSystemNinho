const Usuario = require("../models/Usuario");

module.exports = {
  async listar(req, res) {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  },
  async criar(req, res) {
    const { nome, email } = req.body;
    const usuario = await Usuario.create({ nome, email });
    res.json(usuario);
  },
  async atualizar(req, res) {
    const { id } = req.params;
    const { nome, email } = req.body;
    await Usuario.update({ nome, email }, { where: { id } });
    res.json({ message: "Usuário atualizado" });
  },
  async deletar(req, res) {
    const { id } = req.params;
    await Usuario.destroy({ where: { id } });
    res.json({ message: "Usuário deletado" });
  }
};

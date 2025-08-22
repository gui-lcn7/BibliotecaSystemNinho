const Emprestimo = require("../models/Emprestimo");

module.exports = {
  async listar(req, res) {
    const emprestimos = await Emprestimo.findAll();
    res.json(emprestimos);
  },
  async criar(req, res) {
    const { usuario_id, livro_id, data_emprestimo, data_prevista } = req.body;
    const emprestimo = await Emprestimo.create({ usuario_id, livro_id, data_emprestimo, data_prevista });
    res.json(emprestimo);
  },
  async atualizar(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    await Emprestimo.update({ status }, { where: { id } });
    res.json({ message: "Empréstimo atualizado" });
  },
  async deletar(req, res) {
    const { id } = req.params;
    await Emprestimo.destroy({ where: { id } });
    res.json({ message: "Empréstimo deletado" });
  }
};

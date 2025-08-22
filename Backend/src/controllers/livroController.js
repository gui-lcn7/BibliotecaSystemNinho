const Livro = require("../models/Livro");

module.exports = {
  async listar(req, res) {
    const livros = await Livro.findAll();
    res.json(livros);
  },
  async criar(req, res) {
    const { titulo, autor, categoria, ano_publicacao } = req.body;
    const livro = await Livro.create({ titulo, autor, categoria, ano_publicacao });
    res.json(livro);
  },
  async atualizar(req, res) {
    const { id } = req.params;
    const { titulo, autor, categoria, ano_publicacao } = req.body;
    await Livro.update({ titulo, autor, categoria, ano_publicacao }, { where: { id } });
    res.json({ message: "Livro atualizado" });
  },
  async deletar(req, res) {
    const { id } = req.params;
    await Livro.destroy({ where: { id } });
    res.json({ message: "Livro deletado" });
  }
};

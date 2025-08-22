const express = require("express");
const usuarioController = require("../controllers/usuarioController");
const livroController = require("../controllers/livroController");
const emprestimoController = require("../controllers/emprestimoController");

const router = express.Router();

// Usuários
router.get("/usuarios", usuarioController.listar);
router.post("/usuarios", usuarioController.criar);
router.put("/usuarios/:id", usuarioController.atualizar);
router.delete("/usuarios/:id", usuarioController.deletar);

// Livros
router.get("/livros", livroController.listar);
router.post("/livros", livroController.criar);
router.put("/livros/:id", livroController.atualizar);
router.delete("/livros/:id", livroController.deletar);

// Empréstimos
router.get("/emprestimos", emprestimoController.listar);
router.post("/emprestimos", emprestimoController.criar);
router.put("/emprestimos/:id", emprestimoController.atualizar);
router.delete("/emprestimos/:id", emprestimoController.deletar);

module.exports = router;

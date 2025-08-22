CREATE DATABASE biblioteca;
USE biblioteca;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE livros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  autor VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  ano_publicacao INT NOT NULL
);

CREATE TABLE emprestimos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  livro_id INT NOT NULL,
  data_emprestimo DATE NOT NULL,
  data_prevista DATE NOT NULL,
  status ENUM('Ativo', 'Devolvido', 'Atrasado') DEFAULT 'Ativo',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (livro_id) REFERENCES livros(id)
);

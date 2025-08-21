document.getElementById("formLogin").addEventListener("submit", function (event) {
  event.preventDefault();

  const cpf = document.getElementById("cpf").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (cpf === "" || senha === "") {
    alert("Por favor, preencha CPF e Senha.");
    return;
  }

  if (cpf.length !== 11 || senha.length > 8) {
    alert(
      "CPF deve conter exatamente 11 caracteres e Senha deve ter no máximo 8 caracteres.\n" +
      "Você digitou:\nCPF: " + cpf.length + " caracteres\nSenha: " + senha.length + " caracteres"
    );
    return;
  }

  document.getElementById("formLogin").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  initApp();
});

const DB_KEYS = {
  usuarios: "bn_usuarios",
  livros: "bn_livros",
  emprestimos: "bn_emprestimos",
  seq: "bn_seq"
};

function load(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function nextId(entity) {
  const seq = JSON.parse(localStorage.getItem(DB_KEYS.seq) || "{}");
  seq[entity] = (seq[entity] || 0) + 1;
  localStorage.setItem(DB_KEYS.seq, JSON.stringify(seq));
  return seq[entity];
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function hojeISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function compareISO(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
function nomeUsuario(id, usuarios) {
  const u = usuarios.find(x => x.id === id);
  return u ? `${u.nome} (#${u.id})` : `Usuário ${id}`;
}
function tituloLivro(id, livros) {
  const l = livros.find(x => x.id === id);
  return l ? `${l.titulo} (#${l.id})` : `Livro ${id}`;
}
function isLivroDisponivel(livroId, emprestimos) {
  return !emprestimos.some(e => e.livro_id === livroId && e.status === "Ativo");
}
function recalcAtraso() {
  const emprestimos = load(DB_KEYS.emprestimos);
  const today = hojeISO();
  let changed = false;
  for (const e of emprestimos) {
    if (e.status === "Ativo" && compareISO(today, e.data_prevista) === 1) {
      e.status = "Atrasado";
      changed = true;
    }
  }
  if (changed) save(DB_KEYS.emprestimos, emprestimos);
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab[data-tab]");
  const panes = document.querySelectorAll(".pane");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "emprestimos") fillDropdownsEmprestimo();
      if (btn.dataset.tab === "gerenciar") renderGerenciamento();
    });
  });

  document.getElementById("btnSair").addEventListener("click", () => {
    document.getElementById("app").classList.add("hidden");
    document.getElementById("formLogin").classList.remove("hidden");
  });
}

function setupUsuarios() {
  const form = document.getElementById("formUsuario");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("usuarioNome").value.trim();
    const email = document.getElementById("usuarioEmail").value.trim();

    if (!nome) return alert("Informe o nome.");
    if (!emailRegex.test(email)) return alert("Informe um e-mail válido.");

    const usuarios = load(DB_KEYS.usuarios);
    if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return alert("Já existe um usuário com este e-mail.");
    }

    usuarios.push({ id: nextId("usuarios"), nome, email });
    save(DB_KEYS.usuarios, usuarios);
    form.reset();
    renderUsuarios();
    fillDropdownsEmprestimo();
    alert("Usuário cadastrado com sucesso!");
  });

  renderUsuarios();
}

function renderUsuarios() {
  const tbody = document.querySelector("#tabelaUsuarios tbody");
  const usuarios = load(DB_KEYS.usuarios);
  tbody.innerHTML = "";

  usuarios.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td class="actions">
        <button class="btn secondary" data-edit="${u.id}">Editar</button>
        <button class="btn red" data-del="${u.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("usuariosCount").textContent = `${usuarios.length} registro(s)`;

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.del);
      const emprestimos = load(DB_KEYS.emprestimos);
      if (emprestimos.some(e => e.usuario_id === id)) {
        return alert("Não é possível excluir: o usuário possui empréstimos vinculados.");
      }
      const usuarios = load(DB_KEYS.usuarios).filter(u => u.id !== id);
      save(DB_KEYS.usuarios, usuarios);
      renderUsuarios();
      fillDropdownsEmprestimo();
    });
  });

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.edit);
      const usuarios = load(DB_KEYS.usuarios);
      const u = usuarios.find(x => x.id === id);
      if (!u) return;

      const novoNome = prompt("Novo nome:", u.nome);
      if (novoNome === null) return;
      const novoEmail = prompt("Novo e-mail:", u.email);
      if (novoEmail === null) return;
      if (!emailRegex.test(novoEmail.trim())) return alert("E-mail inválido.");

      if (usuarios.some(x => x.id !== id && x.email.toLowerCase() === novoEmail.trim().toLowerCase())) {
        return alert("Já existe um usuário com este e-mail.");
      }

      u.nome = novoNome.trim();
      u.email = novoEmail.trim();
      save(DB_KEYS.usuarios, usuarios);
      renderUsuarios();
      fillDropdownsEmprestimo();
    });
  });
}

function setupLivros() {
  const form = document.getElementById("formLivro");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const titulo = document.getElementById("livroTitulo").value.trim();
    const autor = document.getElementById("livroAutor").value.trim();
    const categoria = document.getElementById("livroCategoria").value.trim();
    const ano = Number(document.getElementById("livroAno").value);

    if (!titulo || !autor || !categoria || !ano) {
      return alert("Preencha todos os campos do livro.");
    }
    if (ano < 1000 || ano > 2100) return alert("Ano de publicação inválido.");

    const livros = load(DB_KEYS.livros);
    livros.push({
      id: nextId("livros"),
      titulo, autor, categoria, ano_publicacao: ano
    });
    save(DB_KEYS.livros, livros);
    form.reset();
    renderLivros();
    fillDropdownsEmprestimo();
    alert("Livro cadastrado com sucesso!");
  });

  renderLivros();
}

function renderLivros() {
  const tbody = document.querySelector("#tabelaLivros tbody");
  const livros = load(DB_KEYS.livros);
  const emprestimos = load(DB_KEYS.emprestimos);
  tbody.innerHTML = "";

  livros.forEach(l => {
    const disponivel = isLivroDisponivel(l.id, emprestimos);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.id}</td>
      <td>${l.titulo}</td>
      <td>${l.autor}</td>
      <td>${l.categoria}</td>
      <td>${l.ano_publicacao}</td>
      <td>${disponivel ? "Sim" : "Não"}</td>
      <td class="actions">
        <button class="btn secondary" data-edit="${l.id}">Editar</button>
        <button class="btn red" data-del="${l.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("livrosCount").textContent = `${livros.length} registro(s)`;

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.del);
      const emprestimos = load(DB_KEYS.emprestimos);
      if (emprestimos.some(e => e.livro_id === id)) {
        return alert("Não é possível excluir: o livro possui empréstimos vinculados.");
      }
      const livros = load(DB_KEYS.livros).filter(l => l.id !== id);
      save(DB_KEYS.livros, livros);
      renderLivros();
      fillDropdownsEmprestimo();
    });
  });

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.edit);
      const livros = load(DB_KEYS.livros);
      const l = livros.find(x => x.id === id);
      if (!l) return;

      const novoTitulo = prompt("Novo título:", l.titulo);
      if (novoTitulo === null) return;
      const novoAutor = prompt("Novo autor:", l.autor);
      if (novoAutor === null) return;
      const novaCategoria = prompt("Nova categoria:", l.categoria);
      if (novaCategoria === null) return;
      const novoAno = prompt("Novo ano de publicação:", l.ano_publicacao);
      if (novoAno === null) return;

      const anoNum = Number(novoAno);
      if (!novoTitulo.trim() || !novoAutor.trim() || !novaCategoria.trim() || !anoNum || anoNum < 1000 || anoNum > 2100) {
        return alert("Dados inválidos.");
      }

      l.titulo = novoTitulo.trim();
      l.autor = novoAutor.trim();
      l.categoria = novaCategoria.trim();
      l.ano_publicacao = anoNum;
      save(DB_KEYS.livros, livros);
      renderLivros();
      fillDropdownsEmprestimo();
    });
  });
}

function setupEmprestimos() {
  const form = document.getElementById("formEmprestimo");

  const dtEmp = document.getElementById("dataEmprestimo");
  const dtPrev = document.getElementById("dataPrevista");
  dtEmp.value = hojeISO();
  dtEmp.min = hojeISO();
  dtPrev.min = hojeISO();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuarioId = Number(document.getElementById("emprestimoUsuario").value);
    const livroId = Number(document.getElementById("emprestimoLivro").value);
    const dataEmp = document.getElementById("dataEmprestimo").value;
    const dataPrev = document.getElementById("dataPrevista").value;

    if (!usuarioId || !livroId || !dataEmp || !dataPrev) {
      return alert("Preencha todos os campos do empréstimo.");
    }
    if (compareISO(dataPrev, dataEmp) === -1) {
      return alert("A data prevista deve ser igual ou posterior à data de empréstimo.");
    }

    const emprestimos = load(DB_KEYS.emprestimos);
    if (!isLivroDisponivel(livroId, emprestimos)) {
      return alert("Este livro já está emprestado (status Ativo).");
    }

    const novo = {
      id: nextId("emprestimos"),
      usuario_id: usuarioId,
      livro_id: livroId,
      data_emprestimo: dataEmp,
      data_prevista: dataPrev,
      status: "Ativo"
    };

    emprestimos.push(novo);
    save(DB_KEYS.emprestimos, emprestimos);

    renderEmprestimosRecentes();
    renderLivros();
    fillDropdownsEmprestimo();
    alert("Empréstimo registrado com sucesso!");
    form.reset();
    document.getElementById("dataEmprestimo").value = hojeISO();
    document.getElementById("dataPrevista").min = hojeISO();
  });

  fillDropdownsEmprestimo();
  renderEmprestimosRecentes();
}

function fillDropdownsEmprestimo() {
  const selUsu = document.getElementById("emprestimoUsuario");
  const selLiv = document.getElementById("emprestimoLivro");
  if (!selUsu || !selLiv) return;

  const usuarios = load(DB_KEYS.usuarios);
  const livros = load(DB_KEYS.livros);
  const emprestimos = load(DB_KEYS.emprestimos);

  selUsu.innerHTML = '<option value="">Selecione um usuário</option>';
  usuarios.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.nome} (#${u.id})`;
    selUsu.appendChild(opt);
  });

  selLiv.innerHTML = '<option value="">Selecione um livro</option>';
  livros.forEach(l => {
    const disponivel = isLivroDisponivel(l.id, emprestimos);
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = `${l.titulo} (#${l.id})${disponivel ? "" : " - (Indisponível)"}`;
    if (!disponivel) opt.disabled = true;
    selLiv.appendChild(opt);
  });
}

function renderEmprestimosRecentes() {
  recalcAtraso();
  const tbody = document.querySelector("#tabelaEmprestimosRecentes tbody");
  const emprestimos = load(DB_KEYS.emprestimos).slice(-10).reverse();
  const usuarios = load(DB_KEYS.usuarios);
  const livros = load(DB_KEYS.livros);

  tbody.innerHTML = "";
  emprestimos.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${nomeUsuario(e.usuario_id, usuarios)}</td>
      <td>${tituloLivro(e.livro_id, livros)}</td>
      <td>${e.data_emprestimo}</td>
      <td>${e.data_prevista}</td>
      <td>${e.status}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("emprestimosCount").textContent =
    `${load(DB_KEYS.emprestimos).length} registro(s)`;
}

function setupGerenciamento() {
  document.getElementById("filtroStatus").addEventListener("change", renderGerenciamento);
  document.getElementById("btnRecalcularAtraso").addEventListener("click", () => {
    recalcAtraso();
    renderGerenciamento();
  });
  renderGerenciamento();
}

function renderGerenciamento() {
  recalcAtraso();
  const filtro = document.getElementById("filtroStatus").value;
  const tbody = document.querySelector("#tabelaGerenciamento tbody");
  const emprestimos = load(DB_KEYS.emprestimos);
  const usuarios = load(DB_KEYS.usuarios);
  const livros = load(DB_KEYS.livros);

  let lista = [...emprestimos];
  if (filtro !== "todos") {
    lista = lista.filter(e => e.status === filtro);
  }

  const ordemStatus = { "Atrasado": 0, "Ativo": 1, "Devolvido": 2 };
  lista.sort((a, b) => {
    const st = (ordemStatus[a.status] ?? 3) - (ordemStatus[b.status] ?? 3);
    if (st !== 0) return st;
    return compareISO(a.data_prevista, b.data_prevista);
  });

  tbody.innerHTML = "";
  lista.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${nomeUsuario(e.usuario_id, usuarios)}</td>
      <td>${tituloLivro(e.livro_id, livros)}</td>
      <td>${e.data_emprestimo}</td>
      <td>${e.data_prevista}</td>
      <td>
        <select class="inline" data-status="${e.id}">
          <option value="Ativo" ${e.status === "Ativo" ? "selected" : ""}>Ativo</option>
          <option value="Devolvido" ${e.status === "Devolvido" ? "selected" : ""}>Devolvido</option>
          <option value="Atrasado" ${e.status === "Atrasado" ? "selected" : ""}>Atrasado</option>
        </select>
      </td>
      <td class="actions">
        <button class="btn" data-save="${e.id}">Salvar</button>
        <button class="btn red" data-del="${e.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-save]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.save);
      const sel = tbody.querySelector(`[data-status="${id}"]`);
      const novoStatus = sel.value;

      const emprestimos = load(DB_KEYS.emprestimos);
      const e = emprestimos.find(x => x.id === id);
      if (!e) return;

      
      if (novoStatus === "Ativo") {
        const temAtivoMesmoLivro = emprestimos.some(x => x.id !== id && x.livro_id === e.livro_id && x.status === "Ativo");
        if (temAtivoMesmoLivro) {
          alert("Não é possível reativar: o livro já está Ativo em outro empréstimo.");
          renderGerenciamento();
          return;
        }
      }

      e.status = novoStatus;
      save(DB_KEYS.emprestimos, emprestimos);
      renderGerenciamento();
      renderLivros();
      fillDropdownsEmprestimo();
    });
  });

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.del);
      if (!confirm("Excluir este registro de empréstimo?")) return;
      const emprestimos = load(DB_KEYS.emprestimos).filter(e => e.id !== id);
      save(DB_KEYS.emprestimos, emprestimos);
      renderGerenciamento();
      renderEmprestimosRecentes();
      renderLivros();
      fillDropdownsEmprestimo();
    });
  });
}

function initApp() {
  setupTabs();
  setupUsuarios();
  setupLivros();
  setupEmprestimos();
  setupGerenciamento();
}
// ==================== DADOS ====================
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

let editIndex = null;
let barChart, pieChart;

// ==================== CARTÕES ====================
function salvarCartao() {
  const nome = cartaoNome.value.trim();
  const fechamento = cartaoFechamento.value;
  const vencimento = cartaoVencimento.value;

  if (!nome || !fechamento || !vencimento) {
    alert("Preencha todos os dados do cartão");
    return;
  }

  cartoes.push({ nome, fechamento, vencimento });
  persistirCartoes();
  renderCartoes();

  cartaoNome.value = "";
  cartaoFechamento.value = "";
  cartaoVencimento.value = "";
}

function renderCartoes() {
  listaCartoes.innerHTML = "";
  cartaoSelect.innerHTML = "<option value=''>Sem cartão</option>";

  cartoes.forEach(c => {
    listaCartoes.innerHTML += `
      <li>💳 ${c.nome} — Fecha: ${c.fechamento} | Vence: ${c.vencimento}</li>
    `;
    cartaoSelect.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
  });
}

function persistirCartoes() {
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
}

// ==================== LANÇAMENTOS ====================
function salvarLancamento() {
  const obj = {
    tipo: tipo.value,
    categoria: categoria.value,
    descricao: descricao.value,
    valor: +valor.value,
    cartao: cartaoSelect.value || null
  };

  if (!obj.valor || !obj.categoria) {
    alert("Preencha os dados do lançamento");
    return;
  }

  if (editIndex !== null) {
    lancamentos[editIndex] = obj;
    editIndex = null;
  } else {
    lancamentos.push(obj);
  }

  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  limparFormulario();
  renderTudo();
}

function editarLancamento(i) {
  const l = lancamentos[i];
  tipo.value = l.tipo;
  categoria.value = l.categoria;
  descricao.value = l.descricao;
  valor.value = l.valor;
  cartaoSelect.value = l.cartao || "";
  editIndex = i;
}

function limparFormulario() {
  categoria.value = "";
  descricao.value = "";
  valor.value = "";
  cartaoSelect.value = "";
}

// ==================== TABELA ====================
function renderTabela() {
  tabela.innerHTML = "";

  if (lancamentos.length === 0) {
    tabela.innerHTML = `
      <tr><td colspan="6">Nenhum lançamento cadastrado</td></tr>
    `;
    return;
  }

  lancamentos.forEach((l, i) => {
    tabela.innerHTML += `
      <tr>
        <td>${l.tipo}</td>
        <td>${l.categoria}</td>
        <td>${l.descricao}</td>
        <td>R$ ${l.valor.toFixed(2)}</td>
        <td>${l.cartao || "-"}</td>
        <td>
          <button onclick="editarLancamento(${i})">✏️ Editar</button>
        </td>
      </tr>
    `;
  });
}

// ==================== RESUMO + GRÁFICOS ====================
function renderResumo() {
  const renda = lancamentos
    .filter(l => l.tipo === "Renda")
    .reduce((a, b) => a + b.valor, 0);

  const gastos = lancamentos
    .filter(l => l.tipo !== "Renda")
    .reduce((a, b) => a + b.valor, 0);

  rendaEl.textContent = `R$ ${renda.toFixed(2)}`;
  gastosEl.textContent = `R$ ${gastos.toFixed(2)}`;
  sobraEl.textContent = `R$ ${(renda - gastos).toFixed(2)}`;

  renderGraficos(renda, gastos, renda - gastos);
}

function renderGraficos(r, g, s) {
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(barChartCtx(), {
    type: "bar",
    data: {
      labels: ["Renda", "Gastos", "Sobra"],
      datasets: [{ data: [r, g, s] }]
    },
    options: { responsive: false }
  });

  pieChart = new Chart(pieChartCtx(), {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{ data: [g, s] }]
    },
    options: { responsive: false }
  });
}

// ==================== BACKUP (SÓ CARTÕES) ====================
function exportarBackup() {
  const blob = new Blob(
    [JSON.stringify(cartoes)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_cartoes.json";
  a.click();
}

function importarBackup() {
  const file = importFile.files[0];
  if (!file) {
    alert("Selecione um arquivo de backup");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    cartoes = JSON.parse(e.target.result);
    persistirCartoes();
    renderCartoes();
    alert("Cartões restaurados com sucesso!");
  };
  reader.readAsText(file);
}

// ==================== INIT ====================
function renderTudo() {
  renderCartoes();
  renderTabela();
  renderResumo();
}

function barChartCtx() {
  return document.getElementById("barChart").getContext("2d");
}
function pieChartCtx() {
  return document.getElementById("pieChart").getContext("2d");
}

renderTudo();

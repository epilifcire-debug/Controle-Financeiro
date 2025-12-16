/* ======================================================
   ESTADO GLOBAL
====================================================== */
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

let mesAtivo = new Date().getMonth() + 1;
let anoAtivo = new Date().getFullYear();

let cartaoEditIndex = null;
let lancamentoEditIndex = null;

let barChart, pieChart, cartaoChart;

/* ======================================================
   CORES PADRÃO
====================================================== */
const CORES = {
  renda: "#3182ce",
  gasto: "#e53e3e",
  sobra: "#38a169"
};

/* ======================================================
   UTILIDADES
====================================================== */
function gerarId() {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

/* ======================================================
   MODO ESCURO
====================================================== */
const themeBtn = document.getElementById("toggleTheme");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  themeBtn.textContent = dark ? "☀️" : "🌙";
};

/* ======================================================
   MÊS EM VIGÊNCIA
====================================================== */
document.getElementById("mesAtivo").value = mesAtivo;
document.getElementById("anoAtivo").value = anoAtivo;

function atualizarMesAtivo() {
  mesAtivo = +document.getElementById("mesAtivo").value;
  anoAtivo = +document.getElementById("anoAtivo").value;
  renderTudo();
}

/* ======================================================
   CARTÕES
====================================================== */
function salvarCartao() {
  const nome = cartaoNome.value.trim();
  const fechamento = +cartaoFechamento.value;
  const vencimento = +cartaoVencimento.value;

  if (!nome || !fechamento || !vencimento) {
    alert("Preencha todos os dados do cartão");
    return;
  }

  if (cartaoEditIndex !== null) {
    Object.assign(cartoes[cartaoEditIndex], { nome, fechamento, vencimento });
    cartaoEditIndex = null;
  } else {
    cartoes.push({ id: gerarId(), nome, fechamento, vencimento });
  }

  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  cartaoNome.value = cartaoFechamento.value = cartaoVencimento.value = "";
  renderTudo();
}

function editarCartao(i) {
  const c = cartoes[i];
  cartaoNome.value = c.nome;
  cartaoFechamento.value = c.fechamento;
  cartaoVencimento.value = c.vencimento;
  cartaoEditIndex = i;
}

function excluirCartao(id) {
  if (lancamentos.some(l => l.cartaoId === id)) {
    alert("Este cartão possui lançamentos e não pode ser excluído.");
    return;
  }
  if (!confirm("Deseja excluir este cartão?")) return;
  cartoes = cartoes.filter(c => c.id !== id);
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  renderTudo();
}

function renderCartoes() {
  listaCartoes.innerHTML = "";
  cartaoDashboard.innerHTML = "<option value=''>Todos os cartões</option>";
  faturaCartao.innerHTML = "<option value=''>Selecione</option>";
  compraCartao.innerHTML = "<option value=''>Selecione</option>";

  cartoes.forEach((c, i) => {
    listaCartoes.innerHTML += `
      <li>
        💳 ${c.nome} (fecha ${c.fechamento})
        <span>
          <button class="btn-edit" onclick="editarCartao(${i})">✏️</button>
          <button class="btn-delete" onclick="excluirCartao('${c.id}')">🗑️</button>
        </span>
      </li>
    `;
    cartaoDashboard.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    faturaCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    compraCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
}

/* ======================================================
   LANÇAMENTO NORMAL
====================================================== */
function salvarLancamentoNormal(tipo, categoria, descricao, valor) {
  if (!descricao || !valor) return;

  lancamentos.push({
    id: gerarId(),
    tipo,
    categoria,
    descricao,
    valor,
    mesRef: mesAtivo,
    anoRef: anoAtivo
  });

  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   COMPRA PARCELADA
====================================================== */
function registrarCompraParcelada(cartaoId, descricao, valorTotal, parcelas, mesInicial, anoInicial) {
  if (!cartaoId || !descricao || !valorTotal || !parcelas || !mesInicial || !anoInicial) {
    alert("Preencha todos os dados da compra parcelada");
    return;
  }

  const valorParcela = +(valorTotal / parcelas).toFixed(2);

  for (let i = 1; i <= parcelas; i++) {
    let mes = mesInicial + (i - 1);
    let ano = anoInicial;

    if (mes > 12) {
      ano += Math.floor((mes - 1) / 12);
      mes = ((mes - 1) % 12) + 1;
    }

    lancamentos.push({
      id: gerarId(),
      tipo: "Gasto",
      categoria: "Cartão",
      descricao,
      valor: valorParcela,
      parcelaAtual: i,
      totalParcelas: parcelas,
      cartaoId,
      mesRef: mes,
      anoRef: ano
    });
  }

  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   TABELA DE LANÇAMENTOS (MÊS ATIVO)
====================================================== */
function renderTabela() {
  tabela.innerHTML = "";

  lancamentos
    .filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => {
      const cartao = cartoes.find(c => c.id === l.cartaoId);
      tabela.innerHTML += `
        <tr>
          <td>${l.tipo}</td>
          <td>${l.categoria || "-"}</td>
          <td>
            ${l.descricao}
            ${l.totalParcelas ? `(${l.parcelaAtual}/${l.totalParcelas})` : ""}
          </td>
          <td>R$ ${l.valor.toFixed(2)}</td>
          <td>${cartao ? cartao.nome : "-"}</td>
          <td>
            <button class="btn-delete" onclick="excluirLancamento('${l.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });
}

function excluirLancamento(id) {
  if (!confirm("Excluir lançamento?")) return;
  lancamentos = lancamentos.filter(l => l.id !== id);
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   DASHBOARD GERAL
====================================================== */
function renderResumo() {
  const renda = lancamentos
    .filter(l => l.tipo === "Renda" && l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .reduce((a, b) => a + b.valor, 0);

  const gastos = lancamentos
    .filter(l => l.tipo !== "Renda" && l.mesRef === mesAtivo && l.anoRef === anoAtivo)
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
      datasets: [{
        data: [r, g, s],
        backgroundColor: [CORES.renda, CORES.gasto, CORES.sobra]
      }]
    },
    options: { responsive: false, plugins: { legend: { display: false } } }
  });

  pieChart = new Chart(pieChartCtx(), {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{
        data: [g, s],
        backgroundColor: [CORES.gasto, CORES.sobra]
      }]
    },
    options: { responsive: false }
  });
}

/* ======================================================
   DASHBOARD DE CARTÕES
====================================================== */
cartaoDashboard.onchange = renderDashboardCartoes;

function renderDashboardCartoes() {
  const dados = {};

  lancamentos
    .filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo && l.cartaoId)
    .forEach(l => {
      const nome = cartoes.find(c => c.id === l.cartaoId)?.nome || "Outro";
      dados[nome] = (dados[nome] || 0) + l.valor;
    });

  if (cartaoChart) cartaoChart.destroy();

  cartaoChart = new Chart(
    document.getElementById("cartaoChart").getContext("2d"),
    {
      type: "pie",
      data: {
        labels: Object.keys(dados),
        datasets: [{ data: Object.values(dados) }]
      },
      options: { responsive: false }
    }
  );
}

/* ======================================================
   FATURA MENSAL
====================================================== */
function renderFatura() {
  tabelaFatura.innerHTML = "";
  let total = 0;

  lancamentos
    .filter(l =>
      l.cartaoId === faturaCartao.value &&
      l.mesRef === +faturaMes.value &&
      l.anoRef === +faturaAno.value
    )
    .forEach(l => {
      total += l.valor;
      tabelaFatura.innerHTML += `
        <tr>
          <td>${l.descricao}</td>
          <td>${l.parcelaAtual}/${l.totalParcelas}</td>
          <td>R$ ${l.valor.toFixed(2)}</td>
        </tr>
      `;
    });

  totalFatura.textContent = `Total: R$ ${total.toFixed(2)}`;
}

/* ======================================================
   INIT
====================================================== */
function barChartCtx() {
  return document.getElementById("barChart").getContext("2d");
}
function pieChartCtx() {
  return document.getElementById("pieChart").getContext("2d");
}

function renderTudo() {
  renderCartoes();
  renderTabela();
  renderResumo();
  renderDashboardCartoes();
}

renderTudo();

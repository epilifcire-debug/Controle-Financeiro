/* ======================================================
   DADOS PRINCIPAIS
====================================================== */
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

let cartaoEditIndex = null;
let editIndexLancamento = null;

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
  return "c_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
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
    cartoes[cartaoEditIndex].nome = nome;
    cartoes[cartaoEditIndex].fechamento = fechamento;
    cartoes[cartaoEditIndex].vencimento = vencimento;
    cartaoEditIndex = null;
  } else {
    cartoes.push({
      id: gerarId(),
      nome,
      fechamento,
      vencimento
    });
  }

  persistirCartoes();
  limparFormularioCartao();
  renderTudo();
}

function editarCartao(index) {
  const c = cartoes[index];
  cartaoNome.value = c.nome;
  cartaoFechamento.value = c.fechamento;
  cartaoVencimento.value = c.vencimento;
  cartaoEditIndex = index;
}

function excluirCartao(cartaoId) {
  const usado = lancamentos.some(l => l.cartaoId === cartaoId);
  if (usado) {
    alert("❌ Este cartão possui lançamentos e não pode ser excluído.");
    return;
  }
  if (!confirm("Tem certeza que deseja excluir este cartão?")) return;

  cartoes = cartoes.filter(c => c.id !== cartaoId);
  persistirCartoes();
  renderTudo();
}

function persistirCartoes() {
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
}

function limparFormularioCartao() {
  cartaoNome.value = "";
  cartaoFechamento.value = "";
  cartaoVencimento.value = "";
}

/* ======================================================
   RENDER CARTÕES
====================================================== */
function renderCartoes() {
  listaCartoes.innerHTML = "";
  cartaoDashboard.innerHTML = "<option value=''>Selecione</option>";
  faturaCartao.innerHTML = "<option value=''>Selecione</option>";
  compraCartao.innerHTML = "<option value=''>Selecione</option>";

  cartoes.forEach((c, i) => {
    listaCartoes.innerHTML += `
      <li>
        💳 <strong>${c.nome}</strong>
        — Fecha ${c.fechamento} | Vence ${c.vencimento}
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

  verificarFechamento();
}

/* ======================================================
   ALERTA DE FECHAMENTO
====================================================== */
function verificarFechamento() {
  const hoje = new Date().getDate();
  cartoes.forEach(c => {
    const dias = c.fechamento - hoje;
    if (dias >= 0 && dias <= 3) {
      console.warn(`🔔 Fatura do cartão ${c.nome} fecha em ${dias} dia(s)`);
    }
  });
}

/* ======================================================
   CÁLCULO DE FATURA
====================================================== */
function calcularFatura(cartao, dataCompra = new Date()) {
  let mes = dataCompra.getMonth() + 1;
  let ano = dataCompra.getFullYear();

  if (dataCompra.getDate() > cartao.fechamento) {
    mes++;
    if (mes > 12) {
      mes = 1;
      ano++;
    }
  }
  return { mes, ano };
}

/* ======================================================
   COMPRAS PARCELADAS
====================================================== */
function registrarCompraParcelada(cartaoId, descricao, valorTotal, parcelas) {
  const cartao = cartoes.find(c => c.id === cartaoId);
  if (!cartao || !descricao || !valorTotal || !parcelas) {
    alert("Preencha todos os dados da compra");
    return;
  }

  const valorParcela = +(valorTotal / parcelas).toFixed(2);
  const base = calcularFatura(cartao);

  for (let i = 1; i <= parcelas; i++) {
    let mes = base.mes + (i - 1);
    let ano = base.ano;

    if (mes > 12) {
      ano += Math.floor((mes - 1) / 12);
      mes = ((mes - 1) % 12) + 1;
    }

    lancamentos.push({
      tipo: "Gasto",
      categoria: "Cartão",
      descricao,
      valor: valorParcela,
      valorParcela,
      totalParcelas: parcelas,
      parcelaAtual: i,
      cartaoId,
      mesFatura: mes,
      anoFatura: ano
    });
  }

  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   DASHBOARD GERAL
====================================================== */
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

function renderGraficos(renda, gastos, sobra) {
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(barChartCtx(), {
    type: "bar",
    data: {
      labels: ["Renda", "Gastos", "Sobra"],
      datasets: [{
        data: [renda, gastos, sobra],
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
        data: [gastos, sobra],
        backgroundColor: [CORES.gasto, CORES.sobra]
      }]
    },
    options: { responsive: false }
  });
}

/* ======================================================
   DASHBOARD POR CARTÃO
====================================================== */
cartaoDashboard.onchange = () => {
  const id = cartaoDashboard.value;
  if (!id) return;

  const total = lancamentos
    .filter(l => l.cartaoId === id)
    .reduce((a, b) => a + b.valor, 0);

  if (cartaoChart) cartaoChart.destroy();

  cartaoChart = new Chart(
    document.getElementById("cartaoChart").getContext("2d"),
    {
      type: "doughnut",
      data: {
        labels: ["Total gasto"],
        datasets: [{ data: [total], backgroundColor: [CORES.gasto] }]
      }
    }
  );
};

/* ======================================================
   FATURA MENSAL
====================================================== */
function renderFatura() {
  const cartaoId = faturaCartao.value;
  const mes = +faturaMes.value;
  const ano = +faturaAno.value;

  const itens = lancamentos.filter(l =>
    l.cartaoId === cartaoId &&
    l.mesFatura === mes &&
    l.anoFatura === ano
  );

  tabelaFatura.innerHTML = "";
  timelineParcelas.innerHTML = "";

  let total = 0;
  const hoje = new Date();

  itens.forEach(l => {
    total += l.valor;

    tabelaFatura.innerHTML += `
      <tr>
        <td>${l.descricao}</td>
        <td>${l.parcelaAtual}/${l.totalParcelas}</td>
        <td>R$ ${l.valor.toFixed(2)}</td>
      </tr>
    `;

    const paga =
      l.anoFatura < hoje.getFullYear() ||
      (l.anoFatura === hoje.getFullYear() &&
       l.mesFatura < hoje.getMonth() + 1);

    timelineParcelas.innerHTML += `
      <div class="timeline-item ${paga ? "paga" : "pendente"}">
        ${l.parcelaAtual}/${l.totalParcelas}
        <small>${l.mesFatura}/${l.anoFatura}</small>
      </div>
    `;
  });

  totalFatura.textContent = `Total: R$ ${total.toFixed(2)}`;
}

/* ======================================================
   PDF DA FATURA
====================================================== */
function gerarPDFfatura() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const cartao = cartoes.find(c => c.id === faturaCartao.value);
  if (!cartao) return;

  const mes = faturaMes.options[faturaMes.selectedIndex].text;
  const ano = faturaAno.value;

  doc.text(`Fatura ${cartao.nome} - ${mes}/${ano}`, 10, 10);

  let y = 20;
  let total = 0;

  const itens = lancamentos.filter(l =>
    l.cartaoId === faturaCartao.value &&
    l.mesFatura === +faturaMes.value &&
    l.anoFatura === +faturaAno.value
  );

  itens.forEach(l => {
    doc.text(
      `${l.descricao} (${l.parcelaAtual}/${l.totalParcelas}) - R$ ${l.valor.toFixed(2)}`,
      10, y
    );
    y += 8;
    total += l.valor;
  });

  y += 6;
  doc.text(`Total da fatura: R$ ${total.toFixed(2)}`, 10, y);

  doc.save(`fatura_${cartao.nome}_${mes}_${ano}.pdf`);
}

/* ======================================================
   BACKUP (SÓ CARTÕES)
====================================================== */
function exportarBackup() {
  const blob = new Blob([JSON.stringify(cartoes)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_cartoes.json";
  a.click();
}

function importarBackup() {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    cartoes = JSON.parse(e.target.result);
    persistirCartoes();
    renderTudo();
  };
  reader.readAsText(file);
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
  renderResumo();
}

renderTudo();

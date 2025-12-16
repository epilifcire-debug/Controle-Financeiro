/* ======================================================
   ESTADO GLOBAL
====================================================== */
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];
let assinaturas = JSON.parse(localStorage.getItem("assinaturas")) || [];

let rendaPrincipal = JSON.parse(localStorage.getItem("rendaPrincipal")) || {};
let rendasExtras = JSON.parse(localStorage.getItem("rendasExtras")) || [];

let mesAtivo = new Date().getMonth() + 1;
let anoAtivo = new Date().getFullYear();

let cartaoEditandoId = null;
let barChart, pieChart, cartaoChart, assinaturaChart;

/* ======================================================
   DOM
====================================================== */
const $ = id => document.getElementById(id);

const mesAtivoEl = $("mesAtivo");
const anoAtivoEl = $("anoAtivo");

const rendaPrincipalEl = $("rendaPrincipal");
const rendaEl = $("rendaEl");
const rendaExtraEl = $("rendaExtraEl");
const gastosEl = $("gastosEl");
const sobraEl = $("sobraEl");

const descricaoRendaExtra = $("descricaoRendaExtra");
const valorRendaExtra = $("valorRendaExtra");
const listaRendasExtras = $("listaRendasExtras");

const cartaoNome = $("cartaoNome");
const cartaoFechamento = $("cartaoFechamento");
const cartaoVencimento = $("cartaoVencimento");
const listaCartoes = $("listaCartoes");

const cartaoDashboard = $("cartaoDashboard");
const compraCartao = $("compraCartao");
const assinaturaCartao = $("assinaturaCartao");

const assinaturaDescricao = $("assinaturaDescricao");
const assinaturaValor = $("assinaturaValor");
const listaAssinaturas = $("listaAssinaturas");

const tabela = $("tabela");
const impactoAssinaturas = $("impactoAssinaturas");

/* ======================================================
   UTIL
====================================================== */
const gerarId = () => "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

/* ======================================================
   TEMA (COM RE-RENDER DOS GRÁFICOS)
====================================================== */
const themeBtn = $("toggleTheme");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}

themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";

  // 🔁 recria gráficos para ajustar cores
  renderResumo();
  renderDashboardCartoes();
  renderGraficoAssinaturas();
};

/* ======================================================
   MÊS ATIVO
====================================================== */
mesAtivoEl.value = mesAtivo;
anoAtivoEl.value = anoAtivo;

function atualizarMesAtivo() {
  mesAtivo = +mesAtivoEl.value;
  anoAtivo = +anoAtivoEl.value;
  renderTudo();
}

/* ======================================================
   RENDA
====================================================== */
function salvarRendaPrincipal() {
  const v = +rendaPrincipalEl.value;
  if (!v) return;
  rendaPrincipal[`${mesAtivo}-${anoAtivo}`] = v;
  localStorage.setItem("rendaPrincipal", JSON.stringify(rendaPrincipal));
  renderTudo();
}

function adicionarRendaExtra() {
  if (!descricaoRendaExtra.value || !valorRendaExtra.value) return;
  rendasExtras.push({
    id: gerarId(),
    descricao: descricaoRendaExtra.value,
    valor: +valorRendaExtra.value,
    mesRef: mesAtivo,
    anoRef: anoAtivo
  });
  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
  descricaoRendaExtra.value = valorRendaExtra.value = "";
  renderTudo();
}

function excluirRendaExtra(id) {
  rendasExtras = rendasExtras.filter(r => r.id !== id);
  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
  renderTudo();
}

function renderRendasExtras() {
  listaRendasExtras.innerHTML = "";
  rendasExtras
    .filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
    .forEach(r => {
      listaRendasExtras.innerHTML += `
        <li>${r.descricao} — R$ ${r.valor.toFixed(2)}
        <button class="btn-delete" onclick="excluirRendaExtra('${r.id}')">🗑️</button></li>`;
    });
}

/* ======================================================
   CARTÕES
====================================================== */
function salvarCartao() {
  if (!cartaoNome.value || !cartaoFechamento.value || !cartaoVencimento.value) return;

  if (cartaoEditandoId) {
    const c = cartoes.find(c => c.id === cartaoEditandoId);
    c.nome = cartaoNome.value;
    c.fechamento = +cartaoFechamento.value;
    c.vencimento = +cartaoVencimento.value;
    cartaoEditandoId = null;
  } else {
    cartoes.push({
      id: gerarId(),
      nome: cartaoNome.value,
      fechamento: +cartaoFechamento.value,
      vencimento: +cartaoVencimento.value
    });
  }

  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  cartaoNome.value = cartaoFechamento.value = cartaoVencimento.value = "";
  renderTudo();
}

function editarCartao(id) {
  const c = cartoes.find(c => c.id === id);
  if (!c) return;
  cartaoEditandoId = id;
  cartaoNome.value = c.nome;
  cartaoFechamento.value = c.fechamento;
  cartaoVencimento.value = c.vencimento;
}

function excluirCartao(id) {
  if (!confirm("Excluir cartão?")) return;
  cartoes = cartoes.filter(c => c.id !== id);
  lancamentos = lancamentos.map(l => l.cartaoId === id ? { ...l, cartaoId: null } : l);
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

function renderCartoes() {
  listaCartoes.innerHTML = "";
  cartaoDashboard.innerHTML = `<option value="">Todos</option>`;
  compraCartao.innerHTML = `<option value="">Selecione</option>`;
  assinaturaCartao.innerHTML = `<option value="">Selecione</option>`;

  cartoes.forEach(c => {
    listaCartoes.innerHTML += `
      <li>
        <div><strong>${c.nome}</strong><br>
        <small>Fechamento ${c.fechamento} | Venc. ${c.vencimento}</small></div>
        <div>
          <button class="btn-edit" onclick="editarCartao('${c.id}')">✏️</button>
          <button class="btn-delete" onclick="excluirCartao('${c.id}')">🗑️</button>
        </div>
      </li>`;
    cartaoDashboard.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    compraCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    assinaturaCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
}

/* ======================================================
   COMPRA PARCELADA
====================================================== */
function registrarCompraParcelada(cartaoId, desc, total, parcelas, mesIni, anoIni) {
  const valor = +(total / parcelas).toFixed(2);
  for (let i = 1; i <= parcelas; i++) {
    let mes = mesIni + i - 1, ano = anoIni;
    if (mes > 12) { ano += Math.floor((mes - 1) / 12); mes = ((mes - 1) % 12) + 1; }
    lancamentos.push({
      id: gerarId(),
      tipo: "Gasto",
      categoria: "Cartão",
      descricao: desc,
      valor,
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
   ASSINATURAS
====================================================== */
function salvarAssinatura() {
  assinaturas.push({
    id: gerarId(),
    descricao: assinaturaDescricao.value,
    valor: +assinaturaValor.value,
    cartaoId: assinaturaCartao.value,
    ativa: true
  });
  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  assinaturaDescricao.value = assinaturaValor.value = "";
  renderTudo();
}

function desativarAssinatura(id) {
  assinaturas.find(a => a.id === id).ativa = false;
  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  renderTudo();
}

function aplicarAssinaturasNoMes() {
  assinaturas.filter(a => a.ativa).forEach(a => {
    if (!lancamentos.some(l => l.assinaturaId === a.id && l.mesRef === mesAtivo && l.anoRef === anoAtivo)) {
      lancamentos.push({
        id: gerarId(),
        tipo: "Gasto",
        categoria: "Assinatura",
        descricao: a.descricao,
        valor: a.valor,
        cartaoId: a.cartaoId,
        assinaturaId: a.id,
        mesRef: mesAtivo,
        anoRef: anoAtivo
      });
    }
  });
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
}

function renderAssinaturas() {
  listaAssinaturas.innerHTML = "";
  assinaturas.forEach(a => {
    listaAssinaturas.innerHTML += `
      <li>${a.descricao} — R$ ${a.valor.toFixed(2)}
      ${a.ativa ? `<button class="btn-delete" onclick="desativarAssinatura('${a.id}')">Parar</button>` : "(inativa)"}</li>`;
  });
}

/* ======================================================
   GRÁFICOS GERAIS
====================================================== */
function renderResumo() {
  const isDark = document.body.classList.contains("dark");

  const renda = rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0;
  const extra = rendasExtras.filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
    .reduce((a,b)=>a+b.valor,0);
  const gastos = lancamentos.filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .reduce((a,b)=>a+b.valor,0);
  const sobra = renda + extra - gastos;

  rendaEl.textContent = `R$ ${renda.toFixed(2)}`;
  rendaExtraEl.textContent = `R$ ${extra.toFixed(2)}`;
  gastosEl.textContent = `R$ ${gastos.toFixed(2)}`;
  sobraEl.textContent = `R$ ${sobra.toFixed(2)}`;

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart($("barChart"), {
    type: "bar",
    data: {
      labels: ["Renda", "Extra", "Gastos", "Sobra"],
      datasets: [{
        data: [renda, extra, gastos, sobra],
        backgroundColor: ["#3b82f6","#facc15","#ef4444","#22c55e"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: isDark ? "#e5e7eb" : "#1f2937" } },
        y: { ticks: { color: isDark ? "#e5e7eb" : "#1f2937" } }
      }
    }
  });

  pieChart = new Chart($("pieChart"), {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{
        data: [gastos, sobra],
        backgroundColor: ["#ef4444","#22c55e"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: isDark ? "#e5e7eb" : "#1f2937" } }
      }
    }
  });
}

/* ======================================================
   DASHBOARD DE CARTÕES
====================================================== */
function renderDashboardCartoes() {
  if (cartaoChart) cartaoChart.destroy();
  const dados = {};
  lancamentos.filter(l => l.categoria === "Cartão" && l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => {
      const nome = cartoes.find(c => c.id === l.cartaoId)?.nome || "Sem cartão";
      dados[nome] = (dados[nome] || 0) + l.valor;
    });
  if (!Object.keys(dados).length) return;
  cartaoChart = new Chart($("cartaoChart"), {
    type: "pie",
    data: { labels: Object.keys(dados), datasets: [{ data: Object.values(dados) }] },
    options: { responsive: true }
  });
}

/* ======================================================
   ASSINATURAS × RENDA
====================================================== */
function renderGraficoAssinaturas() {
  if (assinaturaChart) assinaturaChart.destroy();
  const dados = {};
  lancamentos.filter(l => l.categoria === "Assinatura" && l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => dados[l.descricao] = (dados[l.descricao] || 0) + l.valor);

  if (!Object.keys(dados).length) {
    impactoAssinaturas.innerHTML = "";
    return;
  }

  assinaturaChart = new Chart($("assinaturaChart"), {
    type: "pie",
    data: { labels: Object.keys(dados), datasets: [{ data: Object.values(dados) }] },
    options: { responsive: true }
  });

  const total = Object.values(dados).reduce((a,b)=>a+b,0);
  const rendaTotal = (rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0) +
    rendasExtras.filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
      .reduce((a,b)=>a+b.valor,0);

  impactoAssinaturas.innerHTML =
    `Assinaturas: R$ ${total.toFixed(2)} (${((total / rendaTotal) * 100 || 0).toFixed(1)}%)`;
}

/* ======================================================
   TABELA
====================================================== */
function renderTabela() {
  tabela.innerHTML = "";
  lancamentos.filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => {
      tabela.innerHTML += `
        <tr>
          <td>${l.tipo}</td>
          <td>${l.categoria}</td>
          <td>${l.descricao}${l.totalParcelas ? ` (${l.parcelaAtual}/${l.totalParcelas})` : ""}</td>
          <td>R$ ${l.valor.toFixed(2)}</td>
          <td>${cartoes.find(c=>c.id===l.cartaoId)?.nome || "-"}</td>
          <td><button class="btn-delete" onclick="excluirLancamento('${l.id}')">🗑️</button></td>
        </tr>`;
    });
}

function excluirLancamento(id) {
  if (!confirm("Excluir lançamento?")) return;
  lancamentos = lancamentos.filter(l => l.id !== id);
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   BACKUP COMPLETO
====================================================== */
function exportarBackup() {
  const backup = {
    estado: { cartoes, lancamentos, assinaturas, rendaPrincipal, rendasExtras, mesAtivo, anoAtivo }
  };
  const blob = new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_financeiro.json";
  a.click();
}

function importarBackup() {
  const file = $("importFile").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const d = JSON.parse(e.target.result).estado;
    cartoes = d.cartoes || [];
    lancamentos = d.lancamentos || [];
    assinaturas = d.assinaturas || [];
    rendaPrincipal = d.rendaPrincipal || {};
    rendasExtras = d.rendasExtras || [];
    mesAtivo = d.mesAtivo || mesAtivo;
    anoAtivo = d.anoAtivo || anoAtivo;

    localStorage.setItem("cartoes", JSON.stringify(cartoes));
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
    localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
    localStorage.setItem("rendaPrincipal", JSON.stringify(rendaPrincipal));
    localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
    renderTudo();
  };
  reader.readAsText(file);
}

/* ======================================================
   INIT
====================================================== */
function renderTudo() {
  aplicarAssinaturasNoMes();
  renderRendasExtras();
  renderCartoes();
  renderAssinaturas();
  renderTabela();
  renderResumo();
  renderDashboardCartoes();
  renderGraficoAssinaturas();
}

cartaoDashboard.addEventListener("change", renderDashboardCartoes);

window.exportarBackup = exportarBackup;
window.importarBackup = importarBackup;
window.salvarCartao = salvarCartao;
window.editarCartao = editarCartao;
window.excluirCartao = excluirCartao;

renderTudo();

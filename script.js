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

/* ======================================================
   UTIL
====================================================== */
const gerarId = () => "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
const textoGrafico = () => document.body.classList.contains("dark") ? "#020617" : "#1f2937";

/* ======================================================
   TEMA
====================================================== */
const themeBtn = $("toggleTheme");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  renderTudo();
};

/* ======================================================
   MÊS
====================================================== */
$("mesAtivo").value = mesAtivo;
$("anoAtivo").value = anoAtivo;

function atualizarMesAtivo() {
  mesAtivo = +$("mesAtivo").value;
  anoAtivo = +$("anoAtivo").value;
  renderTudo();
}

/* ======================================================
   RENDA
====================================================== */
function salvarRendaPrincipal() {
  const v = +$("rendaPrincipal").value;
  if (!v) return;
  rendaPrincipal[`${mesAtivo}-${anoAtivo}`] = v;
  localStorage.setItem("rendaPrincipal", JSON.stringify(rendaPrincipal));
  renderTudo();
}

function adicionarRendaExtra() {
  const d = $("descricaoRendaExtra").value;
  const v = +$("valorRendaExtra").value;
  if (!d || !v) return;

  rendasExtras.push({ id: gerarId(), descricao: d, valor: v, mesRef: mesAtivo, anoRef: anoAtivo });
  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
  $("descricaoRendaExtra").value = $("valorRendaExtra").value = "";
  renderTudo();
}

/* ======================================================
   CARTÕES
====================================================== */
function salvarCartao() {
  const nome = $("cartaoNome").value;
  const f = +$("cartaoFechamento").value;
  const v = +$("cartaoVencimento").value;
  if (!nome || !f || !v) return;

  if (cartaoEditandoId) {
    const c = cartoes.find(c => c.id === cartaoEditandoId);
    c.nome = nome; c.fechamento = f; c.vencimento = v;
    cartaoEditandoId = null;
  } else {
    cartoes.push({ id: gerarId(), nome, fechamento: f, vencimento: v });
  }

  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  $("cartaoNome").value = $("cartaoFechamento").value = $("cartaoVencimento").value = "";
  renderTudo();
}

function editarCartao(id) {
  const c = cartoes.find(c => c.id === id);
  cartaoEditandoId = id;
  $("cartaoNome").value = c.nome;
  $("cartaoFechamento").value = c.fechamento;
  $("cartaoVencimento").value = c.vencimento;
}

function excluirCartao(id) {
  if (!confirm("Excluir cartão?")) return;
  cartoes = cartoes.filter(c => c.id !== id);
  lancamentos = lancamentos.map(l => l.cartaoId === id ? { ...l, cartaoId: null } : l);
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   GRÁFICOS PRINCIPAIS
====================================================== */
function renderResumo() {
  const renda = rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0;
  const extra = rendasExtras.filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo).reduce((a,b)=>a+b.valor,0);
  const gastos = lancamentos.filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo).reduce((a,b)=>a+b.valor,0);
  const sobra = renda + extra - gastos;

  $("rendaEl").textContent = `R$ ${renda.toFixed(2)}`;
  $("rendaExtraEl").textContent = `R$ ${extra.toFixed(2)}`;
  $("gastosEl").textContent = `R$ ${gastos.toFixed(2)}`;
  $("sobraEl").textContent = `R$ ${sobra.toFixed(2)}`;

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart($("barChart"), {
    type: "bar",
    data: {
      labels: ["Renda", "Extra", "Gastos", "Sobra"],
      datasets: [{ data: [renda, extra, gastos, sobra], backgroundColor: ["#2563eb","#facc15","#dc2626","#16a34a"] }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textoGrafico(), font:{weight:"600"} } },
        y: { ticks: { color: textoGrafico(), font:{weight:"600"} } }
      }
    }
  });

  pieChart = new Chart($("pieChart"), {
    type: "pie",
    data: { labels: ["Gastos","Sobra"], datasets: [{ data: [gastos,sobra], backgroundColor:["#dc2626","#16a34a"] }] },
    options: { plugins:{ legend:{ labels:{ color: textoGrafico(), font:{weight:"600"} } } } }
  });
}

/* ======================================================
   DASHBOARD CARTÕES (COM FILTRO)
====================================================== */
function renderDashboardCartoes() {
  if (cartaoChart) cartaoChart.destroy();
  const filtro = $("cartaoDashboard").value;
  const dados = {};

  lancamentos.filter(l =>
    l.categoria === "Cartão" &&
    l.mesRef === mesAtivo &&
    l.anoRef === anoAtivo &&
    (!filtro || l.cartaoId === filtro)
  ).forEach(l => {
    const nome = cartoes.find(c=>c.id===l.cartaoId)?.nome || "Sem cartão";
    dados[nome] = (dados[nome] || 0) + l.valor;
  });

  if (!Object.keys(dados).length) return;

  cartaoChart = new Chart($("cartaoChart"), {
    type: "pie",
    data: { labels: Object.keys(dados), datasets: [{ data: Object.values(dados) }] },
    options: { plugins:{ legend:{ labels:{ color: textoGrafico() } } } }
  });
}

/* ======================================================
   ASSINATURAS × RENDA
====================================================== */
function renderGraficoAssinaturas() {
  if (assinaturaChart) assinaturaChart.destroy();
  const dados = {};
  lancamentos.filter(l => l.categoria === "Assinatura" && l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => dados[l.descricao] = (dados[l.descricao]||0)+l.valor);

  if (!Object.keys(dados).length) return;

  assinaturaChart = new Chart($("assinaturaChart"), {
    type: "pie",
    data: { labels:Object.keys(dados), datasets:[{ data:Object.values(dados) }] },
    options:{ plugins:{ legend:{ labels:{ color:textoGrafico() } } } }
  });
}

/* ======================================================
   INIT
====================================================== */
function renderTudo() {
  renderResumo();
  renderDashboardCartoes();
  renderGraficoAssinaturas();
}

$("cartaoDashboard").addEventListener("change", renderDashboardCartoes);

window.salvarCartao = salvarCartao;
window.editarCartao = editarCartao;
window.excluirCartao = excluirCartao;
window.salvarRendaPrincipal = salvarRendaPrincipal;
window.adicionarRendaExtra = adicionarRendaExtra;

renderTudo();  leia o codigo e compare se perde alguma funcionalidade

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
   ELEMENTOS DO DOM
====================================================== */
const mesAtivoEl = document.getElementById("mesAtivo");
const anoAtivoEl = document.getElementById("anoAtivo");

const rendaPrincipalEl = document.getElementById("rendaPrincipal");
const rendaEl = document.getElementById("rendaEl");
const rendaExtraEl = document.getElementById("rendaExtraEl");
const gastosEl = document.getElementById("gastosEl");
const sobraEl = document.getElementById("sobraEl");

const descricaoRendaExtra = document.getElementById("descricaoRendaExtra");
const valorRendaExtra = document.getElementById("valorRendaExtra");
const listaRendasExtras = document.getElementById("listaRendasExtras");

const cartaoNome = document.getElementById("cartaoNome");
const cartaoFechamento = document.getElementById("cartaoFechamento");
const cartaoVencimento = document.getElementById("cartaoVencimento");
const listaCartoes = document.getElementById("listaCartoes");

const cartaoDashboard = document.getElementById("cartaoDashboard");
const compraCartao = document.getElementById("compraCartao");
const assinaturaCartao = document.getElementById("assinaturaCartao");
const faturaCartao = document.getElementById("faturaCartao");

const assinaturaDescricao = document.getElementById("assinaturaDescricao");
const assinaturaValor = document.getElementById("assinaturaValor");
const listaAssinaturas = document.getElementById("listaAssinaturas");

const tabela = document.getElementById("tabela");
const impactoAssinaturas = document.getElementById("impactoAssinaturas");

/* ======================================================
   UTIL
====================================================== */
function gerarId() {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

/* ======================================================
   TEMA
====================================================== */
const themeBtn = document.getElementById("toggleTheme");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
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
  const valor = +rendaPrincipalEl.value;
  if (!valor) return;

  rendaPrincipal[`${mesAtivo}-${anoAtivo}`] = valor;
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
  descricaoRendaExtra.value = "";
  valorRendaExtra.value = "";
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
        <li>
          ${r.descricao} — R$ ${r.valor.toFixed(2)}
          <button class="btn-delete" onclick="excluirRendaExtra('${r.id}')">🗑️</button>
        </li>`;
    });
}

/* ======================================================
   CARTÕES (EDITAR / EXCLUIR CORRIGIDO)
====================================================== */
function salvarCartao() {
  if (!cartaoNome.value || !cartaoFechamento.value || !cartaoVencimento.value) return;

  if (cartaoEditandoId) {
    const c = cartoes.find(c => c.id === cartaoEditandoId);
    if (!c) return;

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
  if (!confirm("Excluir este cartão?")) return;

  // mantém histórico dos lançamentos
  lancamentos = lancamentos.map(l => {
    if (l.cartaoId === id) {
      return { ...l, cartaoId: null };
    }
    return l;
  });

  cartoes = cartoes.filter(c => c.id !== id);

  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

  renderTudo();
}

function renderCartoes() {
  listaCartoes.innerHTML = "";

  cartaoDashboard.innerHTML = "<option value=''>Todos</option>";
  compraCartao.innerHTML = "<option value=''>Selecione</option>";
  assinaturaCartao.innerHTML = "<option value=''>Selecione</option>";
  faturaCartao.innerHTML = "<option value=''>Selecione</option>";

  cartoes.forEach(c => {
    listaCartoes.innerHTML += `
      <li>
        <div>
          <strong>${c.nome}</strong><br>
          <small>Fechamento: ${c.fechamento} | Vencimento: ${c.vencimento}</small>
        </div>
        <div>
          <button type="button" class="btn-edit" onclick="editarCartao('${c.id}')">✏️</button>
          <button type="button" class="btn-delete" onclick="excluirCartao('${c.id}')">🗑️</button>
        </div>
      </li>
    `;

    cartaoDashboard.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    compraCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    assinaturaCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    faturaCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
}

/* ======================================================
   LANÇAMENTOS
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
  if (!cartaoId || !descricao || !valorTotal || !parcelas) return;

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
   ASSINATURAS
====================================================== */
function salvarAssinatura() {
  if (!assinaturaDescricao.value || !assinaturaValor.value || !assinaturaCartao.value) return;

  assinaturas.push({
    id: gerarId(),
    descricao: assinaturaDescricao.value,
    valor: +assinaturaValor.value,
    cartaoId: assinaturaCartao.value,
    ativa: true
  });

  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  assinaturaDescricao.value = "";
  assinaturaValor.value = "";
  renderTudo();
}

function desativarAssinatura(id) {
  const a = assinaturas.find(a => a.id === id);
  if (!a) return;
  a.ativa = false;
  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  renderTudo();
}

function aplicarAssinaturasNoMes() {
  assinaturas.filter(a => a.ativa).forEach(a => {
    const existe = lancamentos.some(l =>
      l.assinaturaId === a.id &&
      l.mesRef === mesAtivo &&
      l.anoRef === anoAtivo
    );
    if (!existe) {
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
    const cartao = cartoes.find(c => c.id === a.cartaoId);
    listaAssinaturas.innerHTML += `
      <li style="opacity:${a.ativa ? 1 : 0.5}">
        ${a.descricao} — R$ ${a.valor.toFixed(2)} (${cartao?.nome || "Cartão removido"})
        ${a.ativa ? `<button class="btn-delete" onclick="desativarAssinatura('${a.id}')">Parar</button>` : "(inativa)"}
      </li>`;
  });
}

/* ======================================================
   DASHBOARD
====================================================== */
function renderResumo() {
  const rendaBase = rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0;
  const rendaExtra = rendasExtras
    .filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
    .reduce((a, b) => a + b.valor, 0);

  const gastos = lancamentos
    .filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .reduce((a, b) => a + b.valor, 0);

  rendaEl.textContent = `R$ ${rendaBase.toFixed(2)}`;
  rendaExtraEl.textContent = `R$ ${rendaExtra.toFixed(2)}`;
  gastosEl.textContent = `R$ ${gastos.toFixed(2)}`;
  sobraEl.textContent = `R$ ${(rendaBase + rendaExtra - gastos).toFixed(2)}`;

  renderGraficos(rendaBase, rendaExtra, gastos, rendaBase + rendaExtra - gastos);
}

/* ======================================================
   GRÁFICOS
====================================================== */
function renderGraficos(rb, re, g, s) {
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["Renda", "Extra", "Gastos", "Sobra"],
      datasets: [{
        data: [rb, re, g, s],
        backgroundColor: ["#3182ce","#ecc94b","#e53e3e","#38a169"]
      }]
    },
    options: { responsive: false, plugins: { legend: { display: false } } }
  });

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{
        data: [g, s],
        backgroundColor: ["#e53e3e","#38a169"]
      }]
    },
    options: { responsive: false }
  });
}

/* ======================================================
   ASSINATURAS – GRÁFICO
====================================================== */
function renderGraficoAssinaturas() {
  const dados = {};
  lancamentos
    .filter(l => l.categoria === "Assinatura" && l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => dados[l.descricao] = (dados[l.descricao] || 0) + l.valor);

  if (assinaturaChart) assinaturaChart.destroy();

  assinaturaChart = new Chart(document.getElementById("assinaturaChart"), {
    type: "pie",
    data: {
      labels: Object.keys(dados),
      datasets: [{ data: Object.values(dados) }]
    },
    options: { responsive: false }
  });

  const total = Object.values(dados).reduce((a, b) => a + b, 0);
  const rendaTotal = (rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0) +
    rendasExtras
      .filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
      .reduce((a, b) => a + b.valor, 0);

  impactoAssinaturas.innerHTML = `
    Assinaturas: R$ ${total.toFixed(2)}<br>
    Impacto na renda: ${rendaTotal ? ((total / rendaTotal) * 100).toFixed(1) : 0}%
  `;
}

/* ======================================================
   TABELA
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
          <td>${l.descricao}${l.totalParcelas ? ` (${l.parcelaAtual}/${l.totalParcelas})` : ""}</td>
          <td>R$ ${l.valor.toFixed(2)}</td>
          <td>${cartao?.nome || "Cartão removido"}</td>
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
   INIT
====================================================== */
function renderTudo() {
  aplicarAssinaturasNoMes();
  renderRendasExtras();
  renderCartoes();
  renderAssinaturas();
  renderTabela();
  renderResumo();
  renderGraficoAssinaturas();
}

window.editarCartao = editarCartao;
window.excluirCartao = excluirCartao;
window.salvarCartao = salvarCartao;

renderTudo();

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

let barChart = null;
let pieChart = null;
let cartaoChart = null;
let assinaturaChart = null;

/* ======================================================
   DOM UTIL
====================================================== */
const $ = id => document.getElementById(id);

/* ======================================================
   UTIL
====================================================== */
const gerarId = () =>
  "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

const corTextoGrafico = () =>
  document.body.classList.contains("dark") ? "#e5e7eb" : "#1f2937";

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
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  renderTudo();
};

/* ======================================================
   MÊS / ANO
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
  const valor = +$("rendaPrincipal").value;
  if (!valor) return;

  rendaPrincipal[`${mesAtivo}-${anoAtivo}`] = valor;
  localStorage.setItem("rendaPrincipal", JSON.stringify(rendaPrincipal));
  renderTudo();
}

function adicionarRendaExtra() {
  const desc = $("descricaoRendaExtra").value;
  const valor = +$("valorRendaExtra").value;
  if (!desc || !valor) return;

  rendasExtras.push({
    id: gerarId(),
    descricao: desc,
    valor,
    mesRef: mesAtivo,
    anoRef: anoAtivo
  });

  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
  $("descricaoRendaExtra").value = "";
  $("valorRendaExtra").value = "";
  renderTudo();
}

function renderRendasExtras() {
  $("listaRendasExtras").innerHTML = "";
  rendasExtras
    .filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
    .forEach(r => {
      $("listaRendasExtras").innerHTML += `
        <li>
          ${r.descricao} — R$ ${r.valor.toFixed(2)}
          <button class="btn-delete" onclick="excluirRendaExtra('${r.id}')">🗑️</button>
        </li>`;
    });
}

function excluirRendaExtra(id) {
  rendasExtras = rendasExtras.filter(r => r.id !== id);
  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
  renderTudo();
}

/* ======================================================
   CARTÕES
====================================================== */
function salvarCartao() {
  const nome = $("cartaoNome").value;
  const fechamento = +$("cartaoFechamento").value;
  const vencimento = +$("cartaoVencimento").value;
  if (!nome || !fechamento || !vencimento) return;

  if (cartaoEditandoId) {
    const c = cartoes.find(c => c.id === cartaoEditandoId);
    if (c) {
      c.nome = nome;
      c.fechamento = fechamento;
      c.vencimento = vencimento;
    }
    cartaoEditandoId = null;
  } else {
    cartoes.push({ id: gerarId(), nome, fechamento, vencimento });
  }

  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  $("cartaoNome").value = "";
  $("cartaoFechamento").value = "";
  $("cartaoVencimento").value = "";
  renderTudo();
}

function editarCartao(id) {
  const c = cartoes.find(c => c.id === id);
  if (!c) return;
  cartaoEditandoId = id;
  $("cartaoNome").value = c.nome;
  $("cartaoFechamento").value = c.fechamento;
  $("cartaoVencimento").value = c.vencimento;
}

function excluirCartao(id) {
  if (!confirm("Excluir cartão?")) return;
  cartoes = cartoes.filter(c => c.id !== id);
  lancamentos = lancamentos.map(l =>
    l.cartaoId === id ? { ...l, cartaoId: null } : l
  );
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

function renderCartoes() {
  $("listaCartoes").innerHTML = "";
  $("cartaoDashboard").innerHTML = `<option value="">Todos os cartões</option>`;
  $("compraCartao").innerHTML = "";
  $("assinaturaCartao").innerHTML = "";

  cartoes.forEach(c => {
    $("listaCartoes").innerHTML += `
      <li>
        <div>
          <strong>${c.nome}</strong><br>
          <small>Fech.: ${c.fechamento} | Venc.: ${c.vencimento}</small>
        </div>
        <div>
          <button class="btn-edit" onclick="editarCartao('${c.id}')">✏️</button>
          <button class="btn-delete" onclick="excluirCartao('${c.id}')">🗑️</button>
        </div>
      </li>`;

    $("cartaoDashboard").innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    $("compraCartao").innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    $("assinaturaCartao").innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
}

/* ======================================================
   COMPRA PARCELADA
====================================================== */
function registrarCompraParcelada(cartaoId, desc, total, parcelas, mesIni, anoIni) {
  if (!cartaoId || !desc || !total || !parcelas) return;
  const valorParcela = +(total / parcelas).toFixed(2);

  for (let i = 1; i <= parcelas; i++) {
    let mes = mesIni + i - 1;
    let ano = anoIni;
    if (mes > 12) {
      ano += Math.floor((mes - 1) / 12);
      mes = ((mes - 1) % 12) + 1;
    }

    lancamentos.push({
      id: gerarId(),
      tipo: "Gasto",
      categoria: "Cartão",
      descricao: desc,
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
  const desc = $("assinaturaDescricao").value;
  const valor = +$("assinaturaValor").value;
  const cartaoId = $("assinaturaCartao").value;
  if (!desc || !valor || !cartaoId) return;

  assinaturas.push({
    id: gerarId(),
    descricao: desc,
    valor,
    cartaoId,
    ativa: true
  });

  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  $("assinaturaDescricao").value = "";
  $("assinaturaValor").value = "";
  renderTudo();
}

function desativarAssinatura(id) {
  const a = assinaturas.find(a => a.id === id);
  if (a) a.ativa = false;
  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  renderTudo();
}

function aplicarAssinaturasNoMes() {
  assinaturas.filter(a => a.ativa).forEach(a => {
    const existe = lancamentos.some(
      l => l.assinaturaId === a.id &&
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
  $("listaAssinaturas").innerHTML = "";
  assinaturas.forEach(a => {
    $("listaAssinaturas").innerHTML += `
      <li>
        ${a.descricao} — R$ ${a.valor.toFixed(2)}
        ${a.ativa
          ? `<button class="btn-delete" onclick="desativarAssinatura('${a.id}')">Parar</button>`
          : "(inativa)"}
      </li>`;
  });
}

/* ======================================================
   TABELA
====================================================== */
function renderTabela() {
  $("tabela").innerHTML = "";
  lancamentos
    .filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => {
      const cartao = cartoes.find(c => c.id === l.cartaoId);
      $("tabela").innerHTML += `
        <tr>
          <td>${l.tipo}</td>
          <td>${l.categoria}</td>
          <td>${l.descricao}${l.totalParcelas ? ` (${l.parcelaAtual}/${l.totalParcelas})` : ""}</td>
          <td>R$ ${l.valor.toFixed(2)}</td>
          <td>${cartao?.nome || "-"}</td>
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
   DASHBOARD / GRÁFICOS
====================================================== */
function renderResumo() {
  const renda = rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0;
  const extra = rendasExtras
    .filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
    .reduce((a, b) => a + b.valor, 0);
  const gastos = lancamentos
    .filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .reduce((a, b) => a + b.valor, 0);
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
      datasets: [{
        data: [renda, extra, gastos, sobra],
        backgroundColor: ["#2563eb","#facc15","#dc2626","#16a34a"]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: corTextoGrafico() } },
        y: { ticks: { color: corTextoGrafico() } }
      }
    }
  });

  pieChart = new Chart($("pieChart"), {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{ data: [gastos, sobra], backgroundColor: ["#dc2626","#16a34a"] }]
    },
    options: { plugins: { legend: { labels: { color: corTextoGrafico() } } } }
  });
}

function renderDashboardCartoes() {
  if (cartaoChart) cartaoChart.destroy();
  const filtro = $("cartaoDashboard").value;
  const dados = {};

  lancamentos
    .filter(l =>
      l.categoria === "Cartão" &&
      l.mesRef === mesAtivo &&
      l.anoRef === anoAtivo &&
      (!filtro || l.cartaoId === filtro)
    )
    .forEach(l => {
      const nome = cartoes.find(c => c.id === l.cartaoId)?.nome || "Sem cartão";
      dados[nome] = (dados[nome] || 0) + l.valor;
    });

  if (!Object.keys(dados).length) return;

  cartaoChart = new Chart($("cartaoChart"), {
    type: "pie",
    data: { labels: Object.keys(dados), datasets: [{ data: Object.values(dados) }] },
    options: { plugins: { legend: { labels: { color: corTextoGrafico() } } } }
  });
}

/* ======================================================
   BACKUP
====================================================== */
function exportarBackup() {
  const backup = {
    cartoes,
    lancamentos,
    assinaturas,
    rendaPrincipal,
    rendasExtras,
    mesAtivo,
    anoAtivo
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
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
    const d = JSON.parse(e.target.result);
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

    $("mesAtivo").value = mesAtivo;
    $("anoAtivo").value = anoAtivo;
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

$("cartaoDashboard").addEventListener("change", renderDashboardCartoes);

window.atualizarMesAtivo = atualizarMesAtivo;
window.salvarRendaPrincipal = salvarRendaPrincipal;
window.adicionarRendaExtra = adicionarRendaExtra;
window.salvarCartao = salvarCartao;
window.editarCartao = editarCartao;
window.excluirCartao = excluirCartao;
window.registrarCompraParcelada = registrarCompraParcelada;
window.salvarAssinatura = salvarAssinatura;
window.exportarBackup = exportarBackup;
window.importarBackup = importarBackup;

renderTudo();


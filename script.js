/* ======================================================
   CONTROLE FINANCEIRO — SCRIPT FINAL
   Versão limpa, comentada e estável
====================================================== */

/* ======================================================
   ESTADO GLOBAL (LOCALSTORAGE)
====================================================== */
let cartoes        = JSON.parse(localStorage.getItem("cartoes"))        || [];
let lancamentos    = JSON.parse(localStorage.getItem("lancamentos"))    || [];
let assinaturas    = JSON.parse(localStorage.getItem("assinaturas"))    || [];
let rendaPrincipal = JSON.parse(localStorage.getItem("rendaPrincipal")) || {};
let rendasExtras   = JSON.parse(localStorage.getItem("rendasExtras"))   || [];

let mesAtivo = new Date().getMonth() + 1;
let anoAtivo = new Date().getFullYear();

let cartaoEditandoId = null;

/* Gráficos */
let barChart = null;
let pieChart = null;
let cartaoChart = null;
let assinaturaChart = null;

/* ======================================================
   UTILIDADES
====================================================== */
const $ = id => document.getElementById(id);

const gerarId = () =>
  "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

const corTextoGrafico = () =>
  document.body.classList.contains("dark") ? "#e5e7eb" : "#1f2937";

/* ======================================================
   TEMA (CLARO / ESCURO)
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
  renderTudo(); // recria gráficos com novas cores
};

/* ======================================================
   MÊS ATIVO
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

function excluirRendaExtra(id) {
  rendasExtras = rendasExtras.filter(r => r.id !== id);
  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
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
    c.nome = nome;
    c.fechamento = fechamento;
    c.vencimento = vencimento;
    cartaoEditandoId = null;
  } else {
    cartoes.push({ id: gerarId(), nome, fechamento, vencimento });
  }

  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  $("cartaoNome").value = $("cartaoFechamento").value = $("cartaoVencimento").value = "";
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
  lancamentos = lancamentos.map(l => l.cartaoId === id ? { ...l, cartaoId: null } : l);
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

function renderCartoes() {
  $("listaCartoes").innerHTML = "";
  $("cartaoDashboard").innerHTML = `<option value="">Todos</option>`;
  $("compraCartao").innerHTML = "";
  $("assinaturaCartao").innerHTML = "";

  cartoes.forEach(c => {
    $("listaCartoes").innerHTML += `
      <li>
        <div>
          <strong>${c.nome}</strong><br>
          <small>Fechamento ${c.fechamento} | Vencimento ${c.vencimento}</small>
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
   ASSINATURAS
====================================================== */
function salvarAssinatura() {
  const d = $("assinaturaDescricao").value;
  const v = +$("assinaturaValor").value;
  const c = $("assinaturaCartao").value;
  if (!d || !v || !c) return;

  assinaturas.push({ id: gerarId(), descricao: d, valor: v, cartaoId: c, ativa: true });
  localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
  $("assinaturaDescricao").value = $("assinaturaValor").value = "";
  renderTudo();
}

function renderAssinaturas() {
  $("listaAssinaturas").innerHTML = "";
  assinaturas.forEach(a => {
    $("listaAssinaturas").innerHTML += `
      <li>
        ${a.descricao} — R$ ${a.valor.toFixed(2)}
      </li>`;
  });
}

/* ======================================================
   TABELA DE LANÇAMENTOS
====================================================== */
function renderTabela() {
  $("tabela").innerHTML = "";
  lancamentos
    .filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .forEach(l => {
      $("tabela").innerHTML += `
        <tr>
          <td>${l.tipo || "-"}</td>
          <td>${l.categoria || "-"}</td>
          <td>${l.descricao}</td>
          <td>R$ ${l.valor.toFixed(2)}</td>
          <td>${cartoes.find(c => c.id === l.cartaoId)?.nome || "-"}</td>
          <td>
            <button class="btn-delete" onclick="excluirLancamento('${l.id}')">🗑️</button>
          </td>
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
   GRÁFICOS E RESUMO
====================================================== */
function renderResumo() {
  const renda = rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0;
  const extra = rendasExtras.filter(r => r.mesRef === mesAtivo && r.anoRef === anoAtivo)
    .reduce((a,b)=>a+b.valor,0);
  const gastos = lancamentos.filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo)
    .reduce((a,b)=>a+b.valor,0);
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
      datasets: [{ data: [renda, extra, gastos, sobra] }]
    }
  });

  pieChart = new Chart($("pieChart"), {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{ data: [gastos, sobra] }]
    }
  });
}

/* ======================================================
   BACKUP COMPLETO
====================================================== */
function exportarBackup() {
  const backup = {
    cartoes,
    lancamentos,
    assinaturas,
    rendaPrincipal,
    rendasExtras
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_financeiro.json";
  a.click();
}

function importarBackupArquivo(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      if (!data.cartoes) {
        alert("Arquivo de backup inválido.");
        return;
      }

      cartoes        = data.cartoes || [];
      lancamentos    = data.lancamentos || [];
      assinaturas    = data.assinaturas || [];
      rendaPrincipal = data.rendaPrincipal || {};
      rendasExtras   = data.rendasExtras || [];

      localStorage.setItem("cartoes", JSON.stringify(cartoes));
      localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
      localStorage.setItem("assinaturas", JSON.stringify(assinaturas));
      localStorage.setItem("rendaPrincipal", JSON.stringify(rendaPrincipal));
      localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));

      renderTudo();
      alert("✅ Backup importado com sucesso!");
    } catch (err) {
      alert("❌ Erro ao importar backup.");
      console.error(err);
    }
  };

  reader.readAsText(file);
}

/* ======================================================
   RENDER GERAL
====================================================== */
function renderTudo() {
  renderResumo();
  renderRendasExtras();
  renderCartoes();
  renderAssinaturas();
  renderTabela();
}

/* ======================================================
   EXPORTA FUNÇÕES PARA O HTML
====================================================== */
window.salvarRendaPrincipal = salvarRendaPrincipal;
window.adicionarRendaExtra = adicionarRendaExtra;
window.salvarCartao = salvarCartao;
window.editarCartao = editarCartao;
window.excluirCartao = excluirCartao;
window.salvarAssinatura = salvarAssinatura;
window.atualizarMesAtivo = atualizarMesAtivo;
window.exportarBackup = exportarBackup;
window.importarBackup = importarBackup;
/* ======================================================
   COMPRA PARCELADA (FUNÇÃO AUSENTE)
====================================================== */
function registrarCompraParcelada(
  cartaoId,
  descricao,
  valorTotal,
  parcelas,
  mesInicial,
  anoInicial
) {
  if (!cartaoId || !descricao || !valorTotal || !parcelas || !mesInicial || !anoInicial) {
    alert("Preencha todos os campos da compra parcelada.");
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
   INIT
====================================================== */
renderTudo();



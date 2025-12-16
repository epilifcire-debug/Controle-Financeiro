/* ======================================================
   DADOS
====================================================== */
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

let cartaoEditIndex = null;
let lancamentoEditIndex = null;

let barChart, pieChart, cartaoChart;

/* ======================================================
   CORES
====================================================== */
const CORES = {
  renda: "#3182ce",
  gasto: "#e53e3e",
  sobra: "#38a169"
};

/* ======================================================
   UTIL
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
  if (!nome || !fechamento || !vencimento) return alert("Dados do cartão incompletos");

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
  if (lancamentos.some(l => l.cartaoId === id))
    return alert("Cartão possui lançamentos e não pode ser excluído");
  if (!confirm("Excluir cartão?")) return;
  cartoes = cartoes.filter(c => c.id !== id);
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  renderTudo();
}

function renderCartoes() {
  listaCartoes.innerHTML = "";
  cartaoDashboard.innerHTML = "<option value=''>Todos</option>";
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
      </li>`;
    cartaoDashboard.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    faturaCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    compraCartao.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
}

/* ======================================================
   LANÇAMENTO NORMAL
====================================================== */
function salvarLancamentoNormal(tipo, categoria, descricao, valor) {
  lancamentos.push({
    tipo,
    categoria,
    descricao,
    valor,
    data: new Date().toISOString()
  });
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   PARCELAMENTO COM MÊS INICIAL
====================================================== */
function registrarCompraParcelada(cartaoId, descricao, valorTotal, parcelas, mesInicial, anoInicial) {
  const cartao = cartoes.find(c => c.id === cartaoId);
  if (!cartao) return;

  const valorParcela = +(valorTotal / parcelas).toFixed(2);

  for (let i = 1; i <= parcelas; i++) {
    let mes = mesInicial + (i - 1);
    let ano = anoInicial;
    if (mes > 12) {
      ano += Math.floor((mes - 1) / 12);
      mes = ((mes - 1) % 12) + 1;
    }

    lancamentos.push({
      tipo: "Gasto",
      categoria: "Cartão",
      descricao: `${descricao} — ${parcelas}x de R$ ${valorParcela.toFixed(2)} (${i}/${parcelas})`,
      valor: valorParcela,
      cartaoId,
      mesFatura: mes,
      anoFatura: ano
    });
  }

  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ======================================================
   TABELA LANÇAMENTOS (TODOS)
====================================================== */
function renderTabela() {
  tabela.innerHTML = "";
  lancamentos.forEach((l, i) => {
    const cartao = cartoes.find(c => c.id === l.cartaoId);
    tabela.innerHTML += `
      <tr>
        <td>${l.tipo}</td>
        <td>${l.categoria || "-"}</td>
        <td>${l.descricao}</td>
        <td>R$ ${l.valor.toFixed(2)}</td>
        <td>${cartao ? cartao.nome : "-"}</td>
        <td><button class="btn-edit" onclick="editarLancamento(${i})">✏️</button></td>
      </tr>`;
  });
}

function editarLancamento(i) {
  const l = lancamentos[i];
  alert("Edição simples: apague e recadastre se necessário.\n(Funcionalidade pode ser expandida)");
}

/* ======================================================
   DASHBOARD GERAL
====================================================== */
function renderResumo() {
  const renda = lancamentos.filter(l => l.tipo === "Renda").reduce((a,b)=>a+b.valor,0);
  const gastos = lancamentos.filter(l => l.tipo !== "Renda").reduce((a,b)=>a+b.valor,0);

  rendaEl.textContent = `R$ ${renda.toFixed(2)}`;
  gastosEl.textContent = `R$ ${gastos.toFixed(2)}`;
  sobraEl.textContent = `R$ ${(renda-gastos).toFixed(2)}`;

  renderGraficos(renda, gastos, renda-gastos);
}

function renderGraficos(r,g,s){
  if(barChart) barChart.destroy();
  if(pieChart) pieChart.destroy();

  barChart = new Chart(barChartCtx(),{
    type:"bar",
    data:{labels:["Renda","Gastos","Sobra"],
      datasets:[{data:[r,g,s],backgroundColor:[CORES.renda,CORES.gasto,CORES.sobra]}]},
    options:{responsive:false}
  });

  pieChart = new Chart(pieChartCtx(),{
    type:"pie",
    data:{labels:["Gastos","Sobra"],
      datasets:[{data:[g,s],backgroundColor:[CORES.gasto,CORES.sobra]}]},
    options:{responsive:false}
  });
}

/* ======================================================
   DASHBOARD CARTÕES (TODOS OU UM)
====================================================== */
cartaoDashboard.onchange = () => {
  const id = cartaoDashboard.value;
  const dados = {};

  lancamentos.forEach(l => {
    if (l.cartaoId) {
      if (!id || l.cartaoId === id) {
        const nome = cartoes.find(c => c.id === l.cartaoId)?.nome || "Outro";
        dados[nome] = (dados[nome] || 0) + l.valor;
      }
    }
  });

  if (cartaoChart) cartaoChart.destroy();
  cartaoChart = new Chart(document.getElementById("cartaoChart"),{
    type:"pie",
    data:{labels:Object.keys(dados),
      datasets:[{data:Object.values(dados)}]},
    options:{responsive:false}
  });
};

/* ======================================================
   FATURA
====================================================== */
function renderFatura() {
  const cartaoId = faturaCartao.value;
  const mes = +faturaMes.value;
  const ano = +faturaAno.value;
  tabelaFatura.innerHTML = "";
  timelineParcelas.innerHTML = "";

  let total = 0;
  const hoje = new Date();

  lancamentos.filter(l =>
    l.cartaoId === cartaoId &&
    l.mesFatura === mes &&
    l.anoFatura === ano
  ).forEach(l => {
    total += l.valor;
    tabelaFatura.innerHTML += `
      <tr>
        <td>${l.descricao}</td>
        <td>R$ ${l.valor.toFixed(2)}</td>
      </tr>`;
  });

  totalFatura.textContent = `Total: R$ ${total.toFixed(2)}`;
}

/* ======================================================
   INIT
====================================================== */
function barChartCtx(){return document.getElementById("barChart").getContext("2d")}
function pieChartCtx(){return document.getElementById("pieChart").getContext("2d")}

function renderTudo(){
  renderCartoes();
  renderResumo();
  renderTabela();
}

renderTudo();

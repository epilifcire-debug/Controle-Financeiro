/* ===== ESTADO ===== */
let cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];
let assinaturas = JSON.parse(localStorage.getItem("assinaturas")) || [];
let rendaPrincipal = JSON.parse(localStorage.getItem("rendaPrincipal")) || {};
let rendasExtras = JSON.parse(localStorage.getItem("rendasExtras")) || [];

let mesAtivo = new Date().getMonth() + 1;
let anoAtivo = new Date().getFullYear();

let barChart, pieChart;

/* ===== UTIL ===== */
const $ = id => document.getElementById(id);
const gerarId = () => "id_" + Date.now();

/* ===== TEMA ===== */
$("toggleTheme").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  renderTudo();
};

if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

/* ===== MÊS ===== */
$("mesAtivo").value = mesAtivo;
$("anoAtivo").value = anoAtivo;

function atualizarMesAtivo() {
  mesAtivo = +$("mesAtivo").value;
  anoAtivo = +$("anoAtivo").value;
  renderTudo();
}

/* ===== RENDA ===== */
function salvarRendaPrincipal() {
  rendaPrincipal[`${mesAtivo}-${anoAtivo}`] = +$("rendaPrincipal").value;
  localStorage.setItem("rendaPrincipal", JSON.stringify(rendaPrincipal));
  renderTudo();
}

function adicionarRendaExtra() {
  rendasExtras.push({
    id: gerarId(),
    descricao: $("descricaoRendaExtra").value,
    valor: +$("valorRendaExtra").value,
    mesRef: mesAtivo,
    anoRef: anoAtivo
  });
  localStorage.setItem("rendasExtras", JSON.stringify(rendasExtras));
  renderTudo();
}

/* ===== CARTÕES ===== */
function salvarCartao() {
  cartoes.push({
    id: gerarId(),
    nome: $("cartaoNome").value,
    fechamento: +$("cartaoFechamento").value,
    vencimento: +$("cartaoVencimento").value
  });
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
  renderTudo();
}

/* ===== ASSINATURAS ===== */
function salvarAssinatura() {
  assinaturas.push({
    id: gerarId(),
    descricao: $("assinaturaDescricao").value,
    valor: +$("assinaturaValor").value,
    cartaoId: $("assinaturaCartao").value,
    ativa: true
  });
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

/* ===== TABELA ===== */
function renderTabela() {
  $("tabela").innerHTML = "";
  lancamentos.filter(l => l.mesRef === mesAtivo && l.anoRef === anoAtivo).forEach(l => {
    $("tabela").innerHTML += `
      <tr>
        <td>${l.tipo}</td>
        <td>${l.categoria}</td>
        <td>${l.descricao}</td>
        <td>R$ ${l.valor.toFixed(2)}</td>
        <td>${cartoes.find(c=>c.id===l.cartaoId)?.nome||"-"}</td>
        <td><button onclick="excluirLancamento('${l.id}')">🗑️</button></td>
      </tr>`;
  });
}

function excluirLancamento(id){
  lancamentos = lancamentos.filter(l => l.id !== id);
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  renderTudo();
}

/* ===== GRÁFICOS ===== */
function renderResumo() {
  const renda = rendaPrincipal[`${mesAtivo}-${anoAtivo}`] || 0;
  const extra = rendasExtras.filter(r=>r.mesRef===mesAtivo&&r.anoRef===anoAtivo).reduce((a,b)=>a+b.valor,0);
  const gastos = lancamentos.filter(l=>l.mesRef===mesAtivo&&l.anoRef===anoAtivo).reduce((a,b)=>a+b.valor,0);
  const sobra = renda + extra - gastos;

  $("rendaEl").textContent = `R$ ${renda.toFixed(2)}`;
  $("rendaExtraEl").textContent = `R$ ${extra.toFixed(2)}`;
  $("gastosEl").textContent = `R$ ${gastos.toFixed(2)}`;
  $("sobraEl").textContent = `R$ ${sobra.toFixed(2)}`;

  if(barChart) barChart.destroy();
  if(pieChart) pieChart.destroy();

  barChart = new Chart($("barChart"), {
    type:"bar",
    data:{ labels:["Renda","Extra","Gastos","Sobra"], datasets:[{data:[renda,extra,gastos,sobra]}] }
  });

  pieChart = new Chart($("pieChart"), {
    type:"pie",
    data:{ labels:["Gastos","Sobra"], datasets:[{data:[gastos,sobra]}] }
  });
}

/* ===== BACKUP ===== */
function exportarBackup(){
  const data = { cartoes, lancamentos, assinaturas, rendaPrincipal, rendasExtras };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_financeiro.json";
  a.click();
}

function importarBackup(){
  const file = $("importFile").files[0];
  if(!file) return alert("Selecione um arquivo");
  const r = new FileReader();
  r.onload = e => {
    const d = JSON.parse(e.target.result);
    cartoes=d.cartoes||[]; lancamentos=d.lancamentos||[];
    assinaturas=d.assinaturas||[]; rendaPrincipal=d.rendaPrincipal||{};
    rendasExtras=d.rendasExtras||[];
    localStorage.clear();
    localStorage.setItem("cartoes",JSON.stringify(cartoes));
    localStorage.setItem("lancamentos",JSON.stringify(lancamentos));
    localStorage.setItem("assinaturas",JSON.stringify(assinaturas));
    localStorage.setItem("rendaPrincipal",JSON.stringify(rendaPrincipal));
    localStorage.setItem("rendasExtras",JSON.stringify(rendasExtras));
    renderTudo();
  };
  r.readAsText(file);
}

/* ===== INIT ===== */
function renderTudo(){
  aplicarAssinaturasNoMes();
  renderResumo();
  renderTabela();
}

renderTudo();

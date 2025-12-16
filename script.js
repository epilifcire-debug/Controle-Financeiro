let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

const rendaEl = document.getElementById("rendaTotal");
const gastosEl = document.getElementById("gastosTotal");
const sobraEl = document.getElementById("sobra");

const mesSelect = document.getElementById("mesSelect");
const anoInput = document.getElementById("anoInput");

document.getElementById("addBtn").addEventListener("click", () => {
  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const mes = mesSelect.value;
  const ano = parseInt(anoInput.value);

  if (!valor || !categoria) return alert("Preencha todos os campos!");

  lancamentos.push({ tipo, categoria, descricao, valor, mes, ano });
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
  document.querySelectorAll("#categoria,#descricao,#valor").forEach(i => i.value = "");
  atualizarResumo();
});

function atualizarResumo() {
  const mes = mesSelect.value;
  const ano = parseInt(anoInput.value);
  const dados = lancamentos.filter(l => l.mes === mes && l.ano === ano);

  const renda = dados.filter(l => l.tipo === "Renda").reduce((a,b)=>a+b.valor,0);
  const gastos = dados.filter(l => l.tipo === "Gasto" || l.tipo === "Investimento").reduce((a,b)=>a+b.valor,0);
  const sobra = renda - gastos;

  rendaEl.textContent = `R$ ${renda.toFixed(2)}`;
  gastosEl.textContent = `R$ ${gastos.toFixed(2)}`;
  sobraEl.textContent = `R$ ${sobra.toFixed(2)}`;

  atualizarGraficos(renda, gastos, sobra);
}

function atualizarGraficos(renda, gastos, sobra) {
  const ctxBar = document.getElementById("barChart").getContext("2d");
  const ctxPie = document.getElementById("pieChart").getContext("2d");

  if (window.barChart) window.barChart.destroy();
  if (window.pieChart) window.pieChart.destroy();

  window.barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: ["Renda", "Gastos+Invest.", "Sobra"],
      datasets: [{
        data: [renda, gastos, sobra],
        backgroundColor: ["#38a169","#e53e3e","#3182ce"]
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  window.pieChart = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: ["Gastos", "Sobra"],
      datasets: [{
        data: [gastos, sobra],
        backgroundColor: ["#e53e3e","#38a169"]
      }]
    },
    options: { responsive: true }
  });
}

// Backup export/import
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(lancamentos)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backup_financeiro.json";
  a.click();
});

document.getElementById("importBtn").addEventListener("click", () => {
  const file = document.getElementById("importInput").files[0];
  if (!file) return alert("Selecione um arquivo JSON!");
  const reader = new FileReader();
  reader.onload = e => {
    lancamentos = JSON.parse(e.target.result);
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
    atualizarResumo();
  };
  reader.readAsText(file);
});

atualizarResumo();

// Teste da lógica do buildMovements
function pad(numero) {
  return String(numero).padStart(2, "0");
}

function toISO(ano, indiceMes, dia) {
  return `${ano}-${pad(indiceMes + 1)}-${pad(dia)}`;
}

function getDaysOfMonth(year, monthIndex) {
  const dias = [];
  const ultimoDia = new Date(year, monthIndex + 1, 0).getDate();

  for (let dia = 1; dia <= ultimoDia; dia++) {
    dias.push(toISO(year, monthIndex, dia));
  }

  return dias;
}

function buildMovements() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const indiceMes = agora.getMonth();
  const diasDoMes = getDaysOfMonth(ano, indiceMes);
  const movimentos = [];

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  console.log("Hoje:", hoje.toISOString());
  console.log("Total de dias no mês:", diasDoMes.length);
  console.log("");

  diasDoMes.forEach((isoDate) => {
    const [ano, mes, dia] = isoDate.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
    const diaSemana = dataObj.getDay();

    // Ignora finais de semana
    if (diaSemana === 0 || diaSemana === 6) {
      return;
    }

    const dataJaPassou = dataObj < hoje;

    movimentos.push({
      date: isoDate,
      type: "Não informado",
      points: "-",
      notes: dataJaPassou ? "Sem observações" : "Aguardando preenchimento",
    });
  });

  return movimentos;
}

const movimentos = buildMovements();
console.log("Total de movimentos (dias úteis):", movimentos.length);
console.log("");
console.log("Primeiros 3:");
movimentos.slice(0, 3).forEach((m, i) => {
  console.log(`  ${i + 1}. ${m.date} - ${m.notes}`);
});
console.log("");
console.log("Últimos 3:");
movimentos.slice(-3).forEach((m, i) => {
  console.log(`  ${movimentos.length - 2 + i}. ${m.date} - ${m.notes}`);
});

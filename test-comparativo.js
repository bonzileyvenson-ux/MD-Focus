// Teste de comparação mensal
const realizadoDiario = {};

// Outubro
for (let dia = 1; dia <= 31; dia++) {
  const data = new Date(2025, 9, dia);
  const diaSemana = data.getDay();
  if (diaSemana === 0 || diaSemana === 6) continue;
  const dataStr = data.toISOString().split("T")[0];
  realizadoDiario[dataStr] = 1900;
}

// Novembro (até dia 26)
for (let dia = 1; dia <= 26; dia++) {
  const data = new Date(2025, 10, dia);
  const dataStr = data.toISOString().split("T")[0];
  realizadoDiario[dataStr] = 2200;
}

console.log("Dados gerados:");
console.log("Total de datas:", Object.keys(realizadoDiario).length);

const hoje = new Date();
const mesAtual = hoje.getMonth(); // 10 (Novembro)
const anoAtual = hoje.getFullYear(); // 2025
const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1; // 9 (Outubro)
const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual; // 2025

console.log("\nMês atual:", mesAtual, "(Novembro)");
console.log("Mês anterior:", mesAnterior, "(Outubro)");

let pontosAtual = 0,
  diasAtual = 0;
let pontosAnterior = 0,
  diasAnterior = 0;

Object.entries(realizadoDiario).forEach(([dataKey, pontos]) => {
  const [ano, mes] = dataKey.split("-");
  const mesNum = parseInt(mes) - 1; // Converter para índice 0-based

  if (parseInt(ano) === anoAtual && mesNum === mesAtual) {
    pontosAtual += pontos;
    diasAtual++;
  } else if (parseInt(ano) === anoAnterior && mesNum === mesAnterior) {
    pontosAnterior += pontos;
    diasAnterior++;
  }
});

console.log("\nResultados:");
console.log("Outubro:", diasAnterior, "dias,", pontosAnterior, "pontos");
console.log("Novembro:", diasAtual, "dias,", pontosAtual, "pontos");

const variacaoPontos =
  pontosAnterior > 0
    ? ((pontosAtual - pontosAnterior) / pontosAnterior) * 100
    : 0;

console.log("\nVariação:", variacaoPontos.toFixed(1) + "%");

// Mostra algumas datas para debug
console.log("\nPrimeiras 5 datas:");
Object.keys(realizadoDiario)
  .slice(0, 5)
  .forEach((k) => {
    const [ano, mes] = k.split("-");
    console.log(k, "-> mês", parseInt(mes) - 1);
  });

console.log("\nÚltimas 5 datas:");
Object.keys(realizadoDiario)
  .slice(-5)
  .forEach((k) => {
    const [ano, mes] = k.split("-");
    console.log(k, "-> mês", parseInt(mes) - 1);
  });

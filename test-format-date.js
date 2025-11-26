function formatDateISO(dateStr) {
  const [ano, mes, dia] = dateStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

console.log("Teste 1 (01/11):", formatDateISO("2025-11-01"));
console.log("Teste 2 (28/11):", formatDateISO("2025-11-28"));
console.log("Teste 3 (15/11):", formatDateISO("2025-11-15"));

// Testa identificação de dia da semana
function testDiaSemana(isoDate) {
  const [ano, mes, dia] = isoDate.split("-").map(Number);
  const dataObj = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return dias[dataObj.getDay()];
}

console.log("\nDias da semana:");
console.log("2025-11-01 é:", testDiaSemana("2025-11-01"));
console.log("2025-11-02 é:", testDiaSemana("2025-11-02"));
console.log("2025-11-03 é:", testDiaSemana("2025-11-03"));
console.log("2025-11-28 é:", testDiaSemana("2025-11-28"));

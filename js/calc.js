export function contarDiasUteis(diasOffAgendados = []) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
  const diaAtual = hoje.getDate();

  let diasUteisRestantes = 0;
  let diasUteisPassados = 0;
  let totalDiasUteisMes = 0;

  // Normaliza as datas para o formato 'DD/MM/YYYY' para garantir a correspondência
  const datasOffFormatadas = diasOffAgendados.map(dataStr => {
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      // Formato DD/MM/YYYY já está correto
      return `${partes[0].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[2]}`;
    }
    return dataStr; // Retorna o original se não estiver no formato esperado
  });


  for (let dia = 1; dia <= ultimoDiaMes; dia++) {
    const data = new Date(ano, mes, dia);
    const diaDaSemana = data.getDay();

    // Cria a data no formato DD/MM/YYYY para verificação
    const dataAtualFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
    
    // Verifica se a data atual está na lista de dias de folga
    const isDiaOff = datasOffFormatadas.includes(dataAtualFormatada);

    const isDiaUtil = diaDaSemana !== 0 && diaDaSemana !== 6 && !isDiaOff;

    if (isDiaUtil) {
      totalDiasUteisMes++;
      if (dia >= diaAtual) {
        diasUteisRestantes++;
      }
      if (dia < diaAtual) {
        diasUteisPassados++;
      }
    }
  }

  return {
    totalDiasUteisMes,
    diasUteisPassados,
    diasUteisRestantes,
  };
}



export function calcularEAtualizarDashboard(dado) {
  // obtenção de tempo
  const { totalDiasUteisMes, diasUteisRestantes } = contarDiasUteis(dado.diasOffAgendados);

  // obtenção de valores

  const metaTotal = Number(dado.metaMensal);
  const realizado = Number(dado.realizadoTotal);
  const mediaSemanal = calcularMediaSemanal(dado.realizadoDiario);

  // calculo

  const faltante = metaTotal - realizado;

  let metaDiariaNecessaria = 0;
  if (diasUteisRestantes > 0) {
    metaDiariaNecessaria = faltante / diasUteisRestantes;
  } else if (faltante > 0) {
    metaDiariaNecessaria = faltante;
  }

  const percentualProgresso = metaTotal > 0 ? (realizado / metaTotal) * 100 : 0;

  return {
    // A meta diária nunca é negativa (se a meta foi superada, a meta diária é 0)
    metaDiariaNecessaria: Math.max(0, metaDiariaNecessaria),

    percentualProgresso: Math.min(100, percentualProgresso),
    faltante: Math.max(0, faltante),
    isMetaBatida: realizado >= metaTotal,
    totalDiasUteisMes: totalDiasUteisMes,
    diasUteisRestantes: diasUteisRestantes, // Adicionado para o cálculo rápido
    mediaSemanal: mediaSemanal,
  };
}


// DEFINIÇÃO CRÍTICA: Circunferência do círculo (2 * PI * Raio, onde Raio é 45)
const CIRCUMFERENCE = 283; 

export function atualizarGraficoCircular(percentual, metaDiariaNecessaria) {
    const fillElement = document.getElementById('progress-fill');
    const textElement = document.getElementById('progress-text');
    
    if (!fillElement || !textElement) return;

    // Garante que o progresso esteja entre 0 e 100
    const progresso = Math.min(100, Math.max(0, percentual));
    
    // CÁLCULO PRINCIPAL DO SVG: 
    // O offset é o "espaço não preenchido" do círculo. 
    // Ex: 50% de progresso = 50% do espaço é 'vazio' (offset).
    const offset = CIRCUMFERENCE - (progresso / 100) * CIRCUMFERENCE;

    // 1. Aplica o preenchimento (faz o círculo girar visualmente)
    fillElement.style.strokeDashoffset = offset;
    
    // 2. Atualiza o texto
    textElement.textContent = `${Math.round(progresso)}%`;
    
    // 3. Lógica de Cor (Usando os valores HEX/RGB que o CSS entende)
    let cor;
    if (progresso >= 100) {
        cor = "#38c172"; 
    } else if (metaDiariaNecessaria > 2500) { 
        cor = "#ff9800"; 
    } else {
        cor = "#007bff"; 
    }
    
    // 4. Injeta a cor no traço
    fillElement.style.stroke = cor;
}
export function calcularMediaSemanal(realizadoDiaria) {
  if (!realizadoDiaria || Object.keys(realizadoDiaria).length === 0) {
    return 0;
  }

  const dataOrdenadas = Object.keys(realizadoDiaria).sort().reverse();
  const Ultimos5Dias = dataOrdenadas.slice(0, 5);

  let somaPontos = 0;

  Ultimos5Dias.forEach((data) => {
    somaPontos += realizadoDiaria[data];
  });

  const media = somaPontos / Ultimos5Dias.length;
  return media;
}

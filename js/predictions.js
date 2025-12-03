// ============================================================================
// PREDICTIONS.JS - Sistema de Análises e Previsões
// ============================================================================
// 📊 Propósito: Calcular projeções, ritmo, e comparações semanais
// 🎯 Componentes:
//    1. Card de Projeção Mensal
//    2. Velocímetro de Ritmo
//    3. Comparação Semanal (últimas 4 semanas)
// ============================================================================

import { getDadosUsuario, MAPA_METAS } from "./data.js";
import { contarDiasUteis } from "./calc.js";

// ============================================================================
// SISTEMA DE CACHE PARA PERFORMANCE
// ============================================================================

const cacheCalculos = {
  projecao: null,
  ritmo: null,
  semanal: null,
  timestamp: null,
  dadosHash: null,
};

/**
 * Gera hash simples dos dados para detectar mudanças
 * @param {Object} dados - Dados do usuário
 * @returns {string} Hash dos dados relevantes
 */
function gerarHashDados(dados) {
  if (!dados) return null;
  const realizadoKeys = Object.keys(dados.realizadoDiario || {}).sort();
  const realizadoTotal = realizadoKeys.reduce(
    (sum, key) => sum + (dados.realizadoDiario[key] || 0),
    0
  );
  return `${dados.metaMensal}_${realizadoTotal}_${
    realizadoKeys.length
  }_${new Date().getDate()}`;
}

/**
 * Limpa cache quando dados mudam
 */
export function limparCache() {
  cacheCalculos.projecao = null;
  cacheCalculos.ritmo = null;
  cacheCalculos.semanal = null;
  cacheCalculos.dadosHash = null;
}

// ============================================================================
// FUNÇÕES HELPER DE PLURALIZAÇÃO
// ============================================================================

/**
 * Retorna "dia" ou "dias" baseado na quantidade
 * @param {number} quantidade - Número de dias
 * @returns {string} "dia" ou "dias"
 */
function pluralDia(quantidade) {
  return quantidade === 1 ? "dia" : "dias";
}

/**
 * Retorna "útil" ou "úteis" baseado na quantidade
 * @param {number} quantidade - Número de dias úteis
 * @returns {string} "útil" ou "úteis"
 */
function pluralUtil(quantidade) {
  return quantidade === 1 ? "útil" : "úteis";
}

/**
 * Retorna "trabalhado" ou "trabalhados" baseado na quantidade
 * @param {number} quantidade - Número de dias trabalhados
 * @returns {string} "trabalhado" ou "trabalhados"
 */
function pluralTrabalhado(quantidade) {
  return quantidade === 1 ? "trabalhado" : "trabalhados";
}

// ============================================================================
// CÁLCULOS DE PROJEÇÃO
// ============================================================================

/**
 * Calcula a projeção de onde o usuário vai terminar o mês
 * @returns {Object} Dados da projeção
 */
export function calcularProjecaoMensal() {
  const dados = getDadosUsuario();
  if (!dados) return null;

  // Verificar cache
  const hashAtual = gerarHashDados(dados);
  if (cacheCalculos.projecao && cacheCalculos.dadosHash === hashAtual) {
    return cacheCalculos.projecao;
  }

  const { realizadoDiario, metaMensal, diasOffAgendados } = dados;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Calcular dias úteis
  const { totalDiasUteisMes, diasUteisRestantes, diasUteisPassados } =
    contarDiasUteis(diasOffAgendados || []);

  // Calcular realizado até agora (apenas dias do mês atual)
  let realizadoAtual = 0;
  let diasTrabalhados = 0;

  Object.keys(realizadoDiario).forEach((dataKey) => {
    const [ano, mes, dia] = dataKey.split("-").map(Number);
    if (ano === anoAtual && mes === mesAtual + 1) {
      realizadoAtual += realizadoDiario[dataKey] || 0;
      if (realizadoDiario[dataKey] > 0) diasTrabalhados++;
    }
  });

  // Calcular média diária real
  const mediaDiaria =
    diasTrabalhados > 0 ? realizadoAtual / diasTrabalhados : 0;

  // Projeção final = realizado + (média × dias restantes)
  const projecaoFinal = realizadoAtual + mediaDiaria * diasUteisRestantes;

  // Percentual da meta escolhida
  const percentualMeta =
    metaMensal > 0 ? (projecaoFinal / metaMensal) * 100 : 0;

  // NOVA LÓGICA: Descobrir qual meta você está realmente conquistando
  const METAS_ORDENADAS = [
    { nome: "600", valor: 90000 },
    { nome: "500", valor: 65000 },
    { nome: "400", valor: 55000 },
    { nome: "300", valor: 45000 },
  ];

  let metaRealConquistada = null;
  let metaRealNome = "Abaixo de 300";
  let proximaMeta = null;
  let proximaMetaNome = "";
  let metasBatidas = [];

  // Encontrar qual meta você vai atingir com seu ritmo
  for (let i = METAS_ORDENADAS.length - 1; i >= 0; i--) {
    if (projecaoFinal >= METAS_ORDENADAS[i].valor) {
      metaRealConquistada = METAS_ORDENADAS[i].valor;
      metaRealNome = METAS_ORDENADAS[i].nome;
      metasBatidas.push(METAS_ORDENADAS[i].nome);
    }
  }

  // Encontrar próxima meta alcançável
  for (let i = 0; i < METAS_ORDENADAS.length; i++) {
    if (METAS_ORDENADAS[i].valor > projecaoFinal) {
      proximaMeta = METAS_ORDENADAS[i].valor;
      proximaMetaNome = METAS_ORDENADAS[i].nome;
      break;
    }
  }

  // Calcular diferença entre meta escolhida e meta real
  const diferencaMeta = projecaoFinal - metaMensal;
  const estaSuperando = diferencaMeta > 0;

  // Determinar status (sucesso/alerta/crítico)
  let status = "critico";
  let mensagem = "";
  let icone = "⚠️";

  if (percentualMeta >= 100) {
    status = "sucesso";
    if (estaSuperando) {
      const metasTexto =
        metasBatidas.length > 1
          ? `${metasBatidas.length} metas (${metasBatidas.join(", ")})`
          : `meta ${metaRealNome}`;
      mensagem = `Incrível! Você vai bater ${metasTexto}!`;
    } else {
      mensagem = "Excelente! Você vai bater a meta!";
    }
    icone = "🎯";
  } else if (percentualMeta >= 90) {
    status = "alerta";
    mensagem = `Quase lá! Ritmo para meta ${metaRealNome}.`;
    icone = "📊";
  } else if (percentualMeta >= 70) {
    status = "alerta";
    mensagem = `Atenção! Seu ritmo está para meta ${metaRealNome}.`;
    icone = "⚡";
  } else {
    status = "critico";
    mensagem = `Ritmo atual: meta ${metaRealNome}. Acelere!`;
    icone = "⚠️";
  }

  // Calcular ritmo necessário para completar a meta
  const faltaParaMeta = metaMensal - realizadoAtual;
  const ritmoNecessario =
    diasUteisRestantes > 0 ? faltaParaMeta / diasUteisRestantes : 0;

  const resultado = {
    realizadoAtual,
    projecaoFinal,
    percentualMeta: Math.round(percentualMeta),
    mediaDiaria: Math.round(mediaDiaria),
    ritmoAtual: Math.round(mediaDiaria),
    ritmoNecessario: Math.round(ritmoNecessario),
    diasRestantes: diasUteisRestantes,
    diasTrabalhados,
    totalDiasUteis: totalDiasUteisMes,
    metaMensal,
    metaRealConquistada,
    metaRealNome,
    proximaMeta,
    proximaMetaNome,
    metasBatidas,
    diferencaMeta: Math.round(diferencaMeta),
    estaSuperando,
    status,
    mensagem,
    icone,
  };

  // Salvar no cache
  cacheCalculos.projecao = resultado;
  cacheCalculos.dadosHash = hashAtual;

  return resultado;
}

// ============================================================================
// CÁLCULOS DE RITMO
// ============================================================================

/**
 * Calcula o ritmo atual vs ritmo necessário
 * @returns {Object} Dados do ritmo
 */
export function calcularRitmoAtual() {
  const dados = getDadosUsuario();
  if (!dados) return null;

  const { realizadoDiario, metaMensal, diasOffAgendados } = dados;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Calcular dias úteis
  const { totalDiasUteisMes, diasUteisRestantes, diasUteisPassados } =
    contarDiasUteis(diasOffAgendados || []);

  // Calcular realizado até agora
  let realizadoAtual = 0;
  let diasTrabalhados = 0;

  Object.keys(realizadoDiario).forEach((dataKey) => {
    const [ano, mes, dia] = dataKey.split("-").map(Number);
    if (ano === anoAtual && mes === mesAtual + 1) {
      realizadoAtual += realizadoDiario[dataKey] || 0;
      if (realizadoDiario[dataKey] > 0) diasTrabalhados++;
    }
  });

  // Ritmo atual (média diária real)
  const ritmoAtual = diasTrabalhados > 0 ? realizadoAtual / diasTrabalhados : 0;

  // Ritmo necessário para bater a meta
  const faltaParaMeta = metaMensal - realizadoAtual;
  const ritmoNecessario =
    diasUteisRestantes > 0 ? faltaParaMeta / diasUteisRestantes : 0;

  // Comparação: ritmo atual / ritmo necessário
  const comparacao =
    ritmoNecessario > 0 ? (ritmoAtual / ritmoNecessario) * 100 : 100;

  // Determinar status
  let status = "atrasado";
  let mensagemStatus = "Atrasado";
  let cor = "#e74c3c";

  if (comparacao >= 100) {
    status = "adiantado";
    mensagemStatus = "Adiantado!";
    cor = "#2ecc71";
  } else if (comparacao >= 90) {
    status = "no-ritmo";
    mensagemStatus = "No Ritmo";
    cor = "#f39c12";
  }

  // Percentual do velocímetro (0-100, com máximo em 150%)
  const percentualGauge = Math.min((comparacao / 150) * 100, 100);

  return {
    ritmoAtual: Math.round(ritmoAtual),
    ritmoNecessario: Math.round(ritmoNecessario),
    comparacao: Math.round(comparacao),
    percentualGauge: Math.round(percentualGauge),
    status,
    mensagemStatus,
    cor,
    realizadoAtual,
    faltaParaMeta: Math.max(0, faltaParaMeta),
    diasRestantes: diasUteisRestantes,
  };
}

// ============================================================================
// COMPARAÇÃO SEMANAL
// ============================================================================

/**
 * Obtém dados das últimas 4 semanas
 * @returns {Array} Array com dados de 4 semanas
 */
export function obterDadosSemanais() {
  const dados = getDadosUsuario();
  if (!dados) return [];

  const { realizadoDiario } = dados;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const semanas = [];

  // Determinar início do mês
  const inicioMes = new Date(anoAtual, mesAtual, 1);

  // Criar semanas do mês atual (do dia 1 até hoje)
  // Dividir o mês em 4 semanas aproximadas
  const diasDoMes = hoje.getDate(); // Quantos dias já passaram no mês
  const numSemanas = Math.ceil(diasDoMes / 7);

  for (let i = 0; i < 4; i++) {
    const inicioSemana = new Date(anoAtual, mesAtual, 1 + i * 7);
    const fimSemana = new Date(
      anoAtual,
      mesAtual,
      Math.min((i + 1) * 7, diasDoMes)
    );

    // Se a semana ainda não começou, pular
    if (inicioSemana > hoje) continue;

    let totalSemana = 0;
    let diasTrabalhados = 0;

    Object.keys(realizadoDiario).forEach((dataKey) => {
      const [ano, mes, dia] = dataKey.split("-").map(Number);
      const dataRegistro = new Date(ano, mes - 1, dia);

      if (dataRegistro >= inicioSemana && dataRegistro <= fimSemana) {
        totalSemana += realizadoDiario[dataKey] || 0;
        if (realizadoDiario[dataKey] > 0) diasTrabalhados++;
      }
    });

    // Label mais clara: "1-7 dez" ou "8-14 dez"
    const mesNome = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ][mesAtual];
    const diaInicio = inicioSemana.getDate();
    const diaFim = fimSemana.getDate();
    const semanaFormatada = `${diaInicio}-${diaFim} ${mesNome}`;

    // A última semana é a atual
    const ehSemanaAtual =
      i === numSemanas - 1 || fimSemana.getDate() === diasDoMes;

    semanas.push({
      label: semanaFormatada,
      total: totalSemana,
      diasTrabalhados,
      isSemanaAtual: ehSemanaAtual,
    });
  }

  // Calcular média
  const mediaSemanal =
    semanas.length > 0
      ? Math.round(
          semanas.reduce((acc, s) => acc + s.total, 0) / semanas.length
        )
      : 0;

  return { semanas, mediaSemanal };
}

// ============================================================================
// RENDERIZAÇÃO HTML
// ============================================================================

/**
 * Gera HTML do Card de Projeção
 * @returns {string} HTML
 */
export function gerarCardProjecao() {
  const projecao = calcularProjecaoMensal();
  if (!projecao) return "<p>Sem dados disponíveis</p>";

  const {
    realizadoAtual,
    projecaoFinal,
    percentualMeta,
    mediaDiaria,
    diasRestantes,
    metaMensal,
    metaRealConquistada,
    metaRealNome,
    diferencaMeta,
    estaSuperando,
    status,
    mensagem,
    icone,
  } = projecao;

  return `
    <div class="prediction-card card-projecao ${status}">
      <div class="card-header">
        <h3>${icone} Projeção Mensal</h3>
      </div>
      <div class="card-body">
        <div class="projecao-principal">
          <div class="valor-projecao">${projecaoFinal.toLocaleString()}</div>
          <div class="label-projecao">Projeção com Seu Ritmo</div>
          <div class="percentual-meta ${status}">${percentualMeta}% da meta escolhida</div>
        </div>

        <!-- Nova seção: Meta Real que está conquistando -->
        <div class="meta-real-section ${status}">
          <div class="meta-real-badge">
            <span class="badge-label">Você vai alcançar:</span>
            <span class="badge-value">Meta ${metaRealNome} (${
    metaRealConquistada
      ? metaRealConquistada.toLocaleString()
      : projecaoFinal.toLocaleString()
  }/mês)</span>
          </div>
          ${
            metaRealConquistada
              ? `
          <div class="diferenca-meta ${
            estaSuperando ? "positiva" : "negativa"
          }">
            <i class="bi bi-${
              estaSuperando ? "arrow-up" : "arrow-down"
            }-circle-fill"></i>
            <span>${
              estaSuperando ? "+" : ""
            }${diferencaMeta.toLocaleString()} vs meta escolhida</span>
          </div>
          `
              : '<div class="alerta-meta">⚠️ Abaixo da menor meta</div>'
          }
        </div>

        <div class="projecao-detalhes">
          <div class="detalhe-item">
            <span class="detalhe-label">Realizado Atual:</span>
            <span class="detalhe-valor">${realizadoAtual.toLocaleString()}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label">Meta Escolhida:</span>
            <span class="detalhe-valor">${metaMensal.toLocaleString()}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label">Média Diária Real:</span>
            <span class="detalhe-valor">${mediaDiaria.toLocaleString()}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-label">Dias Úteis Restantes:</span>
            <span class="detalhe-valor">${diasRestantes} ${pluralDia(
    diasRestantes
  )}</span>
          </div>
        </div>

        <div class="projecao-mensagem ${status}">
          ${mensagem}
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera HTML do Velocímetro de Ritmo
 * @returns {string} HTML
 */
export function gerarVelocimetro() {
  const ritmo = calcularRitmoAtual();
  if (!ritmo) return "<p>Sem dados disponíveis</p>";

  const {
    ritmoAtual,
    ritmoNecessario,
    comparacao,
    percentualGauge,
    status,
    mensagemStatus,
    cor,
    faltaParaMeta,
    diasRestantes,
  } = ritmo;

  // Calcular ângulo do arco (0° a 180°)
  const angulo = (percentualGauge / 100) * 180;

  return `
    <div class="prediction-card card-velocimetro">
      <div class="card-header">
        <h3>⚡ Velocímetro de Ritmo</h3>
      </div>
      <div class="card-body">
        <div class="gauge-container">
          <svg viewBox="0 0 200 110" class="gauge-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Background arc -->
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e0e0e0"
              stroke-width="18"
              stroke-linecap="round"
            />
            <!-- Progress arc -->
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="${cor}"
              stroke-width="18"
              stroke-linecap="round"
              stroke-dasharray="251.2"
              stroke-dashoffset="${251.2 - (251.2 * percentualGauge) / 100}"
              class="gauge-progress"
              style="transition: stroke-dashoffset 1s ease;"
            />
            <!-- Needle -->
            <g class="gauge-needle" style="transform-origin: 100px 100px; transform: rotate(${
              angulo - 90
            }deg); transition: transform 1s ease;">
              <line x1="100" y1="100" x2="100" y2="35" stroke="${cor}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="100" cy="100" r="5" fill="${cor}"/>
            </g>
          </svg>

          <div class="gauge-label">
            <div class="gauge-status ${status}">${mensagemStatus}</div>
            <div class="gauge-percentual">${comparacao}%</div>
          </div>
        </div>

        <div class="ritmo-detalhes">
          <div class="ritmo-item">
            <div class="ritmo-titulo">Seu Ritmo</div>
            <div class="ritmo-valor">${ritmoAtual}/dia</div>
          </div>
          <div class="ritmo-divisor">vs</div>
          <div class="ritmo-item">
            <div class="ritmo-titulo">Necessário</div>
            <div class="ritmo-valor">${ritmoNecessario}/dia</div>
          </div>
        </div>

        <div class="ritmo-info">
          <p>Falta: <strong>${faltaParaMeta.toLocaleString()}</strong> em <strong>${diasRestantes}</strong> ${pluralDia(
    diasRestantes
  )} ${pluralUtil(diasRestantes)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera HTML do Gráfico de Comparação Semanal
 * @returns {string} HTML
 */
export function gerarGraficoSemanal() {
  const { semanas, mediaSemanal } = obterDadosSemanais();
  const projecao = calcularProjecaoMensal();

  if (!semanas || semanas.length === 0)
    return "<p>Sem dados semanais disponíveis</p>";

  // Análises adicionais
  const semanaAtual = semanas.find((s) => s.isSemanaAtual);
  const semanasAnteriores = semanas.filter((s) => !s.isSemanaAtual);
  const melhorSemana = semanas.reduce(
    (max, s) => (s.total > max.total ? s : max),
    semanas[0]
  );
  const piorSemana = semanas.reduce(
    (min, s) => (s.total < min.total ? s : min),
    semanas[0]
  );

  // Calcular tendência (comparando últimas 2 semanas)
  let tendencia = "estável";
  let tendenciaIcon = "bi-dash-circle";
  let tendenciaTexto = "Mantendo o ritmo";

  if (semanasAnteriores.length >= 2) {
    const penultima = semanasAnteriores[semanasAnteriores.length - 2].total;
    const ultima = semanasAnteriores[semanasAnteriores.length - 1].total;
    const diferenca = ((ultima - penultima) / penultima) * 100;

    if (diferenca > 10) {
      tendencia = "subindo";
      tendenciaIcon = "bi-arrow-up-circle-fill";
      tendenciaTexto = `Crescendo ${Math.round(diferenca)}%`;
    } else if (diferenca < -10) {
      tendencia = "descendo";
      tendenciaIcon = "bi-arrow-down-circle-fill";
      tendenciaTexto = `Caindo ${Math.abs(Math.round(diferenca))}%`;
    }
  }

  // Meta semanal esperada (baseada na meta mensal)
  const metaSemanal = projecao ? Math.round(projecao.metaMensal / 4) : 0;
  const semanaAtualVsMeta = semanaAtual
    ? ((semanaAtual.total / metaSemanal) * 100).toFixed(0)
    : 0;
  const semanaAtualVsMedia = semanaAtual
    ? ((semanaAtual.total / mediaSemanal) * 100).toFixed(0)
    : 0;

  // Encontrar valor máximo para normalizar alturas
  const maxValor = Math.max(...semanas.map((s) => s.total), metaSemanal, 1);

  const barrasHTML = semanas
    .map((semana, index) => {
      const altura = (semana.total / maxValor) * 100;
      const classeAtual = semana.isSemanaAtual ? "semana-atual" : "";
      const ehMelhor = semana.label === melhorSemana.label;
      const ehPior = semana.label === piorSemana.label && semanas.length > 1;

      return `
      <div class="barra-container ${classeAtual}" style="animation-delay: ${
        index * 0.1
      }s;">
        <div class="barra-valor">${semana.total.toLocaleString()}</div>
        <div class="barra" style="height: ${altura}%;">
          <div class="barra-fill"></div>
        </div>
        <div class="barra-label">${semana.label}</div>
        ${semana.isSemanaAtual ? '<div class="badge-atual">Atual</div>' : ""}
        ${
          ehMelhor && !semana.isSemanaAtual
            ? '<div class="badge-melhor">🏆</div>'
            : ""
        }
        ${
          ehPior && !semana.isSemanaAtual
            ? '<div class="badge-pior">⚠️</div>'
            : ""
        }
      </div>
    `;
    })
    .join("");

  return `
    <div class="prediction-card card-grafico">
      <div class="card-header">
        <h3>📊 Comparação Semanal</h3>
      </div>
      <div class="card-body">
        <div class="grafico-container">
          ${barrasHTML}
        </div>

        <div class="grafico-stats">
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-graph-up"></i></div>
            <div class="stat-content">
              <div class="stat-label">Média Semanal</div>
              <div class="stat-valor">${mediaSemanal.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon"><i class="bi ${tendenciaIcon}"></i></div>
            <div class="stat-content">
              <div class="stat-label">Tendência</div>
              <div class="stat-valor ${tendencia}">${tendenciaTexto}</div>
            </div>
          </div>
          
          ${
            metaSemanal > 0
              ? `
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-bullseye"></i></div>
            <div class="stat-content">
              <div class="stat-label">Meta Semanal</div>
              <div class="stat-valor">${metaSemanal.toLocaleString()}</div>
            </div>
          </div>
          `
              : ""
          }
        </div>

        ${
          semanaAtual
            ? `
        <div class="semana-atual-analise">
          <h4><i class="bi bi-calendar-week"></i> Semana Atual</h4>
          <div class="analise-grid">
            <div class="analise-item ${
              semanaAtualVsMedia >= 100 ? "positivo" : "negativo"
            }">
              <span class="analise-label">vs Média:</span>
              <span class="analise-valor">${semanaAtualVsMedia}%</span>
            </div>
            ${
              metaSemanal > 0
                ? `
            <div class="analise-item ${
              semanaAtualVsMeta >= 100 ? "positivo" : "negativo"
            }">
              <span class="analise-label">vs Meta:</span>
              <span class="analise-valor">${semanaAtualVsMeta}%</span>
            </div>
            `
                : ""
            }
          </div>
          <p class="analise-texto">
            ${
              semanaAtualVsMedia >= 110
                ? "🔥 Semana excepcional! Você está acima da sua média!"
                : semanaAtualVsMedia >= 90
                ? "✅ Ótimo desempenho! Mantendo o padrão."
                : semanaAtualVsMedia >= 70
                ? "⚡ Você pode melhorar! Ainda dá tempo de acelerar."
                : "⚠️ Atenção! Esta semana está abaixo do esperado."
            }
          </p>
        </div>
        `
            : ""
        }

        <div class="grafico-legenda">
          <div class="legenda-item">
            <div class="legenda-cor atual"></div>
            <span>Semana Atual</span>
          </div>
          <div class="legenda-item">
            <div class="legenda-cor anterior"></div>
            <span>Semanas Anteriores</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera card explicativo detalhado sobre o ritmo e metas
 */
function gerarCardExplicativo() {
  const projecao = calcularProjecaoMensal();
  const dadosUsuario = getDadosUsuario();

  // Validação de segurança
  if (!projecao || !dadosUsuario) {
    return `<div class="card card-explicativo"><p>Erro ao carregar dados</p></div>`;
  }

  // Garantir valores padrão para evitar undefined
  const metaEscolhidaValor = projecao?.metaMensal || 45000; // Valor mensal da meta escolhida
  const ritmoAtual = projecao?.ritmoAtual || 0;
  const ritmoNecessario = projecao?.ritmoNecessario || 0;
  const metaRealNome = projecao?.metaRealNome || "Abaixo de 300";
  const metaRealConquistada = projecao?.metaRealConquistada || 0;
  const projecaoFinal = projecao?.projecaoFinal || 0;
  const estaSuperando = projecao?.estaSuperando || false;

  // Descobrir qual é a chave da meta escolhida (300, 400, 500, 600)
  const metaEscolhida =
    Object.keys(MAPA_METAS).find(
      (key) => MAPA_METAS[key] === metaEscolhidaValor
    ) ||
    dadosUsuario?.metaEscolhida ||
    300;
  const proximaMeta = projecao?.proximaMeta || null;
  const proximaMetaNome = projecao?.proximaMetaNome || "";
  const metasBatidas = projecao?.metasBatidas || [];
  const percentualMeta = projecao?.percentualMeta || 0;

  // Calcula quanto falta para atingir a meta escolhida (garantindo valores numéricos)
  const valorComparar =
    metaRealConquistada > 0 ? metaRealConquistada : projecaoFinal;
  const diferenca = projecaoFinal - metaEscolhidaValor; // Diferença real: projeção - meta escolhida
  const diferencaDiaria = Math.abs(ritmoNecessario - ritmoAtual);
  const faltaProximaMeta = proximaMeta ? proximaMeta - projecaoFinal : 0;
  const ritmoParaProximaMeta =
    proximaMeta && projecao.diasRestantes > 0
      ? Math.ceil(
          (faltaProximaMeta + (projecaoFinal - projecao.realizadoAtual)) /
            projecao.diasRestantes
        )
      : 0;

  // Determina status geral
  let statusClass = "";
  let statusText = "";
  let statusIcon = "";

  if (estaSuperando) {
    statusClass = "superando";
    statusText = "Você está superando sua meta!";
    statusIcon = "bi-trophy-fill";
  } else if (Math.abs(diferenca) < metaEscolhidaValor * 0.1) {
    // Dentro de 10% da meta
    statusClass = "proximo";
    statusText = "Você está próximo da sua meta!";
    statusIcon = "bi-bullseye";
  } else {
    statusClass = "abaixo";
    statusText = "Você pode melhorar!";
    statusIcon = "bi-flag-fill";
  }

  return `
    <div class="card card-explicativo ${statusClass}">
      <div class="card-header">
        <i class="bi bi-lightbulb-fill"></i>
        <h3>Entenda Seu Ritmo</h3>
      </div>

      <div class="card-body">
        <div class="status-badge ${statusClass}">
          <i class="bi ${statusIcon}"></i>
          <span>${statusText}</span>
        </div>

        <div class="explicacao-principal">
          <h4>Situação Atual</h4>
          <p class="texto-destaque">
            Com seu ritmo atual de <strong>${ritmoAtual.toLocaleString()}/dia</strong>, 
            você está ${
              metaRealConquistada > 0
                ? `conquistando a <strong>meta ${metaRealNome}</strong> (${metaRealConquistada.toLocaleString()} no mês)`
                : `projetado para <strong>${projecaoFinal.toLocaleString()}</strong> no mês (abaixo da meta 300)`
            }.
          </p>
        </div>

        <div class="cenarios-container">
          <div class="cenario cenario-atual">
            <div class="cenario-header">
              <i class="bi bi-graph-up-arrow"></i>
              <h5>Se Mantiver o Ritmo</h5>
            </div>
            <div class="cenario-body">
              <div class="cenario-meta">
                <span class="cenario-label">Meta Alcançada:</span>
                <span class="cenario-valor meta-real">${metaRealNome} ${
    metaRealConquistada > 0
      ? `(${metaRealConquistada.toLocaleString()})`
      : `(${projecaoFinal.toLocaleString()})`
  }</span>
              </div>
              <div class="cenario-ritmo">
                <span class="cenario-label">Ritmo Diário:</span>
                <span class="cenario-valor">${ritmoAtual.toLocaleString()}</span>
              </div>
            </div>
          </div>

          ${
            !estaSuperando
              ? `
          <div class="cenario cenario-necessario">
            <div class="cenario-header">
              <i class="bi bi-target"></i>
              <h5>Para Atingir Sua Meta ${metaEscolhida}</h5>
            </div>
            <div class="cenario-body">
              <div class="cenario-meta">
                <span class="cenario-label">Meta Escolhida:</span>
                <span class="cenario-valor meta-escolhida">${metaEscolhida} (${metaEscolhidaValor.toLocaleString()}/mês)</span>
              </div>
              <div class="cenario-ritmo">
                <span class="cenario-label">Ritmo Necessário:</span>
                <span class="cenario-valor destaque">${ritmoNecessario.toLocaleString()}/dia</span>
              </div>
              <div class="cenario-diferenca">
                <i class="bi bi-plus-circle-fill"></i>
                <span>Precisa aumentar <strong>+${diferencaDiaria.toLocaleString()}/dia</strong></span>
              </div>
            </div>
          </div>
          `
              : `
          <div class="cenario cenario-parabens">
            <div class="cenario-header">
              <i class="bi bi-star-fill"></i>
              <h5>Parabéns!</h5>
            </div>
            <div class="cenario-body">
              <p class="texto-parabens">
                Você está <strong>${percentualMeta}%</strong> da meta escolhida!
                ${
                  diferenca > 0
                    ? `Isso é <strong>+${diferenca.toLocaleString()}</strong> acima!`
                    : ""
                }
              </p>
              ${
                proximaMeta
                  ? `
              <div class="cenario-extra">
                <i class="bi bi-arrow-up-circle-fill"></i>
                <span>Aumentando para <strong>${ritmoParaProximaMeta}/dia</strong>, você alcança a meta ${proximaMetaNome} (${proximaMeta.toLocaleString()})!</span>
              </div>`
                  : `
              <div class="cenario-extra">
                <i class="bi bi-trophy-fill"></i>
                <span>Você está batendo a maior meta possível! Incrível!</span>
              </div>`
              }
            </div>
          </div>
          `
          }
        </div>

        <div class="dica-container">
          <div class="dica-header">
            <i class="bi bi-info-circle-fill"></i>
            <span>Dica</span>
          </div>
          <p class="dica-texto">
            ${
              estaSuperando && proximaMeta
                ? `Seu desempenho está excelente! Com apenas <strong>+${
                    ritmoParaProximaMeta - ritmoAtual
                  }/dia</strong>, você conquista a meta ${proximaMetaNome}!`
                : estaSuperando
                ? "Parabéns! Você está batendo a maior meta disponível. Continue esse ritmo excepcional!"
                : percentualMeta >= 95
                ? "Você está quase lá! Um pequeno esforço extra por dia faz toda a diferença."
                : percentualMeta >= 85
                ? `Está próximo! Aumentando <strong>+${diferencaDiaria}/dia</strong>, você alcança sua meta.`
                : percentualMeta >= 70
                ? `Foque em consistência! Com <strong>+${diferencaDiaria}/dia</strong>, você atinge sua meta escolhida.`
                : `Acelere o ritmo! São necessários <strong>+${diferencaDiaria}/dia</strong> para conquistar sua meta de ${metaEscolhida}.`
            }
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza toda a seção de análises
 */
export function renderizarAnalises() {
  const container = document.getElementById("predictions-container");
  if (!container) return;

  container.innerHTML = `
    ${gerarCardProjecao()}
    ${gerarVelocimetro()}
    ${gerarCardExplicativo()}
    ${gerarGraficoSemanal()}
  `;
}

// Expor função de limpar cache globalmente para ser chamada quando dados mudam
if (typeof window !== "undefined") {
  window.limparCachePredictions = limparCache;
}

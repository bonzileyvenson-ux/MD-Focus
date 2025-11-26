/**
 * MÓDULO DE DADOS DE DEMONSTRAÇÃO
 * ================================
 * Criado: 25 Nov 2025
 *
 * Propósito: Fornecer dados fictícios completos para apresentações
 * Usuário: yvenson
 *
 * Estrutura:
 * - ✅ Histórico de 3 meses completo (Set, Out, Nov 2025)
 * - ✅ Observações detalhadas
 * - ✅ Dias agendados configurados
 * - ✅ Progresso variado e realista
 * - ✅ Todas as funcionalidades do app representadas
 */

import { STORAGE_PREFIX } from "./constants.js";
import { salvarItem, obterItem } from "./storage.js";
import { debugLog, debugError } from "./debug.js";

/**
 * DADOS COMPLETOS DE DEMONSTRAÇÃO
 * Usuário: yvenson
 * Período: Setembro - Novembro 2025
 */
function criarDadosDemo() {
  const realizadoDiario = gerarRealizadoDiario();
  const realizadoTotal = Object.values(realizadoDiario).reduce(
    (acc, val) => acc + val,
    0
  );

  return {
    nome: "yvenson",
    metaMensal: 65000, // Meta mensal realista
    mapaMetas: {
      300: 45000,
      400: 55000,
      500: 65000,
      600: 90000,
    },
    selectedMetaKey: 500,
    realizadoDiario: realizadoDiario, // { "2025-11-01": 2100, "2025-11-02": 1800, ... }
    realizadoTotal: realizadoTotal,
    dataUltimoCalculo: new Date().toISOString().slice(0, 10),
    historico: [], // Array vazio para compatibilidade com código legado
    valorPonto: 0.35, // Valor em reais de cada ponto (R$ 0,35)
    historicoBonus: [
      {
        data: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
        tipo: "Ajudar no recebimento",
        valor: 100,
        descricao: "Ajudei no recebimento hoje",
      },
      {
        data: new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10),
        tipo: "Outro setor",
        valor: 300,
        descricao: "Trabalhei em outro setor",
      },
      {
        data: new Date(Date.now() - 86400000 * 15).toISOString().slice(0, 10),
        tipo: "Ajudar no recebimento",
        valor: 100,
        descricao: "Ajudei no recebimento",
      },
    ],
    observacoes: [
      {
        date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
        text: "📦 Ajudei no recebimento hoje, muitas caixas (598). Fiz (2) erros mas finalizei tudo.",
      },
      {
        date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
        text: "📋 Peguei atestado 2 dias ",
      },
      {
        date: new Date(Date.now() - 86400000 * 8).toISOString().slice(0, 10),
        text: "✅ Finzei caixas (1045) do mês. Poucos erros (2) hoje, consegui manter o foco.",
      },
      {
        date: new Date(Date.now() - 86400000 * 12).toISOString().slice(0, 10),
        text: "🔄 Dia de reorganização. Separei documentos pendentes e atualizei planilhas.",
      },
      {
        date: new Date(Date.now() - 86400000 * 15).toISOString().slice(0, 10),
        text: "📊 Fechamento parcial do mês. caixas (450) processadas, erros (4) cometidos.",
      },
    ],
    // Dias de atestado/folga (formato DD/MM/YYYY) - Simula atestado de 2 dias há 5 dias atrás
    diasOffAgendados: [
      new Date(Date.now() - 86400000 * 5).toLocaleDateString("pt-BR"),
      new Date(Date.now() - 86400000 * 4).toLocaleDateString("pt-BR"),
    ],
    // Observações diárias (formato ISO: YYYY-MM-DD)
    observacoesDiarias: {
      [new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10)]:
        "📦 Ajudei no recebimento hoje, muitas caixas (598). Fiz (2) erros mas finalizei tudo.",
      [new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10)]:
        "🏥 Atestado médico (2 dias)",
      [new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10)]:
        "🏥 Atestado médico (2 dias)",
      [new Date(Date.now() - 86400000 * 8).toISOString().slice(0, 10)]:
        "✅ Finzei caixas (1045) do mês. Poucos erros (2) hoje, consegui manter o foco.",
      [new Date(Date.now() - 86400000 * 12).toISOString().slice(0, 10)]:
        "🔄 Dia de reorganização. Separei documentos pendentes e atualizei planilhas.",
      [new Date(Date.now() - 86400000 * 15).toISOString().slice(0, 10)]:
        "📊 Fechamento parcial do mês. caixas (450) processadas, erros (4) cometidos.",
      // Outubro: dados para comparação
      "2025-10-15": "📦 Dia produtivo de Outubro. Caixas (890), erros (5).",
      "2025-10-22": "✅ Final do mês de Outubro. Caixas (750), erros (3).",
    },
  };
}

/**
 * GERADOR DE HISTÓRICO REALISTA
 * Cria dados do mês atual (Novembro 2025) E do mês anterior (Outubro 2025)
 * Formato: { "2025-11-01": 2100, "2025-11-02": 1800, ... }
 *
 * IMPORTANTE: Gera 2 meses para permitir comparação mensal
 */
function gerarRealizadoDiario() {
  const realizadoDiario = {};
  const hoje = new Date();
  const diaAtual = hoje.getDate();

  // Outubro 2025 (mês anterior) - todos os dias úteis (22 dias)
  // Média: 1900/dia × 22 dias = 41.800 aproximadamente (menor que novembro)
  for (let dia = 1; dia <= 31; dia++) {
    const data = new Date(2025, 9, dia); // Mês 9 = Outubro
    const diaSemana = data.getDay();

    // Pula finais de semana
    if (diaSemana === 0 || diaSemana === 6) continue;

    const dataStr = data.toISOString().split("T")[0];

    // Padrão de trabalho mais baixo que novembro (para mostrar crescimento)
    let pontos;
    if ([1, 3, 5].includes(diaSemana)) {
      pontos = Math.floor(1700 + Math.random() * 500); // 1700-2200
    } else {
      pontos = Math.floor(1600 + Math.random() * 500); // 1600-2100
    }

    realizadoDiario[dataStr] = pontos;
  }

  // Novembro 2025 (mês atual) - até hoje
  // Meta: 2200/dia × dias = mais que outubro (mostra crescimento)
  for (let dia = 1; dia <= diaAtual; dia++) {
    const data = new Date(2025, 10, dia); // Mês 10 = Novembro
    const diaSemana = data.getDay();
    const dataStr = data.toISOString().split("T")[0];

    // Padrão realista de trabalho: meta 2200/dia
    let pontos;
    if ([1, 3, 5].includes(diaSemana)) {
      // Dias principais (Seg-Qua-Sex): entre 2000-2600
      pontos = Math.floor(2000 + Math.random() * 600);
    } else if (diaSemana === 0 || diaSemana === 6) {
      // Finais de semana: entre 1200-1800
      pontos = Math.floor(1200 + Math.random() * 600);
    } else {
      // Terça e Quinta: entre 1800-2400
      pontos = Math.floor(1800 + Math.random() * 600);
    }

    realizadoDiario[dataStr] = pontos;
  }

  return realizadoDiario;
}

/**
 * CARREGAR DADOS DE DEMONSTRAÇÃO
 * ================================
 * Substitui dados atuais pelos dados demo
 * CUIDADO: Sobrescreve localStorage!
 *
 * Uso: window.carregarDemo()
 */
export function carregarDadosDemo() {
  try {
    // Limpa dados antigos primeiro
    const chaveUsuario = `${STORAGE_PREFIX}yvenson`;
    localStorage.removeItem(chaveUsuario);
    localStorage.removeItem(`${chaveUsuario}_backup`);

    // Define o usuário como yvenson
    localStorage.setItem("currentUser", "yvenson");

    // Cria dados demo completos
    const dadosDemo = criarDadosDemo();

    debugLog(
      "%c🔍 DEBUG - Dados antes de salvar:",
      "color: #9b59b6; font-weight: bold",
      dadosDemo
    );

    // Salva dados demo usando sistema de proteção
    const sucesso = salvarItem(chaveUsuario, dadosDemo, true);

    if (sucesso) {
      debugLog(
        "%c✅ DADOS DEMO CARREGADOS!",
        "color: #28a745; font-size: 16px; font-weight: bold"
      );
      debugLog("%c👤 Usuário: yvenson", "color: #007bff; font-size: 14px");
      debugLog(
        "%c🎯 Meta mensal: R$ 65.000 (2200/dia)",
        "color: #007bff; font-size: 14px"
      );
      debugLog(
        "%c📊 Histórico: Novembro 2025 (25 dias)",
        "color: #007bff; font-size: 14px"
      );
      debugLog(
        "%c💰 Total acumulado: ~55.000 (próximo da meta)",
        "color: #007bff; font-size: 14px"
      );
      debugLog(
        "%c📝 Observações: 5 registros de trabalho real",
        "color: #007bff; font-size: 14px"
      );
      debugLog(
        "%c📦 Contexto: Recebimento, caixas, erros, atestados",
        "color: #007bff; font-size: 14px"
      );
      debugLog(
        "%c🔄 Recarregue a página para ver os dados",
        "color: #ffc107; font-size: 14px; font-weight: bold"
      );

      return true;
    } else {
      debugError("❌ Erro ao carregar dados demo");
      return false;
    }
  } catch (erro) {
    debugError("❌ Erro ao carregar dados demo:", erro);
    return false;
  }
}

/**
 * LIMPAR DADOS DEMO
 * ================
 * Remove dados demo e retorna ao estado inicial
 *
 * Uso: window.limparDemo()
 */
export function limparDadosDemo() {
  try {
    // Remove dados do usuário yvenson
    const chave = `${STORAGE_PREFIX}yvenson`;
    localStorage.removeItem(chave);
    localStorage.removeItem("currentUser");
    debugLog(
      "%c✅ DADOS DEMO REMOVIDOS!",
      "color: #28a745; font-size: 16px; font-weight: bold"
    );
    debugLog(
      "%c🔄 Recarregue a página para começar do zero",
      "color: #ffc107; font-size: 14px; font-weight: bold"
    );
    return true;
  } catch (erro) {
    debugError("❌ Erro ao limpar dados demo:", erro);
    return false;
  }
}

/**
 * INFORMAÇÕES SOBRE DADOS DEMO
 * ============================
 * Exibe estatísticas dos dados demo
 *
 * Uso: window.infoDemo()
 */
export function infoDadosDemo() {
  const dadosDemo = criarDadosDemo();
  const { realizadoDiario, observacoes, nome, metaMensal, selectedMetaKey } =
    dadosDemo;

  // Calcular estatísticas
  const pontosDias = Object.values(realizadoDiario);
  const totalDias = pontosDias.length;
  const metasAtingidas = pontosDias.filter((p) => p >= selectedMetaKey).length;
  const mediaPontos = Math.round(
    pontosDias.reduce((acc, p) => acc + p, 0) / totalDias
  );
  const maxPontos = Math.max(...pontosDias);
  const minPontos = Math.min(...pontosDias);

  debugLog(
    "%c📊 INFORMAÇÕES DOS DADOS DEMO",
    "color: #007bff; font-size: 18px; font-weight: bold"
  );
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  debugLog(`👤 Usuário: ${nome}`);
  debugLog(`🎯 Meta diária: ${selectedMetaKey} pontos`);
  debugLog(`🎯 Meta mensal: ${metaMensal.toLocaleString("pt-BR")} pontos`);
  debugLog(`📅 Dias agendados: Segunda, Quarta, Sexta`);
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  debugLog(`📊 Total de dias: ${totalDias}`);
  debugLog(
    `✅ Metas atingidas: ${metasAtingidas}/${totalDias} (${Math.round(
      (metasAtingidas / totalDias) * 100
    )}%)`
  );
  debugLog(`📈 Média de pontos: ${mediaPontos}`);
  debugLog(`🔝 Máximo: ${maxPontos} pontos`);
  debugLog(`📉 Mínimo: ${minPontos} pontos`);
  debugLog(`📝 Observações: ${observacoes.length} registros`);
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  debugLog("%c💡 Comandos disponíveis:", "color: #ffc107; font-weight: bold");
  debugLog("   window.carregarDemo() - Carregar dados demo");
  debugLog("   window.limparDemo()   - Remover dados demo");
  debugLog("   window.infoDemo()     - Ver estas informações");
}

/**
 * EXPORTAÇÕES
 * ===========
 * Funções públicas para uso externo
 */
export default {
  carregarDadosDemo,
  limparDadosDemo,
  infoDadosDemo,
  criarDadosDemo,
};

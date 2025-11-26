// ============================================================================
// DATA.JS - Gerenciamento de dados do usuário (Refatorado)
// ============================================================================
// 📋 Propósito: Gerenciar dados do usuário, metas e estado da aplicação
// 🎯 Benefícios:
//    - Código limpo sem try-catch (delegado ao storage.js)
//    - Responsabilidade única (apenas lógica de negócio)
//    - Fácil manutenção e teste
//    - Documentação completa com JSDoc
// ============================================================================

import {
  STORAGE_PREFIX,
  STORAGE_CURRENT_USER,
  MAPA_METAS,
  META_PADRAO,
} from "./constants.js";

import {
  obterItem,
  salvarItem,
  removerItem,
  obterString,
  salvarString,
} from "./storage.js";

// ============================================================================
// ESTADO DA APLICAÇÃO
// ============================================================================

/**
 * Cache em memória dos dados do usuário atual
 * @type {Object|null}
 * @private
 */
let dadosUsuario = null;

// ============================================================================
// RE-EXPORTAR CONSTANTES (para compatibilidade)
// ============================================================================

/**
 * Mapeamento de metas diárias para valores mensais
 * @constant
 */
export { MAPA_METAS };

// ============================================================================
// GERENCIAMENTO DE USUÁRIO ATUAL
// ============================================================================

/**
 * Define o usuário atual da sessão
 * @param {string} nome - Nome do usuário
 */
export function setCurrentUser(nome) {
  salvarString(STORAGE_CURRENT_USER, nome);
}

/**
 * Obtém o nome do usuário atual
 * @returns {string|null} Nome do usuário ou null
 */
export function getCurrentUser() {
  return obterString(STORAGE_CURRENT_USER);
}

/**
 * Limpa o usuário atual (logout)
 */
export function clearCurrentUser() {
  removerItem(STORAGE_CURRENT_USER);
  dadosUsuario = null;
}

/**
 * Retorna a chave de armazenamento do usuário atual
 * @returns {string|null} Chave formatada (ex: "dados_João") ou null
 */
export function getChaveDadosUsuario() {
  const nome = getCurrentUser();
  if (!nome) return null;
  return `${STORAGE_PREFIX}${nome}`;
}

// ============================================================================
// GERENCIAMENTO DE DADOS DO USUÁRIO
// ============================================================================

/**
 * Obtém os dados do usuário atual (usa cache em memória)
 * @returns {Object|null} Dados do usuário ou null
 */
export function getDadosUsuario() {
  if (!dadosUsuario) {
    dadosUsuario = carregarDados();
  }
  return dadosUsuario;
}

/**
 * Atualiza os dados do usuário e salva automaticamente
 * @param {Object} novosDados - Novos dados a serem salvos
 */
export function atualizarDadosUsuario(novosDados) {
  dadosUsuario = novosDados;
  salvarDados(dadosUsuario);
}

// ============================================================================
// CARREGAMENTO DE DADOS
// ============================================================================

/**
 * Carrega os dados do usuário do localStorage
 * 🛡️ Proteções delegadas ao storage.js (try-catch, backup, etc)
 * @returns {Object|null} Dados do usuário ou null
 */
export function carregarDados() {
  const chave = getChaveDadosUsuario();
  if (!chave) return null;

  // 🛡️ obterItem() já trata JSON corrompido e backup
  let dados = obterItem(chave);
  if (!dados) return null;

  // Verificar reset mensal automático
  dados = verificarResetMensal(dados);

  // Atualizar cache
  dadosUsuario = dados;
  return dados;
}

/**
 * Verifica se precisa resetar dados para novo mês
 * @param {Object} dados - Dados atuais
 * @returns {Object} Dados (zerados se novo mês)
 * @private
 */
function verificarResetMensal(dados) {
  const hoje = new Date();
  const dataUltimoCalculo = new Date(dados.dataUltimoCalculo);

  // Se mudou de mês, zerar dados diários
  if (hoje.getMonth() !== dataUltimoCalculo.getMonth()) {
    dados.realizadoDiario = {};
    dados.realizadoTotal = 0;
    dados.dataUltimoCalculo = hoje.toISOString().slice(0, 10);
    salvarDados(dados);
  }

  return dados;
}

// ============================================================================
// SALVAMENTO DE DADOS
// ============================================================================

/**
 * Salva os dados do usuário no localStorage
 * 🛡️ Proteções delegadas ao storage.js (try-catch, QuotaExceeded, backup, etc)
 * @param {Object} dados - Dados a serem salvos
 */
export function salvarDados(dados) {
  const chave = getChaveDadosUsuario();
  if (!chave) return;

  // 🛡️ salvarItem() já trata QuotaExceededError, sanitização e backup
  const sucesso = salvarItem(chave, dados, true);

  // Atualizar cache apenas se salvou com sucesso
  if (sucesso) {
    dadosUsuario = dados;
  }
}

// ============================================================================
// CRIAÇÃO DE DADOS INICIAIS
// ============================================================================

/**
 * Cria estrutura inicial de dados para novo usuário
 * @param {string} funcionario - Nome do funcionário
 * @param {string} metaDiariaBase - Meta selecionada (300/400/500/600)
 * @returns {Object} Dados iniciais estruturados
 */
export function criarDadosIniciais(funcionario, metaDiariaBase = META_PADRAO) {
  const metaMensal = MAPA_METAS[metaDiariaBase] || MAPA_METAS[META_PADRAO];

  const dados = {
    nome: funcionario,
    metaMensal: metaMensal,
    mapaMetas: { ...MAPA_METAS }, // Cópia personalizável por usuário
    selectedMetaKey: metaDiariaBase,
    realizadoDiario: {},
    realizadoTotal: 0,
    dataUltimoCalculo: new Date().toISOString().slice(0, 10),
    observacoes: [], // Array de { date: 'YYYY-MM-DD', text: '...' }
    diasOffAgendados: [], // Array de datas em formato DD/MM/YYYY
  };

  dadosUsuario = dados;
  return dados;
}

// ============================================================================
// GERENCIAMENTO DE OBSERVAÇÕES
// ============================================================================

/**
 * Obtém todas as observações do usuário
 * @returns {Array<{date: string, text: string}>} Array de observações
 */
export function getObservacoesUsuario() {
  const dados = getDadosUsuario();
  if (!dados) return [];
  return dados.observacoes || [];
}

/**
 * Adiciona nova observação
 * @param {string} dateISO - Data no formato YYYY-MM-DD
 * @param {string} text - Texto da observação
 * @returns {Array|null} Array atualizado de observações ou null
 */
export function adicionarObservacao(dateISO, text) {
  const dados = getDadosUsuario();
  if (!dados) return null;

  if (!dados.observacoes) {
    dados.observacoes = [];
  }

  dados.observacoes.push({ date: dateISO, text: text });
  salvarDados(dados);

  return dados.observacoes;
}

/**
 * Remove todas as observações
 */
export function limparObservacoes() {
  const dados = getDadosUsuario();
  if (!dados) return;

  dados.observacoes = [];
  salvarDados(dados);
}

// ============================================================================
// GERENCIAMENTO DE DIAS OFF AGENDADOS
// ============================================================================

/**
 * Verifica se uma data está agendada como dia off
 * @param {string} dataBR - Data no formato DD/MM/YYYY
 * @returns {boolean} true se agendado, false caso contrário
 */
export function isDiaAgendado(dataBR) {
  const dados = getDadosUsuario();
  if (!dados || !dados.diasOffAgendados) return false;
  return dados.diasOffAgendados.includes(dataBR);
}

/**
 * Obtém lista de todos os dias off agendados
 * @returns {string[]} Array de datas no formato DD/MM/YYYY
 */
export function getDiasAgendados() {
  const dados = getDadosUsuario();
  if (!dados || !dados.diasOffAgendados) return [];
  return dados.diasOffAgendados;
}

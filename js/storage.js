// ============================================================================
// STORAGE.JS - Módulo de proteção para localStorage
// ============================================================================
// 🛡️ Propósito: Centralizar TODAS as operações de localStorage com proteções
// 🎯 Benefícios:
//    - Try-catch automático para todos os erros
//    - Sistema de backup transparente
//    - Sanitização de dados
//    - Recuperação automática de erros
//    - Código de negócio limpo (sem try-catch espalhado)
// ============================================================================

import {
  STORAGE_BACKUP_SUFFIX,
  MENSAGENS_ERRO,
  MENSAGENS_SUCESSO,
  MENSAGENS_AVISO,
  NOME_MAX_LENGTH_SANITIZE,
  OBSERVACAO_MAX_LENGTH,
} from "./constants.js";
import { debugLog, debugWarn } from "./debug.js";

// ============================================================================
// OPERAÇÕES BÁSICAS PROTEGIDAS
// ============================================================================

/**
 * 🛡️ Obtém item do localStorage com proteção contra JSON corrompido
 * @param {string} chave - Chave do localStorage
 * @returns {any|null} Dados parseados ou null se erro
 */
export function obterItem(chave) {
  if (!chave) return null;

  const dadosJSON = localStorage.getItem(chave);
  if (!dadosJSON) return null;

  // 🛡️ PROTEÇÃO: Try-catch para JSON.parse
  try {
    return JSON.parse(dadosJSON);
  } catch (error) {
    console.error("❌ Erro ao parsear JSON:", error);
    return tentarRecuperarBackup(chave);
  }
}

/**
 * 🛡️ Salva item no localStorage com proteção contra QuotaExceeded
 * @param {string} chave - Chave do localStorage
 * @param {any} dados - Dados a serem salvos
 * @param {boolean} criarBackup - Se deve criar backup automático (padrão: true)
 * @returns {boolean} true se salvou com sucesso, false caso contrário
 */
export function salvarItem(chave, dados, criarBackup = true) {
  if (!chave) return false;

  // 🛡️ PROTEÇÃO: Sanitizar dados antes de salvar
  const dadosSanitizados = sanitizarDados(dados);
  const dadosJSON = JSON.stringify(dadosSanitizados);

  // 🛡️ PROTEÇÃO: Try-catch para localStorage.setItem
  try {
    // Salvar dados principais
    localStorage.setItem(chave, dadosJSON);

    // Criar backup automático (se solicitado)
    if (criarBackup) {
      criarBackupSilencioso(chave, dadosJSON);
    }

    return true;
  } catch (error) {
    return tratarErroSalvamento(error, chave, dadosJSON);
  }
}

/**
 * 🛡️ Remove item do localStorage e seu backup
 * @param {string} chave - Chave do localStorage
 */
export function removerItem(chave) {
  if (!chave) return;

  try {
    localStorage.removeItem(chave);
    localStorage.removeItem(chave + STORAGE_BACKUP_SUFFIX);
  } catch (error) {
    console.error("❌ Erro ao remover item:", error);
  }
}

/**
 * Obtém item simples (string) sem parse
 * @param {string} chave - Chave do localStorage
 * @returns {string|null}
 */
export function obterString(chave) {
  try {
    return localStorage.getItem(chave);
  } catch (error) {
    console.error("❌ Erro ao obter string:", error);
    return null;
  }
}

/**
 * Salva string simples sem stringify
 * @param {string} chave - Chave do localStorage
 * @param {string} valor - Valor a ser salvo
 * @returns {boolean}
 */
export function salvarString(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar string:", error);
    return false;
  }
}

// ============================================================================
// SISTEMA DE BACKUP
// ============================================================================

/**
 * Cria backup silencioso (não lança erro se falhar)
 * @param {string} chave - Chave original
 * @param {string} dadosJSON - Dados já serializados
 */
function criarBackupSilencioso(chave, dadosJSON) {
  try {
    localStorage.setItem(chave + STORAGE_BACKUP_SUFFIX, dadosJSON);
  } catch (backupError) {
    // Falha no backup não é crítica
    debugWarn(MENSAGENS_AVISO.BACKUP_FALHOU, backupError);
  }
}

/**
 * Tenta recuperar dados do backup
 * @param {string} chave - Chave original
 * @returns {any|null} Dados do backup ou null
 */
function tentarRecuperarBackup(chave) {
  const chaveBackup = chave + STORAGE_BACKUP_SUFFIX;
  const backupJSON = localStorage.getItem(chaveBackup);

  if (backupJSON) {
    try {
      const dados = JSON.parse(backupJSON);
      debugLog(MENSAGENS_SUCESSO.DADOS_RECUPERADOS);

      // Restaurar backup como dados principais
      localStorage.setItem(chave, backupJSON);
      return dados;
    } catch (backupError) {
      console.error("❌ Backup também corrompido:", backupError);
      oferecerReset(chave);
      return null;
    }
  } else {
    // Sem backup disponível
    oferecerResetSemBackup(chave);
    return null;
  }
}

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================

/**
 * Trata erro de salvamento (principalmente QuotaExceededError)
 * @param {Error} error - Erro capturado
 * @param {string} chave - Chave que tentou salvar
 * @param {string} dadosJSON - Dados que tentou salvar
 * @returns {boolean} true se conseguiu recuperar, false caso contrário
 */
function tratarErroSalvamento(error, chave, dadosJSON) {
  // 🛡️ PROTEÇÃO: Detectar localStorage cheio
  if (error.name === "QuotaExceededError") {
    console.error("❌ localStorage CHEIO!");
    return tentarLiberarEspaco(chave, dadosJSON);
  } else {
    // Outro tipo de erro
    console.error("❌ Erro ao salvar dados:", error);
    alert(MENSAGENS_ERRO.ERRO_SALVAR);
    return false;
  }
}

/**
 * Tenta liberar espaço removendo backup e salvando novamente
 * @param {string} chave - Chave dos dados
 * @param {string} dadosJSON - Dados a serem salvos
 * @returns {boolean}
 */
function tentarLiberarEspaco(chave, dadosJSON) {
  const chaveBackup = chave + STORAGE_BACKUP_SUFFIX;

  try {
    // Remover backup para liberar espaço
    localStorage.removeItem(chaveBackup);

    // Tentar salvar novamente
    localStorage.setItem(chave, dadosJSON);

    alert(MENSAGENS_AVISO.STORAGE_QUASE_CHEIO);
    return true;
  } catch (retryError) {
    // Ainda não tem espaço suficiente
    alert(MENSAGENS_ERRO.STORAGE_CHEIO);
    console.error("❌ Falha crítica ao salvar:", retryError);
    return false;
  }
}

/**
 * Oferece reset ao usuário (com backup corrompido)
 * @param {string} chave - Chave dos dados corrompidos
 */
function oferecerReset(chave) {
  if (confirm(MENSAGENS_ERRO.DADOS_CORROMPIDOS)) {
    removerItem(chave);
    location.reload();
  }
}

/**
 * Oferece reset ao usuário (sem backup disponível)
 * @param {string} chave - Chave dos dados corrompidos
 */
function oferecerResetSemBackup(chave) {
  if (confirm(MENSAGENS_ERRO.DADOS_CORROMPIDOS_SEM_BACKUP)) {
    removerItem(chave);
    location.reload();
  }
}

// ============================================================================
// SANITIZAÇÃO DE DADOS
// ============================================================================

/**
 * 🛡️ Sanitiza dados antes de salvar no localStorage
 * Remove/limita caracteres que podem corromper JSON
 * @param {any} dados - Dados a serem sanitizados
 * @returns {any} Dados sanitizados
 */
export function sanitizarDados(dados) {
  if (!dados || typeof dados !== "object") return dados;

  // Criar cópia profunda para não modificar original
  const dadosCopia = JSON.parse(JSON.stringify(dados));

  // Sanitizar nome do usuário
  if (dadosCopia.nome) {
    dadosCopia.nome = sanitizarTexto(dadosCopia.nome, NOME_MAX_LENGTH_SANITIZE);
  }

  // Sanitizar observações
  if (Array.isArray(dadosCopia.observacoes)) {
    dadosCopia.observacoes = dadosCopia.observacoes.map((obs) => ({
      date: obs.date,
      text: sanitizarTexto(obs.text, OBSERVACAO_MAX_LENGTH),
    }));
  }

  return dadosCopia;
}

/**
 * Sanitiza texto individual
 * @param {string} texto - Texto a ser sanitizado
 * @param {number} maxLength - Tamanho máximo permitido
 * @returns {string} Texto sanitizado
 */
function sanitizarTexto(texto, maxLength = 500) {
  if (!texto || typeof texto !== "string") return "";

  return texto.trim().substring(0, maxLength);
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Verifica se localStorage está disponível
 * @returns {boolean}
 */
export function isStorageDisponivel() {
  try {
    const teste = "__storage_test__";
    localStorage.setItem(teste, teste);
    localStorage.removeItem(teste);
    return true;
  } catch (error) {
    debugWarn("⚠️ localStorage não disponível:", error);
    return false;
  }
}

/**
 * Obtém tamanho aproximado usado no localStorage (em bytes)
 * @returns {number}
 */
export function obterTamanhoStorage() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

/**
 * Obtém tamanho aproximado usado no localStorage (formatado)
 * @returns {string} Ex: "2.5 KB"
 */
export function obterTamanhoStorageFormatado() {
  const bytes = obterTamanhoStorage();
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

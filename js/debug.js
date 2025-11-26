// ============================================================================
// DEBUG.JS - Configuração centralizada de logs de debug
// ============================================================================

/**
 * Flag de debug - defina como false em produção
 * Para ativar debug no console do navegador: window.DEBUG = true
 */
export const DEBUG = false;

/**
 * Função de log condicional - só exibe se DEBUG estiver ativo
 * @param  {...any} args - Argumentos para console.log
 */
export function debugLog(...args) {
  if (DEBUG || window.DEBUG) {
    console.log(...args);
  }
}

/**
 * Log de warning condicional
 * @param  {...any} args - Argumentos para console.warn
 */
export function debugWarn(...args) {
  if (DEBUG || window.DEBUG) {
    console.warn(...args);
  }
}

/**
 * Log de erro condicional
 * @param  {...any} args - Argumentos para console.error
 */
export function debugError(...args) {
  if (DEBUG || window.DEBUG) {
    console.error(...args);
  }
}

/**
 * Log de informação condicional
 * @param  {...any} args - Argumentos para console.info
 */
export function debugInfo(...args) {
  if (DEBUG || window.DEBUG) {
    console.info(...args);
  }
}

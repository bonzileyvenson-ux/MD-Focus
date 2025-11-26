// ============================================================================
// CONSTANTS.JS - Constantes centralizadas do MD-Focus
// ============================================================================
// 📋 Propósito: Centralizar todos os valores mágicos, chaves, limites e configs
// 🎯 Benefício: Fácil manutenção, sem números/strings espalhados pelo código
// ============================================================================

// ============================================================================
// ARMAZENAMENTO (localStorage)
// ============================================================================

/**
 * Prefixo para chaves do localStorage
 * @constant {string}
 */
export const STORAGE_PREFIX = "dados_";

/**
 * Sufixo para chaves de backup
 * @constant {string}
 */
export const STORAGE_BACKUP_SUFFIX = "_backup";

/**
 * Chave para armazenar usuário atual
 * @constant {string}
 */
export const STORAGE_CURRENT_USER = "currentUser";

/**
 * Chave para armazenar tema
 * @constant {string}
 */
export const STORAGE_THEME = "theme";

// ============================================================================
// METAS E VALORES
// ============================================================================

/**
 * Mapeamento de metas diárias para valores mensais
 * @constant {Object.<string, number>}
 */
export const MAPA_METAS = {
  600: 90000,
  500: 65000,
  400: 55000,
  300: 45000,
};

/**
 * Meta padrão para novos usuários
 * @constant {string}
 */
export const META_PADRAO = "300";

// ============================================================================
// LIMITES DE VALIDAÇÃO
// ============================================================================

/**
 * Tamanho mínimo para nome de usuário
 * @constant {number}
 */
export const NOME_MIN_LENGTH = 3;

/**
 * Tamanho máximo para nome de usuário
 * @constant {number}
 */
export const NOME_MAX_LENGTH = 10;

/**
 * Tamanho máximo para nome ao sanitizar
 * @constant {number}
 */
export const NOME_MAX_LENGTH_SANITIZE = 100;

/**
 * Tamanho máximo para observações
 * @constant {number}
 */
export const OBSERVACAO_MAX_LENGTH = 500;

/**
 * Valor mínimo de pontos permitido
 * @constant {number}
 */
export const PONTOS_MIN = 0;

/**
 * Valor máximo de pontos permitido (100k)
 * @constant {number}
 */
export const PONTOS_MAX = 100000;

// ============================================================================
// BREAKPOINTS (Mobile/Desktop)
// ============================================================================

/**
 * Largura máxima para considerar mobile (em pixels)
 * @constant {number}
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Query string para detecção mobile
 * @constant {string}
 */
export const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

// ============================================================================
// TEMPO DE NOTIFICAÇÕES
// ============================================================================

/**
 * Tempo padrão de exibição de notificações (segundos)
 * @constant {number}
 */
export const NOTIFICACAO_TEMPO_PADRAO = 3;

/**
 * Tempo curto de exibição (segundos)
 * @constant {number}
 */
export const NOTIFICACAO_TEMPO_CURTO = 2;

/**
 * Tempo longo de exibição (segundos)
 * @constant {number}
 */
export const NOTIFICACAO_TEMPO_LONGO = 5;

// ============================================================================
// TIPOS DE COMANDOS (History)
// ============================================================================

/**
 * Tipos de comando reconhecidos pelo sistema
 * @constant {Object}
 */
export const TIPOS_COMANDO = {
  BONUS: "bonus",
  ATESTADO: "atestado",
  FOLGA: "folga",
  AGENDAMENTO: "agendamento",
  CANCELAMENTO: "cancelamento",
};

// ============================================================================
// FORMATO DE DATAS
// ============================================================================

/**
 * Formato de data ISO (YYYY-MM-DD)
 * @constant {RegExp}
 */
export const DATA_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Formato de data brasileira (DD/MM/YYYY)
 * @constant {RegExp}
 */
export const DATA_BR_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

// ============================================================================
// MENSAGENS DE ERRO
// ============================================================================

/**
 * Mensagens de erro padrão do sistema
 * @constant {Object}
 */
export const MENSAGENS_ERRO = {
  NOME_INVALIDO: "Por favor, digite um nome válido (3 a 10 letras).",
  PONTOS_INVALIDOS: "Digite um valor válido entre 0 e 100.000.",
  META_INVALIDA: "Por favor, selecione uma meta válida.",
  STORAGE_CHEIO:
    "❌ ERRO CRÍTICO: Espaço de armazenamento cheio!\n\nSoluções:\n1. Exporte seu relatório em PDF\n2. Limpe o histórico antigo\n3. Limpe dados de outros sites",
  DADOS_CORROMPIDOS:
    "Seus dados estão corrompidos. Deseja resetar o aplicativo?",
  DADOS_CORROMPIDOS_SEM_BACKUP:
    "Dados corrompidos e sem backup. Deseja resetar?",
  ERRO_SALVAR:
    "❌ Erro ao salvar dados. Verifique o console para mais detalhes.",
};

// ============================================================================
// MENSAGENS DE SUCESSO
// ============================================================================

/**
 * Mensagens de sucesso padrão do sistema
 * @constant {Object}
 */
export const MENSAGENS_SUCESSO = {
  PONTOS_REGISTRADOS: "✅ Pontos registrados com sucesso!",
  DADOS_RECUPERADOS: "✅ Dados recuperados do backup!",
  BACKUP_CRIADO: "✅ Backup criado com sucesso!",
  SINCRONIZADO: "🔄 Dados sincronizados com outra aba",
};

// ============================================================================
// MENSAGENS DE AVISO
// ============================================================================

/**
 * Mensagens de aviso padrão do sistema
 * @constant {Object}
 */
export const MENSAGENS_AVISO = {
  STORAGE_QUASE_CHEIO:
    "⚠️ Espaço de armazenamento quase cheio. Backup removido para salvar seus dados.",
  BACKUP_FALHOU: "⚠️ Não foi possível criar backup:",
  SESSAO_ENCERRADA: "⚠️ Sessão encerrada. Recarregando...",
};

// ============================================================================
// TEMAS
// ============================================================================

/**
 * Temas disponíveis no sistema
 * @constant {Object}
 */
export const TEMAS = {
  CLARO: "light",
  ESCURO: "dark",
};

// ============================================================================
// ÍCONES (Bootstrap Icons)
// ============================================================================

/**
 * Classes de ícones do Bootstrap
 * @constant {Object}
 */
export const ICONES = {
  SOL: "bi bi-sun-fill",
  LUA: "bi bi-moon-stars-fill",
  EDITAR: "bi bi-pencil",
  HISTORICO: "bi bi-clock-history",
  CALCULADORA: "bi bi-calculator",
};

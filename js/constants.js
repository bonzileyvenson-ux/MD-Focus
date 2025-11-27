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

/**
 * Tempos específicos para diferentes tipos de notificação (em segundos)
 * @constant {Object}
 */
export const TEMPO_ESPECIFICO = {
  // Ações rápidas
  REGISTRO_PONTOS: 3,
  BONUS_APLICADO: 3,
  COMANDO_EXECUTADO: 3,

  // Confirmações importantes
  HISTORICO_ALTERADO: 5,
  AGENDAMENTO_SALVO: 5,
  AGENDAMENTO_REMOVIDO: 5,
  META_ALTERADA: 6,

  // Avisos que precisam ser lidos
  ERRO_VALIDACAO: 4,
  AVISO_GERAL: 4,

  // Ações críticas
  DADOS_LIMPOS: 8,
  BACKUP_RESTAURADO: 8,
  SIMULACAO: 8,

  // Ações instantâneas
  LOGOUT: 2,
  CANCELAR_ACAO: 2,

  // Mensagens longas
  INFO_DETALHADA: 20,
};

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
  TROPHY: "bi bi-trophy-fill",
  GRAPH_UP: "bi bi-graph-up-arrow",
  CHECK_CIRCLE: "bi bi-check-circle-fill",
  X_CIRCLE: "bi bi-x-circle-fill",
  EXCLAMATION: "bi bi-exclamation-triangle-fill",
  INFO: "bi bi-info-circle-fill",
  ARROW_UP: "bi bi-arrow-up",
  ARROW_DOWN: "bi bi-arrow-down",
};

// ============================================================================
// EMOJIS E ÍCONES TEXTUAIS
// ============================================================================

/**
 * Emojis usados no sistema
 * @constant {Object}
 */
export const EMOJIS = {
  // Status
  SUCESSO: "✅",
  ERRO: "❌",
  AVISO: "⚠️",
  INFO: "ℹ️",

  // Ações
  REGISTRAR: "📝",
  CALCULADORA: "🧮",
  HISTORICO: "📋",
  RELATORIO: "📊",

  // Dados
  CAIXAS: "📦",
  ERROS: "❌",
  ATESTADO: "🏥",
  FOLGA: "🌴",
  FERIADO: "🎉",
  ANIVERSARIO: "🎂",

  // Progresso
  TROPHY: "🏆",
  MEDAL_GOLD: "🥇",
  MEDAL_SILVER: "🥈",
  MEDAL_BRONZE: "🥉",
  FIRE: "🔥",
  CHART: "📈",

  // Outros
  DINHEIRO: "💰",
  CALENDARIO: "📅",
  RELOGIO: "⏰",
  ALERTA: "🚨",
};

// ============================================================================
// VALORES DE BÔNUS
// ============================================================================

/**
 * Valores de bônus predefinidos
 * @constant {Object}
 */
export const VALORES_BONUS = {
  AJUDAR_RECEBIMENTO: 100,
  OUTRO_SETOR_PADRAO: 300,
};

/**
 * Tipos de bônus reconhecidos
 * @constant {Object}
 */
export const TIPOS_BONUS = {
  AJUDAR_RECEBIMENTO: "Ajudar no recebimento",
  OUTRO_SETOR: "Outro setor",
  OUTROS: "Outros",
};

// ============================================================================
// TAXAS E PERCENTUAIS
// ============================================================================

/**
 * Taxa máxima de erros para Top Funcionário (1.8%)
 * @constant {number}
 */
export const TAXA_ERRO_MAX_TOP = 1.8;

/**
 * Percentual de progresso considerado "perto da meta" (90%)
 * @constant {number}
 */
export const PERCENTUAL_PERTO_META = 90;

/**
 * Percentual de progresso considerado "crítico" (50%)
 * @constant {number}
 */
export const PERCENTUAL_CRITICO = 50;

// ============================================================================
// LIMITES DE HISTÓRICO
// ============================================================================

/**
 * Número de dias no histórico rápido (últimos 5)
 * @constant {number}
 */
export const DIAS_HISTORICO_RAPIDO = 5;

/**
 * Número máximo de observações exibidas
 * @constant {number}
 */
export const MAX_OBSERVACOES_EXIBIDAS = 50;

/**
 * Número de dias úteis padrão no mês (aproximado)
 * @constant {number}
 */
export const DIAS_UTEIS_MES_PADRAO = 22;

// ============================================================================
// DIAS DA SEMANA
// ============================================================================

/**
 * Nomes dos dias da semana
 * @constant {string[]}
 */
export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/**
 * Nomes abreviados dos dias da semana
 * @constant {string[]}
 */
export const DIAS_SEMANA_ABREV = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

/**
 * Índices dos finais de semana
 * @constant {number[]}
 */
export const INDICES_FIM_SEMANA = [0, 6]; // Domingo e Sábado

// ============================================================================
// MESES DO ANO
// ============================================================================

/**
 * Nomes dos meses
 * @constant {string[]}
 */
export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * Nomes abreviados dos meses
 * @constant {string[]}
 */
export const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// ============================================================================
// CLASSES CSS
// ============================================================================

/**
 * Classes CSS usadas no sistema
 * @constant {Object}
 */
export const CLASSES_CSS = {
  HIDDEN: "hidden",
  VALOR_ATUALIZADO: "valor-atualizado",
  EDITA_PONTOS_HIDDEN: "edita-pontos-hidden",
  ROW_ATESTADO: "row-atestado",
  ROW_AGENDAMENTO: "row-agendamento",
  ROW_NAO_INFORMADO: "row-nao-informado",
  ROW_FIM_SEMANA: "row-fim-semana",
};

// ============================================================================
// IDs DE ELEMENTOS
// ============================================================================

/**
 * IDs de elementos HTML importantes
 * @constant {Object}
 */
export const IDS_ELEMENTOS = {
  // Telas
  LOGIN_SCREEN: "login-screen",
  MAIN_CONTENT: "main-content",

  // Inputs principais
  INPUT_PONTOS: "input-pontos",
  LOGIN_USERNAME: "login-username",
  TEXTAREA_OBSERVACOES: "texterarea-obervacoes",

  // Botões
  BTN_REGISTRAR: "btn-registrar",
  BTN_SOLICITAR: "btn-solicitar",
  BTN_LOGOUT: "btn-logout",
  BTN_ABRIR_HISTORICO: "btn-abrir-historico",
  BTN_FECHAR_HISTORICO: "btn-fechar-historico",

  // Display
  PONTO_TOTAL: "ponto-total",
  META_MENSAL: "meta-mensal",
  DIARIA_NECESSARIA: "diaria-necessaria",
  USUARIO_NOME: "usuario-nome",
  MEDIA_SEMANAL: "media-semanal",

  // Relatório
  REPORT_USUARIO: "report-usuario",
  REPORT_DATA: "report-data",
  REPORT_META_MENSAL: "report-meta-mensal",
  REPORT_TOTAL_REALIZADO: "report-total-realizado",

  // Modal
  HISTORICO_MODAL: "historico-modal",
  HISTORICO_LISTA: "historico-lista",
};

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * Padrões regex para validação e parsing
 * @constant {Object}
 */
export const REGEX_PATTERNS = {
  // Comandos de bônus
  // Aceita: ajudar no recebimento, ajudar recebimento, ajuda recebimento, recebimento
  AJUDAR_RECEBIMENTO: /(?:ajud[ao]r?(?:\s*no)?\s*recebimento|recebimento)/gi,
  // Aceita: outro setor, outro sector, outra atividade, outras atividades
  OUTRO_SETOR: /(?:outr[oa]s?\s*(?:sector|setor|atividades?))\s*#?(\d+)/gi,

  // Comandos de agendamento
  FERIADO: /(?:feriado|aniversário)\s*(\d{2}\/\d{2}\/\d{4})/gi,
  REMOVER_AGENDAMENTO:
    /(?:remover|cancelar|excluir)\s*(?:feriado|aniversário|agendamento|atestado)?\s*(\d{2}\/\d{2}\/\d{4})/gi,

  // Atestado
  ATESTADO:
    /(?:atestado|afastamento)(?:\s+(?:médico|de\s+saúde|saúde))?\s*(?:(\d+)\s*(?:dias?|d))?\s*(?:(?:de|em)\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?))?(?:\s*(?:a|até|ao)\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?))?/gi,

  // Caixas e erros
  CAIXAS: /(?:caixas|caixa fechada|atividades)\s*\((\d{1,4})\)/i,
  ERROS: /erros\s*\((\d+)\)/i,

  // Valor do ponto
  VALOR_PONTO:
    /(?:valor\s*(?:do\s*)?ponto|ponto\s*vale)\s*[:\s]*R?\$?\s*(\d+[.,]\d{2})/gi,

  // Meta alterada
  META_ALTERADA:
    /meta\s*alterada\s*\(\s*(\d{3,6})\s*,\s*(\d{3,6})\s*,\s*(\d{3,6})\s*,\s*(\d{3,6})\s*\)/i,

  // Relatório
  RELATORIO: /relatório|relatorio/i,

  // Limpar dados
  LIMPAR_DADOS: /limpar\s*dados/i,
};

// ============================================================================
// CONFIGURAÇÕES DE ANIMAÇÃO
// ============================================================================

/**
 * Durações de animação (em milissegundos)
 * @constant {Object}
 */
export const DURACAO_ANIMACAO = {
  DESTACAR: 700,
  FADE: 300,
  TRANSITION: 200,
};

// ============================================================================
// URLS E CAMINHOS
// ============================================================================

/**
 * URLs usadas no sistema
 * @constant {Object}
 */
export const URLS = {
  REPORT: "report.html",
  USO_PRIVACIDADE: "uso_privacidade.html",
  FAVICON: "./favicon.png",
  TOUCH_ICON: "./touch-icon.png",
};

// ============================================================================
// CONFIGURAÇÕES DE RELATÓRIO
// ============================================================================

/**
 * Número máximo de meses para comparação
 * @constant {number}
 */
export const MAX_MESES_COMPARACAO = 2;

/**
 * Número de melhores dias no ranking
 * @constant {number}
 */
export const NUM_RANKING_DIAS = 5;

/**
 * Tipos de movimento no relatório
 * @constant {Object}
 */
export const TIPOS_MOVIMENTO = {
  TRABALHO: "Trabalho",
  AGENDAMENTO: "Agendamento",
  ATESTADO: "Atestado",
  NAO_INFORMADO: "Não informado",
};

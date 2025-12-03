// ============================================================================
// NOTIFICATIONS.JS - Módulo centralizado de notificações
// ============================================================================
// 📢 Propósito: Centralizar TODAS as notificações do app em um único lugar
// 🎯 Benefícios:
//    - Consistência de mensagens
//    - Fácil tradução futura
//    - Controle centralizado de timing
//    - Menos repetição de código
// ============================================================================

import {
  NOTIFICACAO_TEMPO_PADRAO,
  NOTIFICACAO_TEMPO_CURTO,
  NOTIFICACAO_TEMPO_LONGO,
} from "./constants.js";

// Referência global ao notie
const notie = window.notie;

// ============================================================================
// FEEDBACK SENSORIAL (Vibração + Sons)
// ============================================================================

/**
 * Configurações de feedback (ler do localStorage)
 */
const CONFIG_FEEDBACK = {
  vibracaoAtiva: localStorage.getItem("feedbackVibracao") !== "false",
  somAtivo: localStorage.getItem("feedbackSom") !== "false",
};

/**
 * Ativa/desativa vibração
 * @param {boolean} ativar
 */
export function configurarVibracao(ativar) {
  CONFIG_FEEDBACK.vibracaoAtiva = ativar;
  localStorage.setItem("feedbackVibracao", ativar.toString());
}

/**
 * Ativa/desativa sons
 * @param {boolean} ativar
 */
export function configurarSom(ativar) {
  CONFIG_FEEDBACK.somAtivo = ativar;
  localStorage.setItem("feedbackSom", ativar.toString());
}

/**
 * Padrões de vibração para diferentes tipos de feedback
 */
const PADROES_VIBRACAO = {
  SUCESSO: [50, 30, 50], // Vibra-pausa-vibra (sucesso)
  ERRO: [100, 50, 100, 50, 100], // Três vibrações (erro grave)
  AVISO: [200], // Vibração única longa (atenção)
  INFO: [30], // Vibração curta (informação)
  CONQUISTA: [50, 50, 50, 50, 100, 100, 200], // Padrão especial para conquistas
};

/**
 * Verifica se o dispositivo suporta vibração
 */
function suportaVibracao() {
  return "vibrate" in navigator;
}

/**
 * Ativa vibração se disponível e habilitada
 * @param {Array<number>} padrao - Padrão de vibração
 */
function vibrar(padrao) {
  if (CONFIG_FEEDBACK.vibracaoAtiva && suportaVibracao()) {
    navigator.vibrate(padrao);
  }
}

/**
 * Toca som de notificação usando Audio API
 * @param {string} tipo - Tipo de som (sucesso, erro, aviso, info)
 */
function tocarSom(tipo) {
  // Verificar se som está habilitado
  if (!CONFIG_FEEDBACK.somAtivo) return;

  try {
    // Criar contexto de áudio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

  // Configurar som baseado no tipo
  switch (tipo) {
    case "success":
      // Som agradável ascendente (sucesso)
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(
        783.99,
        ctx.currentTime + 0.1
      ); // G5
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
      break;

    case "error":
      // Som grave descendente (erro)
      oscillator.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      oscillator.frequency.exponentialRampToValueAtTime(
        196.0,
        ctx.currentTime + 0.15
      ); // G3
      oscillator.type = "sawtooth";
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
      break;

    case "warning":
      // Som de atenção (duas notas)
      oscillator.frequency.setValueAtTime(440.0, ctx.currentTime); // A4
      oscillator.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.25);
      break;

    case "info":
      // Som suave e curto (informação)
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
      break;

    case "achievement":
      // Som de conquista (melodia especial)
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
      break;
    }
  } catch (error) {
    // Silenciosamente ignorar erros de áudio
    console.warn("Erro ao tocar som:", error.message);
  }
}

/**
 * Feedback completo: vibração + som + notificação visual
 * @param {string} tipo - Tipo de feedback
 * @param {string} mensagem - Mensagem da notificação
 * @param {number} tempo - Tempo em segundos
 */
function feedbackCompleto(tipo, mensagem, tempo) {
  // Determinar padrão de vibração e som
  let padraoVibracao;
  let tipoSom;

  switch (tipo) {
    case "success":
      padraoVibracao = PADROES_VIBRACAO.SUCESSO;
      tipoSom = "success";
      break;
    case "error":
      padraoVibracao = PADROES_VIBRACAO.ERRO;
      tipoSom = "error";
      break;
    case "warning":
      padraoVibracao = PADROES_VIBRACAO.AVISO;
      tipoSom = "warning";
      break;
    case "info":
      padraoVibracao = PADROES_VIBRACAO.INFO;
      tipoSom = "info";
      break;
  }

  // Executar feedback
  vibrar(padraoVibracao);
  tocarSom(tipoSom);

  // Notificação visual
  notie.alert({
    type: tipo,
    text: mensagem,
    time: tempo,
  });
}

// ============================================================================
// TIPOS DE NOTIFICAÇÃO
// ============================================================================

/**
 * Tipos disponíveis do notie.js
 * @enum {string}
 */
const TIPOS = {
  SUCESSO: "success",
  ERRO: "error",
  AVISO: "warning",
  INFO: "info",
};

// ============================================================================
// NOTIFICAÇÕES DE SUCESSO
// ============================================================================

/**
 * Mostra notificação de sucesso genérica com feedback sensorial
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarSucesso(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  feedbackCompleto(TIPOS.SUCESSO, mensagem, tempo);
}

/**
 * Notifica pontos registrados com sucesso
 * @param {number} valor - Valor dos pontos
 */
export function notificarPontosRegistrados(valor) {
  notificarSucesso(`✅ ${valor.toLocaleString("pt-BR")} pontos registrados!`);
}

/**
 * Notifica meta criada/atualizada
 */
export function notificarMetaAtualizada() {
  notificarSucesso("✅ Meta atualizada com sucesso!");
}

/**
 * Notifica dados salvos
 */
export function notificarDadosSalvos() {
  notificarSucesso("✅ Dados salvos com sucesso!", NOTIFICACAO_TEMPO_CURTO);
}

/**
 * Notifica logout realizado
 */
export function notificarLogout() {
  notificarSucesso("👋 Até logo!", NOTIFICACAO_TEMPO_CURTO);
}

// ============================================================================
// NOTIFICAÇÕES DE ERRO
// ============================================================================

/**
 * Mostra notificação de erro genérica com feedback sensorial
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarErro(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  feedbackCompleto(TIPOS.ERRO, mensagem, tempo);
}

/**
 * Notifica nome inválido
 */
export function notificarNomeInvalido() {
  notificarErro("❌ Nome inválido (3 a 10 letras)", NOTIFICACAO_TEMPO_LONGO);
}

/**
 * Notifica pontos inválidos
 */
export function notificarPontosInvalidos() {
  notificarErro("❌ Valor inválido (0 a 100.000)", NOTIFICACAO_TEMPO_LONGO);
}

/**
 * Notifica meta inválida
 */
export function notificarMetaInvalida() {
  notificarErro("❌ Selecione uma meta válida", NOTIFICACAO_TEMPO_PADRAO);
}

/**
 * Notifica campo vazio
 * @param {string} campo - Nome do campo (opcional)
 */
export function notificarCampoVazio(campo = "campo") {
  notificarErro(`❌ ${campo} não pode estar vazio`);
}

/**
 * Notifica erro ao salvar
 */
export function notificarErroSalvar() {
  notificarErro("❌ Erro ao salvar. Tente novamente.", NOTIFICACAO_TEMPO_LONGO);
}

// ============================================================================
// NOTIFICAÇÕES DE AVISO
// ============================================================================

/**
 * Mostra notificação de aviso genérica com feedback sensorial
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarAviso(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  feedbackCompleto(TIPOS.AVISO, mensagem, tempo);
}

/**
 * Notifica storage quase cheio
 */
export function notificarStorageQuaseCheio() {
  notificarAviso(
    "⚠️ Armazenamento quase cheio. Exporte seus dados!",
    NOTIFICACAO_TEMPO_LONGO
  );
}

/**
 * Notifica dados zerados (novo mês)
 */
export function notificarResetMensal() {
  notificarAviso(
    "🔄 Novo mês iniciado! Dados zerados.",
    NOTIFICACAO_TEMPO_LONGO
  );
}

// ============================================================================
// NOTIFICAÇÕES INFORMATIVAS
// ============================================================================

/**
 * Mostra notificação informativa genérica com feedback sensorial
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarInfo(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  feedbackCompleto(TIPOS.INFO, mensagem, tempo);
}

/**
 * Notifica sincronização entre abas
 */
export function notificarSincronizado() {
  notificarInfo("🔄 Sincronizado com outra aba", NOTIFICACAO_TEMPO_CURTO);
}

/**
 * Notifica modo de simulação ativo
 */
export function notificarModoSimulacao() {
  notificarInfo("🔮 Modo simulação ativado", NOTIFICACAO_TEMPO_CURTO);
}

/**
 * Notifica modo de registro ativo
 */
export function notificarModoRegistro() {
  notificarInfo("📝 Modo registro ativado", NOTIFICACAO_TEMPO_CURTO);
}

/**
 * Notifica leitura de política recomendada
 */
export function notificarPoliticaRecomendada() {
  notificarInfo(
    "💡 Acesse a Política de Uso a qualquer momento através do menu Relatório.",
    NOTIFICACAO_TEMPO_LONGO
  );
}

// ============================================================================
// NOTIFICAÇÕES ESPECIAIS (História/Comandos)
// ============================================================================

/**
 * Notifica bônus aplicado com feedback especial
 * @param {number} valor - Valor do bônus
 */
export function notificarBonusAplicado(valor) {
  vibrar(PADROES_VIBRACAO.CONQUISTA);
  tocarSom("achievement");
  notie.alert({
    type: TIPOS.SUCESSO,
    text: `🎉 Bônus de ${valor.toLocaleString("pt-BR")} aplicado!`,
    time: NOTIFICACAO_TEMPO_PADRAO,
  });
}

/**
 * Notifica meta batida com celebração especial
 */
export function notificarMetaBatida() {
  vibrar(PADROES_VIBRACAO.CONQUISTA);
  tocarSom("achievement");
  notie.alert({
    type: TIPOS.SUCESSO,
    text: "🎉🏆 PARABÉNS! Você bateu sua meta mensal! 🏆🎉",
    time: NOTIFICACAO_TEMPO_LONGO,
  });
}

/**
 * Notifica atestado registrado
 * @param {string} data - Data do atestado
 */
export function notificarAtestadoRegistrado(data) {
  notificarInfo(`🏥 Atestado registrado para ${data}`);
}

/**
 * Notifica folga registrada
 * @param {string} data - Data da folga
 */
export function notificarFolgaRegistrada(data) {
  notificarInfo(`🌴 Folga registrada para ${data}`);
}

/**
 * Notifica agendamento criado
 * @param {string} data - Data do agendamento
 */
export function notificarAgendamentoCriado(data) {
  notificarSucesso(`📅 Dia off agendado para ${data}`);
}

/**
 * Notifica cancelamento de agendamento
 * @param {string} data - Data cancelada
 */
export function notificarAgendamentoCancelado(data) {
  notificarInfo(`🚫 Agendamento cancelado para ${data}`);
}

// ============================================================================
// DIÁLOGOS DE CONFIRMAÇÃO
// ============================================================================

/**
 * Mostra diálogo de confirmação
 * @param {Object} config - Configuração do diálogo
 * @param {string} config.texto - Texto da pergunta
 * @param {string} config.textoConfirmar - Texto do botão confirmar
 * @param {string} config.textoCancelar - Texto do botão cancelar
 * @param {Function} config.aoConfirmar - Callback ao confirmar
 * @param {Function} config.aoCancelar - Callback ao cancelar (opcional)
 */
export function confirmar({
  texto,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  aoConfirmar,
  aoCancelar,
}) {
  notie.confirm({
    text: texto,
    submitText: textoConfirmar,
    cancelText: textoCancelar,
    submitCallback: aoConfirmar,
    cancelCallback: aoCancelar,
  });
}

/**
 * Confirma logout
 * @param {Function} aoConfirmar - Callback ao confirmar
 */
export function confirmarLogout(aoConfirmar) {
  confirmar({
    texto: "Tem certeza que deseja sair?",
    textoConfirmar: "Sim, sair",
    textoCancelar: "Cancelar",
    aoConfirmar,
  });
}

/**
 * Confirma reset de dados
 * @param {Function} aoConfirmar - Callback ao confirmar
 */
export function confirmarResetDados(aoConfirmar) {
  confirmar({
    texto:
      "⚠️ Isso irá apagar TODOS os seus dados permanentemente. Tem certeza?",
    textoConfirmar: "Sim, apagar tudo",
    textoCancelar: "Cancelar",
    aoConfirmar,
  });
}

/**
 * Confirma leitura de política (primeiro acesso)
 * @param {Function} aoConfirmar - Callback se aceitar ler
 * @param {Function} aoCancelar - Callback se recusar
 */
export function confirmarLeituraPolitica(aoConfirmar, aoCancelar) {
  confirmar({
    texto:
      "📋 Bem-vindo(a)! Recomendamos fortemente a leitura da <strong>Política de Uso</strong> para entender todas as funcionalidades. Deseja ler agora?",
    textoConfirmar: "Sim, ler agora",
    textoCancelar: "Depois",
    aoConfirmar,
    aoCancelar,
  });
}

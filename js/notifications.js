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
 * Mostra notificação de sucesso genérica
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarSucesso(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  notie.alert({
    type: TIPOS.SUCESSO,
    text: mensagem,
    time: tempo,
  });
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
 * Mostra notificação de erro genérica
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarErro(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  notie.alert({
    type: TIPOS.ERRO,
    text: mensagem,
    time: tempo,
  });
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
 * Mostra notificação de aviso genérica
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarAviso(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  notie.alert({
    type: TIPOS.AVISO,
    text: mensagem,
    time: tempo,
  });
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
 * Mostra notificação informativa genérica
 * @param {string} mensagem - Texto da notificação
 * @param {number} tempo - Tempo em segundos (opcional)
 */
export function notificarInfo(mensagem, tempo = NOTIFICACAO_TEMPO_PADRAO) {
  notie.alert({
    type: TIPOS.INFO,
    text: mensagem,
    time: tempo,
  });
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
 * Notifica bônus aplicado
 * @param {number} valor - Valor do bônus
 */
export function notificarBonusAplicado(valor) {
  notificarSucesso(`🎉 Bônus de ${valor.toLocaleString("pt-BR")} aplicado!`);
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

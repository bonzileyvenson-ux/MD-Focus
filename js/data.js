// js/data.js (Versão Final para Consistência)

let dadosUsuario = null;

export function getDadosUsuario() {
  if (!dadosUsuario) {
    dadosUsuario = carregarDados();
  }
  return dadosUsuario;
}

export function setCurrentUser(nome) {
  localStorage.setItem("currentUser", nome);
}

export function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

export function clearCurrentUser() {
  localStorage.removeItem("currentUser");
  dadosUsuario = null;
}

export function atualizarDadosUsuario(novosDados) {
  dadosUsuario = novosDados;
  salvarDados(dadosUsuario);
}

/**
 * Mapeamento das Metas por nome de chave.
 * Nota: Os valores do SELECT (300, 400, etc.) devem ser usados como chaves,
 * mas para este exemplo, manteremos as chaves em string por enquanto.
 */
export const MAPA_METAS = {
  600: 90000,
  500: 65000,
  400: 55000,
  300: 45000,
};

/**
 * Retorna a chave de armazenamento dinâmico para o usuário.
 * @returns {string} Chave formatada para localStorage.
 */
export function getChaveDadosUsuario() {
  const nome = localStorage.getItem("currentUser");
  if (!nome) return null;
  return `dados_${nome}`;
}

/**
 * Carrega o objeto de dados do usuário do localStorage.
 * @returns {object | null} O objeto de dados do usuário ou null.
 */
export function carregarDados() {
  const chave = getChaveDadosUsuario();
  if (!chave) {
    return null;
  }
  const dadosJSON = localStorage.getItem(chave);
  if (!dadosJSON) {
    return null;
  }

  const dados = JSON.parse(dadosJSON);

  const hoje = new Date();
  const dataUltimoCalculo = new Date(dados.dataUltimoCalculo);

  if (hoje.getMonth() !== dataUltimoCalculo.getMonth()) {
    dados.realizadoDiario = {};
    dados.realizadoTotal = 0;
    dados.dataUltimoCalculo = hoje.toISOString().slice(0, 10);
    salvarDados(dados); // Salva os dados zerados
  }

  dadosUsuario = dados;
  return dados;
}

/**
 * Salva o objeto de dados atual do usuário no localStorage.
 * @param {object} dados O objeto de dados a ser salvo.
 */
export function salvarDados(dados) {
  const chave = getChaveDadosUsuario();
  localStorage.setItem(chave, JSON.stringify(dados));
  dadosUsuario = dados;
}

/**
 * Cria a estrutura inicial de dados para um novo usuário.
 * @param {string} funcionario Nome do funcionário.
 * @param {string} metaDiariaBase Meta diária selecionada (chave do MAPA_METAS).
 * @returns {object} O objeto de dados inicial.
 */
export function criarDadosIniciais(funcionario, metaDiariaBase) {
  const metaMensal = MAPA_METAS[metaDiariaBase] || 0;

  const dados = {
    nome: funcionario,
    metaMensal: metaMensal,
    // mapa de metas personalizável por usuário (chaves em R$ como strings -> valor mensal)
    mapaMetas: Object.assign({}, MAPA_METAS),
    // chave selecionada do dropdown (300/400/500/600)
    selectedMetaKey: metaDiariaBase || "300",
    realizadoDiario: {},
    realizadoTotal: 0,
    dataUltimoCalculo: new Date().toISOString().slice(0, 10),
    observacoes: [], // [{ date: 'YYYY-MM-DD', text: '...' }]
  };

  dadosUsuario = dados;
  return dados;
}

/** Observações helpers **/
export function getObservacoesUsuario() {
  const dados = getDadosUsuario();
  if (!dados) return [];
  return dados.observacoes || [];
}

export function adicionarObservacao(dateISO, text) {
  const chave = getChaveDadosUsuario();
  if (!chave) return null;
  const dados =
    getDadosUsuario() ||
    criarDadosIniciais(localStorage.getItem("currentUser") || "Usuário", "300");
  if (!dados.observacoes) dados.observacoes = [];
  dados.observacoes.push({ date: dateISO, text: text });
  salvarDados(dados);
  return dados.observacoes;
}

export function limparObservacoes() {
  const dados = getDadosUsuario();
  if (!dados) return;
  dados.observacoes = [];
  salvarDados(dados);
}

/**
 * Verifica se uma data específica está agendada como dia off
 * @param {string} dataBR - Data no formato DD/MM/YYYY
 * @returns {boolean} true se a data está agendada, false caso contrário
 */
export function isDiaAgendado(dataBR) {
  const dados = getDadosUsuario();
  if (!dados || !dados.diasOffAgendados) return false;
  return dados.diasOffAgendados.includes(dataBR);
}

/**
 * Retorna lista de todos os dias agendados
 * @returns {string[]} Array de datas no formato DD/MM/YYYY
 */
export function getDiasAgendados() {
  const dados = getDadosUsuario();
  if (!dados || !dados.diasOffAgendados) return [];
  return dados.diasOffAgendados;
}

// js/data.js (Versão Final para Consistência)

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
  const nome = localStorage.getItem("nomeFuncionario") || "default";
  return `dados_${nome}`;
}

/**
 * Carrega o objeto de dados do usuário do localStorage.
 * @returns {object | null} O objeto de dados do usuário ou null.
 */
export function carregarDados() {
  const chave = getChaveDadosUsuario();
  const dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : null;
}

/**
 * Salva o objeto de dados atual do usuário no localStorage.
 * @param {object} dados O objeto de dados a ser salvo.
 */
export function salvarDados(dados) {
  const chave = getChaveDadosUsuario();
  localStorage.setItem(chave, JSON.stringify(dados));
}

/**
 * Cria a estrutura inicial de dados para um novo usuário.
 * @param {string} funcionario Nome do funcionário.
 * @param {string} metaDiariaBase Meta diária selecionada (chave do MAPA_METAS).
 * @returns {object} O objeto de dados inicial.
 */
export function criarDadosIniciais(funcionario, metaDiariaBase) {
  const metaMensal = MAPA_METAS[metaDiariaBase] || 0;

  return {
    nome: funcionario,
    metaMensal: metaMensal,
    realizadoDiario: {},
    realizadoTotal: 0,
    dataUltimoCalculo: new Date().toISOString().slice(0, 10),
  };
}


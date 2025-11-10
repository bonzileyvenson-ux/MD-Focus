// js/app.js

import {
  destacarElemento,
  alternarDisplay,
 
} from "./ui.js";

const notie = window.notie;

import {
  salvarDados,
  criarDadosIniciais,
  carregarDados,
  MAPA_METAS,
  getDadosUsuario,
  atualizarDadosUsuario,
} from "./data.js";

// CORREÇÃO 1: Renomear a função no import para o nome correto
import {
  calcularEAtualizarDashboard,
  atualizarGraficoCircular,
 
} from "./calc.js";
import {
  validarNome,
  validarMeta,
  validarPontosRegistro,
} from "./validation.js";
import { configurarModalHistorico, abrirModalHistorico,solicitarBonus } from "./history.js";

// Importar a função de atualização do gráfico
let modoAtual = "registro";

document.addEventListener("DOMContentLoaded", () => {
  carregarTema(); // NOVO: Carrega o tema salvo ao iniciar
  const dadosUsuario = carregarDados();
  if (dadosUsuario) {
    // CORREÇÃO 2: Apenas iniciar o dashboard (os cálculos e gráfico serão feitos dentro de iniciarDashboard)
    iniciarDashboard(dadosUsuario.nome);
  } else {
    configurarCadastro();
  }
});

function configurarCadastro() {
  const btnConfirmar = document.getElementById("btn-confirmar");

  if (btnConfirmar) {
    // Chamamos a função de validação quando o botão é clicado
    btnConfirmar.addEventListener("click", validarECadastrar);
  }
}

// CORREÇÃO 3: Renomear e unificar 'validarCadastro' e 'daddosUsuario'
function validarECadastrar() {
  const inputNomeElement = document.getElementById("input-name");
  const metaDropdownElement = document.getElementById("meta-dropdown");

  const nomeFuncionario = inputNomeElement ? inputNomeElement.value.trim() : "";
  const metaValorString = metaDropdownElement
    ? metaDropdownElement.value
    : "none";

  if (!validarNome(nomeFuncionario)) {
    notie.alert({
      type: "error",
      text: "Por favor, digite um nome valído e legível (3 a 10 letras, sem repetição tripla).",
      time: 4,
    });
    return;
  }

  if (!validarMeta(metaValorString)) {
    notie.alert({
      type: "error",
      text: "Opa!, você esqueceu de selecionar uma meta válida.",
      time: 3,
    });
    return;
  }

  // --- LÓGICA CRÍTICA DE SALVAMENTO (PRIMEIRO LOGIN) ---

  // 1. CRIAÇÃO do novo objeto de dados
  const dadosUsuario = criarDadosIniciais(nomeFuncionario, metaValorString);

  // 2. SALVAMENTO do objeto no data.js (localStorage)
  salvarDados(dadosUsuario);

  // 3. INÍCIO do Dashboard
  iniciarDashboard(nomeFuncionario);
}

export function iniciarDashboard(nome) {
  // Se estivermos em um login automático ou se a variável global não estiver pronta,
  // garantimos o carregamento. No primeiro login, 'dadosUsuario' já estará pronto.
  const dadosUsuario = getDadosUsuario();
  if (!dadosUsuario) {
    return;
  }

  // 1. INTELIGÊNCIA: Calcular o estado atual

  const resultado = calcularEAtualizarDashboard(dadosUsuario);

  // 2. ATUALIZAÇÃO DA UI (Chama a função que injeta dados e atualiza o gráfico)

  atualizarUIDashboard(resultado);

  // 3. ATUALIZAÇÃO DO NOME E META NO HEADER
  const userName = document.getElementById("usuario-nome");
  const metaData = document.getElementById("meta-data");

  // O nomeFinal é o nome que veio da validação/carregamento (dadosUsuario.nome)
  const nomeFinal = dadosUsuario.nome;

  // 4. TRANSIÇÃO VISUAL
  const messageElement = document.getElementById("messagem-inicial");
  const inputContainerElement = document.getElementById("input-cadasto");

  if (messageElement) {
    messageElement.classList.replace("text-bemVindo", "text-bemVindo-hidden");
  }
  if (inputContainerElement) {
    inputContainerElement.classList.replace(
      "input-meta-name",
      "input-meta-name-hidden"
    );
  }

  // Mostra o nome e a meta
  userName.classList.replace("usuario-name-hidden", "usuario-name");
  
  // CORREÇÃO DE SEGURANÇA: Evitar XSS usando textContent em vez de innerHTML
  // Limpa o conteúdo anterior
  userName.innerHTML = ''; 
  // Cria o ícone de forma segura
  const icon = document.createElement('i');
  icon.className = 'bi bi-person-badge-fill';
  // Adiciona o ícone e o texto do nome de forma segura
  userName.appendChild(icon);
  userName.appendChild(document.createTextNode(nomeFinal));

  metaData.classList.replace("meta-data-hidden", "meta-data");

  // 5. ATIVAÇÃO DO BOTÃO DE EDIÇÃO
  ativarBotaoEdit();
  ativarListenerMeta();
  configurarLimiteInput();
  configurarModalHistorico();
  editoresBtnsListerner();
  solicitarBtnListerner();
  configurarToggleTema(); // NOVO: Ativa o botão de tema


  if (window.matchMedia("(min-width: 768px)").matches) {
    abrirModalHistorico();
  }

  // 6. ALERTA DE SUCESSO (Apenas no login, não no carregamento automático)
  if (nome) {
    // Se o nome veio como parâmetro (indicando login novo)
    notie.alert({
      type: "success",
      text: `Bem-vindo(a), ${nomeFinal}! Dashboard pronta.`,
      time: 3,
    });
  }
}

// Você precisa da função atualizarUIDashboard para injetar os dados
// Ela deve usar os resultados do calc.js e o objeto dadosUsuario
function atualizarUIDashboard(resultados) {
  const dadosUsuario = getDadosUsuario();
  const PontotalElement = document.getElementById("ponto-total");
  if (PontotalElement) {
    const pontoTotal = dadosUsuario.realizadoTotal;

    const pontoFormatado = pontoTotal.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    PontotalElement.textContent = pontoFormatado;
    destacarElemento("ponto-total");
  }

  const diariaElement = document.getElementById("meta-value");
  if (diariaElement) {
    const valorMeta = resultados.metaDiariaNecessaria;

    const valorFormatado = valorMeta.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    diariaElement.textContent = valorFormatado;
    destacarElemento("meta-value");
  }

  // meta mensal
  const metaMensalElement = document.getElementById("meta-mensal");
  if (metaMensalElement) {
    const metaTotal = dadosUsuario.metaMensal;
    const metaTotalFormatado = metaTotal.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    metaMensalElement.textContent = metaTotalFormatado;
    destacarElemento("meta-mensal");
  }
  // 2. Dias Restantes
  const diasRestantesElement = document.getElementById("dias-restante");
  if (diasRestantesElement) {
    diasRestantesElement.textContent = resultados.diasUteisRestantes;
    destacarElemento("dias-restante");
  }

  atualizarGraficoCircular(
    resultados.percentualProgresso,
    resultados.metaDiariaNecessaria
  );
}

function ativarBotaoEdit() {
  const btnEdit = document.getElementById("btn-edit");
  const inputEdit = document.getElementById("edita-pontos");
  const btnSubmit = document.getElementById("btn-pontos-submit");
  const btnSimulacao = document.getElementById("calculo-rapido");

  // Botão para alternar o input para REGISTRO REAL
  if (btnEdit && inputEdit) {
    const newBtnEdit = btnEdit.cloneNode(true);
    btnEdit.parentNode.replaceChild(newBtnEdit, btnEdit);
    newBtnEdit.addEventListener("click", () => {
      modoAtual = "registro"; // Garante o modo correto
      inputEdit.classList.toggle("edita-pontos-hidden");
      inputEdit.focus();
      notie.alert({
        type: "info",
        text: "Modo Registro: O valor inserido será salvo.",
        time: 2,
      });
    });
  }

  // Botão para ativar o modo de SIMULAÇÃO
  if (btnSimulacao) {
    const newBtnSimulacao = btnSimulacao.cloneNode(true);
    btnSimulacao.parentNode.replaceChild(newBtnSimulacao, btnSimulacao);
    newBtnSimulacao.addEventListener("click", ligarModoSimulacao);
  }

  // Botão de SUBMISSÃO (V), que agora chama a função centralizadora
  if (btnSubmit) {
    const newBtnSubmit = btnSubmit.cloneNode(true);
    btnSubmit.parentNode.replaceChild(newBtnSubmit, btnSubmit);
    newBtnSubmit.addEventListener("click", validarESubmeterPontos);
  }
}

function validarESubmeterPontos() {
  const inputPontosElement = document.getElementById("input-pontos");
  const pontosString = inputPontosElement
    ? inputPontosElement.value.trim()
    : "";

  const pontoAdicionado = Number(pontosString);

  // Validação de segurança básica
  if (!pontosString || isNaN(pontoAdicionado) || pontoAdicionado <= 0) {
    notie.alert({
      type: "error",
      text: "Insira um valor numérico válido e maior que zero.",
      time: 3,
    });
    return;
  }

  const dadosUsuario = getDadosUsuario();
  // Decide o que fazer com base no modo atual
  if (modoAtual === "registro") {
    const { valido, mensagem, dataHojeKey } = validarPontosRegistro(pontoAdicionado, dadosUsuario.realizadoDiario);
    if (!valido) {
        notie.alert({
            type: "error",
            text: mensagem,
            time: 4,
        });
        if (mensagem.includes("bloqueado")) {
            document.getElementById("edita-pontos").classList.add("edita-pontos-hidden");
        }
        return;
    }

    dadosUsuario.realizadoDiario[dataHojeKey] = pontoAdicionado;
    dadosUsuario.realizadoTotal += pontoAdicionado;

    atualizarDadosUsuario(dadosUsuario);
    inputPontosElement.value = "";
    document
      .getElementById("edita-pontos")
      .classList.add("edita-pontos-hidden");
    iniciarDashboard(null); // Atualiza o dashboard sem msg de boas-vindas

    notie.alert({
      type: "success",
      text: `R$ ${pontoAdicionado.toLocaleString(
        "pt-BR"
      )} registrados para hoje!`,
      time: 2,
    });
  } else if (modoAtual === "simulacao") {
    // --- Lógica de SIMULAÇÃO ---
    executarCalculoRapidoSimulacao(pontoAdicionado);
  }
}

function ativarListenerMeta() {
  const metaDropdown = document.getElementById("meta-dropdown");

  if (metaDropdown) {
    metaDropdown.addEventListener("change", (event) => {
      const metaAlterada = event.target.value;

      if (!metaAlterada || metaAlterada === "none") {
        return;
      }

      const dadosUsuario = getDadosUsuario();
      const novaMetaMensal = MAPA_METAS[metaAlterada];
      dadosUsuario.metaMensal = novaMetaMensal;
      atualizarDadosUsuario(dadosUsuario);
      iniciarDashboard(dadosUsuario.nome);

      notie.alert({
        type: "success",
        text: `Nova meta de R$ ${metaAlterada},00 selecionada! Cálculos atualizados.`,
        time: 3,
      });
    });
  }
}

function configurarLimiteInput() {
  const inputPontosElement = document.getElementById("input-pontos");

  if (inputPontosElement) {
    inputPontosElement.addEventListener("input", function () {
      let maxLength = 5;
      if (modoAtual === 'registro') {
        maxLength = 4;
      }
      
      if (this.value.length > maxLength) {
        this.value = this.value.slice(0, maxLength);
      }
    });
  }
}





// LÓGICA DE SIMULAÇÃO
// =================================================================================

function ligarModoSimulacao() {
  modoAtual = "simulacao";
  const inputContainer = document.getElementById("edita-pontos");
  const inputPontos = document.getElementById("input-pontos");

  if (inputContainer) {
    inputContainer.classList.remove("edita-pontos-hidden");
  }

  if (inputPontos) {
    inputPontos.value = "";
    inputPontos.focus();
  }

  notie.alert({
    type: "info",
    text: "Modo Simulação Ativo. Insira um valor para recalcular as metas.",
    time: 3,
  });
}

function executarCalculoRapidoSimulacao(pontoAdicionado) {
  const dadosUsuario = getDadosUsuario();
  const dadosSimulados = {
    nome: dadosUsuario.nome, // Mantém o nome para consistência
    metaMensal: dadosUsuario.metaMensal,
    realizadoDiario: {},
    realizadoTotal: pontoAdicionado,
  };

  const resultadoSimulado = calcularEAtualizarDashboard(dadosSimulados);

  // --- ATUALIZAÇÃO VISUAL COMPLETA ---
  atualizarUIDashboard(resultadoSimulado); // Atualiza TODA a UI com os dados da simulação
  // --- FIM DA ATUALIZAÇÃO VISUAL ---

  let mensagem = "";
  const faltanteFormatado = resultadoSimulado.faltante.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
  const diariaFormatada = resultadoSimulado.metaDiariaNecessaria.toLocaleString(
    "pt-BR",
    { maximumFractionDigits: 0 }
  );
  const diasRestantes = resultadoSimulado.diasUteisRestantes;
  const metaTotalFormatada = dadosUsuario.metaMensal.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });

  if (resultadoSimulado.faltante > 0) {
    mensagem = `
            Se o seu total fosse <b> ${pontoAdicionado.toLocaleString(
              "pt-BR"
            )}</b> 
            ainda faltaria <b> ${faltanteFormatado}</b> para a meta de ${metaTotalFormatada}.<br>
            Você precisaria fazer <b>${diariaFormatada} por dia</b> nos próximos ${diasRestantes} dias úteis.
        `;
  } else {
    const superado = (resultadoSimulado.faltante * -1).toLocaleString("pt-BR", {
      maximumFractionDigits: 0,
    });
    mensagem = `
            <b>🎉 Meta Superada!</b> Com esse valor, você atingiria a meta de ${metaTotalFormatada} 
            e a superaria em <b> ${superado}</b> pontos.
        `;
  }

  notie.alert({
    type: "info",
    text: mensagem,
    time: 15,
  });

  modoAtual = "registro";
  document.getElementById("edita-pontos").classList.add("edita-pontos-hidden");
  const TEMPO_REINICIALIZACAO = 15000;
  setTimeout(() => {
    iniciarDashboard(null);
    notie.alert({
      type: "success",
      text: "Dashboard restaurado para os dados reais.",
      time: 3,
    });
  }, TEMPO_REINICIALIZACAO);
}

function editoresBtnsListerner() {
  const btnPrincipal = document.getElementById("btn-principal");
  const btnCalculadora = document.getElementById("calculo-rapido");
  const btnLapis = document.getElementById("btn-edit");

  if (btnPrincipal && btnCalculadora && btnLapis) {
    // Remove the event listener to avoid duplicates
    btnPrincipal.replaceWith(btnPrincipal.cloneNode(true));
    document.getElementById("btn-principal").addEventListener("click", () => {
      alternarDisplay(btnCalculadora);
      alternarDisplay(btnLapis);
    });
  }
}


function solicitarBtnListerner(){
  const btnSolicitar = document.getElementById("btn-solicitar");
  if (btnSolicitar) {
    btnSolicitar.addEventListener("click", () => {
      solicitarBonus()
    });
}}

// =================================================================================
// LÓGICA DE TEMA (DARK/LIGHT MODE)
// =================================================================================

function carregarTema() {
  const temaSalvo = localStorage.getItem("tema") || "light";
  document.documentElement.setAttribute("data-theme", temaSalvo);
  atualizarIconeTema(temaSalvo);
}

function configurarToggleTema() {
  const toggleButton = document.getElementById("theme-toggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      let temaAtual = document.documentElement.getAttribute("data-theme");
      const novoTema = temaAtual === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", novoTema);
      localStorage.setItem("tema", novoTema);
      atualizarIconeTema(novoTema);
    });
  }
}

function atualizarIconeTema(tema) {
  const iconElement = document.querySelector("#theme-toggle i");
  if (iconElement) {
    iconElement.className = tema === "dark" 
      ? "bi bi-sun-fill"   // Ícone para passar para o modo claro
      : "bi bi-moon-stars-fill"; // Ícone para passar para o modo escuro
  }
}

// =================================================================================
// REGISTRO DO SERVICE WORKER (PWA OFFLINE)
// =================================================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(error => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
  });
}

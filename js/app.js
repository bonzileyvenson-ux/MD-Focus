// js/app.js

import { destacarElemento, alternarDisplay } from "./ui.js";

const notie = window.notie;

import {
  salvarDados,
  criarDadosIniciais,
  carregarDados,
  MAPA_METAS,
  getDadosUsuario,
  atualizarDadosUsuario,
  setCurrentUser,
  clearCurrentUser,
  getDiasAgendados,
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
import {
  configurarModalHistorico,
  abrirModalHistorico,
  solicitarBonus,
} from "./history.js";

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
  // Apenas configuramos o botão de login rápido (nome único)
  const loginBtn = document.getElementById("login-button");
  const loginInput = document.getElementById("login-username");

  if (loginBtn && loginInput) {
    loginBtn.addEventListener("click", () => {
      const nome = loginInput.value ? loginInput.value.trim() : "";
      if (!validarNome(nome)) {
        notie.alert({
          type: "error",
          text: "Por favor, digite um nome válido (3 a 10 letras).",
          time: 3,
        });
        return;
      }

      // Verifica se é o primeiro acesso (novo usuário)
      const primeiroAcesso = !localStorage.getItem(`dados_${nome}`);

      // Define o usuário atual (apenas local) e cria dados iniciais com meta padrão (300 -> 45000)
      setCurrentUser(nome);
      const dadosUsuario = criarDadosIniciais(nome, "300");
      salvarDados(dadosUsuario);

      // Se for primeiro acesso, mostra aviso sobre política de uso
      if (primeiroAcesso) {
        notie.confirm({
          text: "📋 Bem-vindo(a)! Recomendamos fortemente a leitura da <strong>Política de Uso</strong> para entender todas as funcionalidades do aplicativo. Deseja ler agora?",
          submitText: "Sim, ler agora",
          cancelText: "Depois",
          submitCallback: () => {
            window.open("uso_privacidade.html", "_blank");
            iniciarDashboard(nome);
          },
          cancelCallback: () => {
            notie.alert({
              type: "info",
              text: "💡 Acesse a Política de Uso a qualquer momento através do menu Relatório.",
              time: 5,
            });
            iniciarDashboard(nome);
          },
        });
      } else {
        iniciarDashboard(nome);
      }
    });
  }
}
// End of configurarCadastro

export function iniciarDashboard(nome) {
  // Se estivermos em um login automático ou se a variável global não estiver pronta,
  // garantimos o carregamento. No primeiro login, 'dadosUsuario' já estará pronto.
  const dadosUsuario = getDadosUsuario();
  if (!dadosUsuario) {
    return;
  }

  // Mostrar o conteúdo principal e esconder a tela de login
  const loginScreen = document.getElementById("login-screen");
  const mainContent = document.getElementById("main-content");
  if (loginScreen) loginScreen.classList.add("hidden");
  if (mainContent) mainContent.classList.remove("hidden");

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
  userName.innerHTML = "";
  // Cria o ícone de forma segura
  const icon = document.createElement("i");
  icon.className = "bi bi-person-badge-fill";
  // Adiciona o ícone e o texto do nome de forma segura
  userName.appendChild(icon);
  userName.appendChild(document.createTextNode(nomeFinal));

  metaData.classList.replace("meta-data-hidden", "meta-data");

  // Exibir o dropdown de meta para que o usuário possa "brincar" com as metas
  const metaDropdown = document.getElementById("meta-dropdown");
  if (metaDropdown) {
    metaDropdown.classList.remove("hidden");
    // Atualiza labels do dropdown com os valores atuais do mapa de metas do usuário
    refreshMetaDropdownLabels();
  }

  // 5. ATIVAÇÃO DO BOTÃO DE EDIÇÃO
  ativarBotaoEdit();
  ativarListenerMeta();
  configurarLimiteInput();
  configurarModalHistorico();
  editoresBtnsListerner();
  solicitarBtnListerner();
  configurarToggleTema(); // NOVO: Ativa o botão de tema

  // Configura o logout (botão aparece junto ao nome do usuário)
  configurarLogout();

  // Ajustes responsivos para comportamento dos botões/input (mobile vs desktop)
  setupResponsiveMode();

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

// Atualiza os textos das opções do dropdown para mostrar o valor mensal atual do mapaMetas
export function refreshMetaDropdownLabels() {
  const metaDropdown = document.getElementById("meta-dropdown");
  const dadosUsuario = getDadosUsuario();
  if (!metaDropdown || !dadosUsuario) return;

  // keys esperadas na ordem visual
  const keys = ["300", "400", "500", "600"];
  for (let i = 0; i < metaDropdown.options.length; i++) {
    const opt = metaDropdown.options[i];
    const val = opt.value;
    if (keys.includes(val)) {
      const mensal =
        (dadosUsuario.mapaMetas && dadosUsuario.mapaMetas[val]) ||
        MAPA_METAS[val] ||
        0;
      opt.textContent = `R$ ${val},00`;
    }
  }

  // Restaura a seleção que o usuário tinha
  if (dadosUsuario.selectedMetaKey) {
    metaDropdown.value = dadosUsuario.selectedMetaKey;
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

  atualizarStatusTop5();
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
      // Detectar landscape (qualquer largura) ou desktop largo
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const isDesktop = window.matchMedia("(min-width: 769px)").matches;

      if (isLandscape || isDesktop) {
        // No landscape ou desktop: sempre mostrar o input (não dar toggle)
        inputEdit.classList.remove("edita-pontos-hidden");
        inputEdit.focus();
      } else {
        // No portrait mobile: comportamento antigo (toggle)
        inputEdit.classList.toggle("edita-pontos-hidden");
        if (!inputEdit.classList.contains("edita-pontos-hidden")) {
          inputEdit.focus();
        }
      }

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
    const diasAgendados = getDiasAgendados();
    const { valido, mensagem, dataHojeKey } = validarPontosRegistro(
      pontoAdicionado,
      dadosUsuario.realizadoDiario,
      diasAgendados
    );
    if (!valido) {
      notie.alert({
        type: "error",
        text: mensagem,
        time: 4,
      });
      // Apenas no mobile escondemos o input quando a validação bloquear o registro
      if (mensagem.includes("bloqueado")) {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) {
          const editaEl = document.getElementById("edita-pontos");
          if (editaEl) editaEl.classList.add("edita-pontos-hidden");
        }
      }
      return;
    }

    dadosUsuario.realizadoDiario[dataHojeKey] = pontoAdicionado;
    dadosUsuario.realizadoTotal += pontoAdicionado;

    atualizarDadosUsuario(dadosUsuario);
    inputPontosElement.value = "";
    // Ao registrar, no mobile escondemos o editor; no desktop mantemos visível
    const isMobileAfter = window.matchMedia("(max-width: 768px)").matches;
    if (isMobileAfter) {
      const editaEl = document.getElementById("edita-pontos");
      if (editaEl) editaEl.classList.add("edita-pontos-hidden");
    }
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
      const novaMetaMensal =
        (dadosUsuario.mapaMetas && dadosUsuario.mapaMetas[metaAlterada]) ||
        MAPA_METAS[metaAlterada];
      const anterior = dadosUsuario.metaMensal;
      dadosUsuario.metaMensal = novaMetaMensal;
      // Persistir a opção selecionada para manter entre sessões
      dadosUsuario.selectedMetaKey = metaAlterada;
      atualizarDadosUsuario(dadosUsuario);
      console.log(
        `[MD-Focus] Meta selecionada alterada por usuário: key=${metaAlterada}, mensal=${novaMetaMensal} (antes=${anterior})`
      );
      // Atualiza labels caso o mapa de metas tenha valores customizados
      refreshMetaDropdownLabels();
      iniciarDashboard(dadosUsuario.nome);

      notie.alert({
        type: "success",
        text: `Opção selecionada: R$ ${metaAlterada},00 — meta mensal ${novaMetaMensal.toLocaleString(
          "pt-BR"
        )}.`,
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

      if (modoAtual === "registro") {
        maxLength = 4;
      }

      if (this.value.length > maxLength) {
        this.value = this.value.slice(0, maxLength);
      }
    });

    // Key handling: Enter/Ctrl+Enter should trigger the same submit flow as the button click
    inputPontosElement.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();

      const isDesktop = window.matchMedia("(min-width: 769px)").matches;
      const submitButton = document.getElementById("btn-pontos-submit");

      if (isDesktop) {
        if (ev.ctrlKey || ev.metaKey) {
          // Ctrl/⌘ + Enter -> Registro path
          modoAtual = "registro";
          if (submitButton) {
            submitButton.click();
          } else {
            validarESubmeterPontos();
          }
          return;
        }

        // Enter alone on desktop -> Simulação (set mode then trigger the same submit)
        modoAtual = "simulacao";
        if (submitButton) {
          submitButton.click();
        } else {
          // fallback: call simulation directly using current input value
          const val = Number(this.value.trim());
          if (!val || isNaN(val) || val <= 0) {
            notie.alert({
              type: "error",
              text: "Insira um valor válido para simular.",
              time: 3,
            });
            return;
          }
          executarCalculoRapidoSimulacao(val);
        }
        return;
      }

      // Mobile: Enter behaves like registro (submit)
      modoAtual = "registro";
      if (submitButton) {
        submitButton.click();
      } else {
        validarESubmeterPontos();
      }
    });

    // Placeholder hint will be set by setupResponsiveMode (desktop only)
  }
}

function atualizarStatusTop5() {
  const dadosUsuario = getDadosUsuario();

  const statusElement = document.getElementById("top-5-status");

  const statusContainer = document.getElementById("top-5-status-container");

  if (!statusContainer) return;

  const totalPontos = dadosUsuario ? dadosUsuario.realizadoTotal || 0 : 0;

  const totalCaixas = dadosUsuario ? dadosUsuario.totalCaixas || 0 : 0;

  const totalErros = dadosUsuario ? dadosUsuario.totalErros || 0 : 0;

  if (!totalCaixas && !totalErros && !totalPontos) {
    statusContainer.style.display = "none";

    return;
  }

  statusContainer.style.display = "block";

  // Critérios para Top Funcionário:
  // 1. Bater a primeira meta (R$ 300) - valor pode mudar mensalmente mas sempre será o primeiro do MAPA_METAS
  // 2. Manter taxa de erro <= 1.8%

  // Busca o valor da primeira meta (300) do mapaMetas personalizado do usuário ou do MAPA_METAS padrão
  const metaPrimeira =
    (dadosUsuario.mapaMetas && dadosUsuario.mapaMetas["300"]) ||
    MAPA_METAS["300"];
  const MAX_ERRO_PERCENT = 0.018; // 1.8% de erros permitidos

  const erroRatio = totalCaixas > 0 ? totalErros / totalCaixas : 0;
  const erroPercent = erroRatio * 100;

  let statusHtml = "";
  let statusColor = "var(--cor-texto-padrao)";

  const pontosOk = totalPontos >= metaPrimeira;
  const errosOk = erroRatio <= MAX_ERRO_PERCENT;

  // Calcula progresso percentual para cada critério
  const progressoPontos = Math.min((totalPontos / metaPrimeira) * 100, 100);
  const progressoErros =
    erroRatio <= MAX_ERRO_PERCENT
      ? 100
      : Math.max(
          100 - ((erroRatio - MAX_ERRO_PERCENT) / MAX_ERRO_PERCENT) * 100,
          0
        );

  // Verifica se ambos os critérios foram atingidos
  if (pontosOk && errosOk) {
    statusHtml = `
      <i class="bi bi-trophy-fill" style="font-size: 1.4em; animation: pulse 1.5s ease-in-out infinite;"></i> 
      <strong>TOP FUNCIONÁRIO!</strong> 
      <span style="font-size: 0.9em; opacity: 0.9;">✨ ${erroPercent.toFixed(
        1
      )}% erros</span>
    `;
    statusColor = "hsl(29, 85%, 37%)"; // cor terciária (laranja-avermelhado)
    statusElement.style.fontWeight = "bold";
    statusElement.style.textShadow = "0 0 10px rgba(218, 131, 18, 0.3)";
  } else {
    statusElement.style.textShadow = "none";
    statusElement.style.fontWeight = "normal";

    // Feedback específico sobre o que falta
    if (!pontosOk && !errosOk) {
      const faltaPontos = metaPrimeira - totalPontos;
      statusHtml = `
        <i class="bi bi-graph-up-arrow"></i> 
        Falta <strong>${faltaPontos.toLocaleString("pt-BR")}</strong> pts 
        · <i class="bi bi-exclamation-circle"></i> ${erroPercent.toFixed(
          1
        )}% erros (máx 1.8%)
      `;
      statusColor = "#ffc107"; // amarelo/aviso
    } else if (!pontosOk) {
      const faltaPontos = metaPrimeira - totalPontos;
      const percentualFalta = ((faltaPontos / metaPrimeira) * 100).toFixed(0);
      statusHtml = `
        <i class="bi bi-graph-up-arrow"></i> 
        Faltam <strong>${faltaPontos.toLocaleString("pt-BR")}</strong> pts 
        <span style="font-size: 0.85em; opacity: 0.8;">(${percentualFalta}% restante)</span>
      `;
      statusColor = "#17a2b8"; // azul info
    } else {
      // pontosOk mas !errosOk
      const excedenteErro = ((erroRatio - MAX_ERRO_PERCENT) * 100).toFixed(2);
      statusHtml = `
        <i class="bi bi-exclamation-triangle-fill"></i> 
        Meta atingida, mas <strong>${erroPercent.toFixed(1)}% erros</strong> 
        <span style="font-size: 0.85em;">(+${excedenteErro}% acima do limite)</span>
      `;
      statusColor = "#dc3545"; // vermelho
    }
  }

  statusElement.innerHTML = statusHtml;
  statusElement.style.setProperty("color", statusColor, "important");
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

  // Save previous mode and switch to simulation while showing results
  const modoAnterior = modoAtual;
  modoAtual = "simulacao";

  notie.alert({
    type: "info",
    text: mensagem,
    time: 15,
  });

  // Only hide the input on mobile; on desktop keep it visible so user can continue simulating
  const isMobileNow = window.matchMedia("(max-width: 768px)").matches;
  if (isMobileNow) {
    const edita = document.getElementById("edita-pontos");
    if (edita) edita.classList.add("edita-pontos-hidden");
  }

  const TEMPO_REINICIALIZACAO = 15000;
  setTimeout(() => {
    iniciarDashboard(null);
    // restore previous mode
    modoAtual = modoAnterior;
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

      // Se estivermos em mobile e os botões forem escondidos, também esconder o input ativo
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        const inputContainer = document.getElementById("edita-pontos");
        const calcHidden = btnCalculadora.classList.contains("hidden");
        const lapisHidden = btnLapis.classList.contains("hidden");

        // Se ambos os botões estiverem escondidos (estado compacto), esconder o input também
        if (calcHidden && lapisHidden) {
          if (inputContainer)
            inputContainer.classList.add("edita-pontos-hidden");
        }
      }
    });
  }
}

function solicitarBtnListerner() {
  const btnSolicitar = document.getElementById("btn-solicitar");
  if (btnSolicitar) {
    const newBtn = btnSolicitar.cloneNode(true);
    btnSolicitar.parentNode.replaceChild(newBtn, btnSolicitar);
    newBtn.addEventListener("click", () => {
      solicitarBonus();
    });
  }
}

// Logout behavior: clears current user and returns to login screen
function configurarLogout() {
  const btnLogout = document.getElementById("btn-logout");
  const userNameEl = document.getElementById("usuario-nome");

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      notie.confirm({
        text: "Deseja encerrar a sessão e voltar para a tela inicial?",
        submitText: "Sair",
        cancelText: "Cancelar",
        submitCallback: () => {
          clearCurrentUser();
          // Exibir a tela de login e esconder o conteúdo principal
          const loginScreen = document.getElementById("login-screen");
          const mainContent = document.getElementById("main-content");
          if (loginScreen) loginScreen.classList.remove("hidden");
          if (mainContent) mainContent.classList.add("hidden");
          notie.alert({ type: "success", text: "Sessão encerrada.", time: 2 });
        },
        cancelCallback: () => {
          // nada a fazer
        },
      });
    });
  } else if (userNameEl) {
    // fallback: clicar no nome também abre confirmação
    userNameEl.addEventListener("click", () => {
      notie.confirm({
        text: "Deseja encerrar a sessão e voltar para a tela inicial?",
        submitText: "Sair",
        cancelText: "Cancelar",
        submitCallback: () => {
          clearCurrentUser();
          const loginScreen = document.getElementById("login-screen");
          const mainContent = document.getElementById("main-content");
          if (loginScreen) loginScreen.classList.remove("hidden");
          if (mainContent) mainContent.classList.add("hidden");
          notie.alert({ type: "success", text: "Sessão encerrada.", time: 2 });
        },
      });
    });
  }
}

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

// Responsive mode: toggles visibility/behavior between mobile and desktop widths
function setupResponsiveMode() {
  const mq = window.matchMedia("(max-width: 768px)");

  function applyMode(m) {
    const isMobile = m.matches;
    const btnEdit = document.getElementById("btn-edit");
    const btnCalculadora = document.getElementById("calculo-rapido");
    const btnPrincipal = document.getElementById("btn-principal");
    const inputContainer = document.getElementById("edita-pontos");
    const inputPontosElement = document.getElementById("input-pontos");

    // Mobile: keep floating buttons visible, keep input hidden until user toggles
    if (isMobile) {
      if (btnEdit) btnEdit.classList.remove("hidden");
      if (btnCalculadora) btnCalculadora.classList.remove("hidden");
      if (btnPrincipal) btnPrincipal.classList.remove("hidden");
      if (inputContainer) inputContainer.classList.add("edita-pontos-hidden");
      if (inputPontosElement) {
        inputPontosElement.placeholder = ""; // no hint on mobile (keeps compact)
      }
    } else {
      // Desktop / landscape: hide mobile-only buttons and show input always
      if (btnEdit) btnEdit.classList.add("hidden");
      if (btnCalculadora) btnCalculadora.classList.add("hidden");
      if (btnPrincipal) btnPrincipal.classList.add("hidden");
      if (inputContainer)
        inputContainer.classList.remove("edita-pontos-hidden");
      // On desktop we default to simulation mode (desktop users simulate more often)
      modoAtual = "simulacao";
      if (inputPontosElement) {
        inputPontosElement.placeholder =
          "Enter → Simular · Ctrl+Enter → Registrar";
      }
    }
  }

  // Initial apply
  applyMode(mq);

  // Listen for changes
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", (e) => applyMode(e));
  } else if (typeof mq.addListener === "function") {
    mq.addListener((e) => applyMode(e));
  }
}

function atualizarIconeTema(tema) {
  const iconElement = document.querySelector("#theme-toggle i");
  if (iconElement) {
    iconElement.className =
      tema === "dark"
        ? "bi bi-sun-fill" // Ícone para passar para o modo claro
        : "bi bi-moon-stars-fill"; // Ícone para passar para o modo escuro
  }
}

// Service worker / PWA offline support removed per user request.
// Registration and manifest were deleted to disable offline mode.

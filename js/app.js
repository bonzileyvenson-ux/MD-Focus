// ============================================================================
// APP.JS - Controlador principal da aplicação (Refatorado)
// ============================================================================
// 🎯 Propósito: Orquestrar toda a aplicação, gerenciar eventos e UI
// 🧹 Refatoração: Código limpo, modular, bem documentado e fácil de manter
// ============================================================================

// ============================================================================
// IMPORTS - Módulos da aplicação
// ============================================================================

// UI e utilitários
import {
  destacarElemento,
  alternarDisplay,
  debounce,
  mostrarSkeleton,
  removerLoading,
} from "./ui.js";

// Gerenciamento de dados
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

// Notificações Push
import pushManager from "./notifications-push.js";

// Cálculos e gráficos
import {
  calcularEAtualizarDashboard,
  atualizarGraficoCircular,
} from "./calc.js";

// Validações
import {
  validarNome,
  validarMeta,
  validarPontosRegistro,
} from "./validation.js";

// Histórico e comandos
import {
  configurarModalHistorico,
  abrirModalHistorico,
  solicitarBonus,
} from "./history.js";

// Análises e previsões
import { renderizarAnalises } from "./predictions.js";

// Notificações centralizadas
import {
  notificarNomeInvalido,
  notificarPontosRegistrados,
  confirmarLeituraPolitica,
  notificarPoliticaRecomendada,
  notificarSincronizado,
  notificarInfo,
} from "./notifications.js";

// Constantes
import {
  STORAGE_PREFIX,
  STORAGE_THEME,
  TEMAS,
  ICONES,
  MOBILE_MEDIA_QUERY,
} from "./constants.js";

// Dados de demonstração
import { carregarDadosDemo, limparDadosDemo, infoDadosDemo } from "./demo.js";

// Debug
import { debugLog } from "./debug.js";

// ============================================================================
// ESTADO DA APLICAÇÃO
// ============================================================================

/**
 * Modo atual do input (registro ou simulação)
 * @type {string}
 */
let modoAtual = "registro";

// ============================================================================
// FUNÇÃO CENTRAL DE ATUALIZAÇÃO DE UI
// ============================================================================

/**
 * 🔄 Atualiza todos os componentes da UI com dados atualizados
 * Esta é a função central que garante que toda a interface seja renderizada
 * com dados do data layer (não localStorage direto)
 * 
 * @param {Object} dados - Dados do usuário (opcional, busca automaticamente se não fornecido)
 */
export function atualizarTodaUI(dados = null) {
  // Busca dados se não foram fornecidos
  const dadosUsuario = dados || getDadosUsuario();
  
  if (!dadosUsuario) {
    console.warn("⚠️ Nenhum dado disponível para atualizar UI");
    return;
  }

  debugLog("🔄 Atualizando toda a UI com dados centralizados");

  // 1. Calcular métricas do dashboard
  const resultado = calcularEAtualizarDashboard(dadosUsuario);

  // 2. Atualizar dashboard principal (pontos, meta, progresso)
  atualizarUIDashboard(resultado);

  // 3. Atualizar análises e previsões
  try {
    renderizarAnalises();
  } catch (error) {
    console.error("Erro ao renderizar análises:", error);
  }

  // 4. Atualizar gráficos se existirem na página
  try {
    const progressChart = document.getElementById("progress-chart");
    if (progressChart) {
      import("./charts.js").then((module) => {
        const chartManager = module.default;
        if (chartManager && chartManager.createProgressLineChart) {
          chartManager.createProgressLineChart("progress-chart");
        }
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar gráficos:", error);
  }

  debugLog("✅ UI completamente atualizada");
}

// ============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================================

/**
 * Ponto de entrada principal - executa quando DOM estiver pronto
 */
document.addEventListener("DOMContentLoaded", () => {
  carregarTema();

  const dadosUsuario = carregarDados();

  if (dadosUsuario) {
    // Usuário já logado - iniciar dashboard
    iniciarDashboard(dadosUsuario.nome);
  } else {
    // Novo usuário - mostrar tela de cadastro
    configurarCadastro();
  }

  // 🛡️ PROTEÇÃO: Sincronizar dados entre múltiplas abas
  configurarSincronizacaoAbas();

  // 📍 Configurar botão de scroll para observações
  configurarScrollParaObservacoes();

  // 📊 Configurar navegação para análises
  configurarNavegacaoAnalises();
});

// ============================================================================
// CONFIGURAÇÃO DE CADASTRO/LOGIN
// ============================================================================

/**
 * Configura tela de cadastro para novos usuários
 */
function configurarCadastro() {
  const loginBtn = document.getElementById("login-button");
  const loginInput = document.getElementById("login-username");

  if (!loginBtn || !loginInput) return;

  loginBtn.addEventListener("click", () => processarLogin(loginInput));
}

/**
 * Processa login/cadastro do usuário
 * @param {HTMLInputElement} loginInput - Input com nome do usuário
 */
function processarLogin(loginInput) {
  const nome = loginInput.value ? loginInput.value.trim() : "";

  // Validar nome
  if (!validarNome(nome)) {
    notificarNomeInvalido();
    return;
  }

  // Verificar se é primeiro acesso
  const primeiroAcesso = !localStorage.getItem(`${STORAGE_PREFIX}${nome}`);

  // Definir usuário atual
  setCurrentUser(nome);

  // Criar ou carregar dados
  let dadosUsuario;
  if (primeiroAcesso) {
    dadosUsuario = criarDadosIniciais(nome, "300");
    salvarDados(dadosUsuario);
    mostrarBemVindoPrimeiroAcesso(nome);
  } else {
    dadosUsuario = carregarDados();
    iniciarDashboard(nome);
  }
}

/**
 * Mostra mensagem de boas-vindas para primeiro acesso
 * @param {string} nome - Nome do usuário
 */
function mostrarBemVindoPrimeiroAcesso(nome) {
  confirmarLeituraPolitica(
    () => {
      // Aceita ler política
      window.open("uso_privacidade.html", "_blank");
      iniciarDashboard(nome);
    },
    () => {
      // Recusa ler agora
      notificarPoliticaRecomendada();
      iniciarDashboard(nome);
    }
  );
}

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

  // CORREÇÃO DE SEGURANÇA: Atualiza apenas o texto do nome sem apagar os botões
  // Procura o span do nome ou cria se não existir
  let displayUsername = userName.querySelector("#display-username");
  if (!displayUsername) {
    displayUsername = document.createElement("span");
    displayUsername.id = "display-username";
    // Insere depois do ícone (primeiro elemento)
    if (userName.children.length > 0) {
      userName.insertBefore(displayUsername, userName.children[1]);
    } else {
      userName.appendChild(displayUsername);
    }
  }
  displayUsername.textContent = nomeFinal;

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

  // 7. ATUALIZA BADGE DE NOTIFICAÇÕES (se o botão existir)
  setTimeout(() => {
    if (pushManager) {
      pushManager.updateBadge();
    }
  }, 500);
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
export function atualizarUIDashboard(resultados) {
  const dadosUsuario = getDadosUsuario();

  // 🛡️ PROTEÇÃO: Verificar se dados existem
  if (!dadosUsuario) {
    console.error("❌ Erro: getDadosUsuario() retornou null");
    return;
  }

  debugLog("✅ Dados carregados:", dadosUsuario);

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

    // Texto claro explicando a meta diária
    if (resultados.diasUteisRestantes > 0) {
      diariaElement.textContent = `${valorFormatado} pts/dia `;
    } else if (resultados.isMetaBatida) {
      diariaElement.textContent = `Meta batida! 🎉`;
    } else {
      diariaElement.textContent = `Faltam ${valorFormatado} pts`;
    }
    destacarElemento("meta-value");
  }

  // meta mensal
  const metaMensalElement = document.getElementById("meta-mensal");
  if (
    metaMensalElement &&
    dadosUsuario &&
    dadosUsuario.metaMensal !== undefined
  ) {
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

    // Mensagem especial quando dias restantes = 0
    if (resultados.diasUteisRestantes === 0) {
      setTimeout(() => {
        if (resultados.isMetaBatida) {
          notie.alert({
            type: "success",
            text: `🎉 Parabéns! Você bateu a meta com ${resultados.percentualProgresso.toFixed(
              1
            )}% de conclusão!`,
            time: 5,
            position: "top",
          });
        } else if (resultados.diasUteisRestantes === 1) {
          const faltante = resultados.faltante;
          notie.alert({
            type: "warning",
            text: `⏰ Último dia do mês! Ainda faltam ${faltante.toLocaleString(
              "pt-BR"
            )} pontos para bater a meta. Dê o máximo hoje! 💪`,
            time: 6,
            position: "top",
          });
        }
      }, 800);
    }
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

        // Foca o input automaticamente
        const inputPontos = document.getElementById("input-pontos");
        if (inputPontos) {
          setTimeout(() => {
            inputPontos.focus();
            inputPontos.select(); // Seleciona o conteúdo para fácil substituição
          }, 100);
        }
      } else {
        // No portrait mobile: comportamento antigo (toggle)
        inputEdit.classList.toggle("edita-pontos-hidden");
        if (!inputEdit.classList.contains("edita-pontos-hidden")) {
          // Foca o input automaticamente
          const inputPontos = document.getElementById("input-pontos");
          if (inputPontos) {
            setTimeout(() => {
              inputPontos.focus();
              inputPontos.select(); // Seleciona o conteúdo para fácil substituição
            }, 100);
          }
        }
      }

      notie.alert({
        type: "info",
        text: "Modo Registro: O valor inserido será salvo.",
        time: 4,
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
      time: 5,
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
        time: 6,
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
    // Foca o input automaticamente com delay para garantir que funcione
    setTimeout(() => {
      inputPontos.focus();
      inputPontos.select(); // Seleciona o conteúdo para fácil digitação
    }, 100);
  }

  notie.alert({
    type: "info",
    text: "Modo Simulação Ativo. Insira um valor para recalcular as metas.",
    time: 8,
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
    time: 20,
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
  // Função desativada - botões agora estão no footer e sempre visíveis
  // A lógica de exibição é controlada pelo footer-nav
}

function solicitarBtnListerner() {
  const btnSolicitar = document.getElementById("btn-solicitar");
  const textareaObservacoes = document.getElementById("texterarea-obervacoes");

  if (btnSolicitar) {
    const newBtn = btnSolicitar.cloneNode(true);
    btnSolicitar.parentNode.replaceChild(newBtn, btnSolicitar);
    newBtn.addEventListener("click", () => {
      solicitarBonus();
    });
  }

  // Adiciona evento Enter no textarea
  if (textareaObservacoes) {
    textareaObservacoes.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        solicitarBonus();
      }
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
        text: "Trocar de usuário? (Seus dados NÃO serão perdidos)",
        submitText: `<i class="bi bi-check2-circle"></i>`,
        cancelText: `<i class="bi bi-ban"></i>`,
        submitCallback: () => {
          clearCurrentUser();

          // Exibir a tela de login e esconder o conteúdo principal
          const loginScreen = document.getElementById("login-screen");
          const mainContent = document.getElementById("main-content");
          const loginInput = document.getElementById("login-username");

          if (loginScreen) loginScreen.classList.remove("hidden");
          if (mainContent) mainContent.classList.add("hidden");

          // Limpa o input para novo nome
          if (loginInput) {
            loginInput.value = "";
            loginInput.focus();
          }

          // Reconfigura o botão de login
          configurarCadastro();

          notie.alert({
            type: "success",
            text: "✓ Sessão encerrada. Seus dados estão salvos.",
            time: 2,
          });
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
        text: "Trocar de usuário? (Seus dados NÃO serão perdidos)",
        submitText: `<i class="bi bi-check2-circle"></i>`,
        cancelText: `<i class="bi bi-ban"></i>`,
        submitCallback: () => {
          clearCurrentUser();
          const loginScreen = document.getElementById("login-screen");
          const mainContent = document.getElementById("main-content");
          const loginInput = document.getElementById("login-username");

          if (loginScreen) loginScreen.classList.remove("hidden");
          if (mainContent) mainContent.classList.add("hidden");

          if (loginInput) {
            loginInput.value = "";
            loginInput.focus();
          }

          notie.alert({
            type: "success",
            text: "✓ Sessão encerrada. Seus dados estão salvos.",
            time: 2,
          });
        },
      });
    });
  }
}

// =================================================================================
// LÓGICA DE TEMA (DARK/LIGHT MODE)
// =================================================================================

/**
 * Configura footer de navegação mobile
 */
function configurarFooterNav() {
  const btnPrincipal = document.getElementById("btn-principal");
  const footerNav = document.getElementById("footer-nav");
  const footerBackdrop = document.getElementById("footer-backdrop");
  const footerConfigBtn = document.getElementById("footer-config-btn");

  if (!btnPrincipal || !footerNav || !footerBackdrop) return;

  // Função para abrir footer
  const abrirFooter = () => {
    footerNav.classList.add("show");
    footerBackdrop.classList.add("show");
    btnPrincipal.classList.add("hide"); // Esconde o botão
  };

  // Função para fechar footer
  const fecharFooter = () => {
    footerNav.classList.remove("show");
    footerBackdrop.classList.remove("show");
    btnPrincipal.classList.remove("hide"); // Mostra o botão novamente
  };

  // Abrir footer ao clicar no btn-principal
  btnPrincipal.addEventListener("click", abrirFooter);

  // Fechar footer ao clicar no backdrop
  footerBackdrop.addEventListener("click", fecharFooter);

  // Configurações via footer
  footerConfigBtn?.addEventListener("click", () => {
    // Fecha o footer
    fecharFooter();

    // Abre modal de configurações
    const modal = document.getElementById("config-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  });

  // Fechar footer com tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && footerNav.classList.contains("show")) {
      fecharFooter();
    }
  });
}

/**
 * Configura modal de configurações flutuante
 */
function configurarModalConfig() {
  const btnFloat = document.getElementById("btn-config-float");
  const btnFooterConfig = document.getElementById("footer-config-btn");
  const modal = document.getElementById("config-modal");
  const btnClose = document.getElementById("btn-close-config");
  const toggleSom = document.getElementById("toggle-som");
  const toggleVibracao = document.getElementById("toggle-vibracao");
  const togglePush = document.getElementById("toggle-push");
  const btnTest = document.querySelector(".btn-test-feedback");

  if (!modal) return;

  // Carregar estados salvos
  const carregarEstados = () => {
    if (toggleSom) {
      toggleSom.checked = localStorage.getItem("feedbackSom") !== "false";
    }
    if (toggleVibracao) {
      toggleVibracao.checked =
        localStorage.getItem("feedbackVibracao") !== "false";
    }
    if (togglePush) {
      togglePush.checked = pushManager.permission === "granted";
      togglePush.disabled = pushManager.permission === "denied";
    }
  };

  carregarEstados();

  // Abrir modal - suporta ambos os botões
  const abrirModal = () => {
    modal.classList.remove("hidden");
    carregarEstados(); // Atualiza ao abrir
  };

  if (btnFloat) {
    btnFloat.addEventListener("click", abrirModal);
  }

  if (btnFooterConfig) {
    btnFooterConfig.addEventListener("click", abrirModal);
  }

  // Fechar modal
  const fecharModal = () => {
    modal.classList.add("hidden");
  };

  if (btnClose) {
    btnClose.addEventListener("click", fecharModal);
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });

  // ESC para fechar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      fecharModal();
    }
  });

  // Toggle Som
  toggleSom?.addEventListener("change", (e) => {
    localStorage.setItem("feedbackSom", e.target.checked.toString());
    import("./notifications.js").then(({ notificarInfo }) => {
      notificarInfo(
        `🔊 Sons ${e.target.checked ? "ativados" : "desativados"}`,
        2
      );
    });
  });

  // Toggle Vibração
  toggleVibracao?.addEventListener("change", (e) => {
    localStorage.setItem("feedbackVibracao", e.target.checked.toString());
    import("./notifications.js").then(({ notificarInfo }) => {
      notificarInfo(
        `📳 Vibração ${e.target.checked ? "ativada" : "desativada"}`,
        2
      );
    });
  });

  // Toggle Push
  togglePush?.addEventListener("change", async (e) => {
    if (e.target.checked) {
      const success = await pushManager.requestPermission();
      if (!success) {
        e.target.checked = false;
        import("./notifications.js").then(({ notificarErro }) => {
          notificarErro(
            "❌ Permissão negada. Ative nas configurações do navegador.",
            4
          );
        });
      } else {
        import("./notifications.js").then(({ notificarSucesso }) => {
          notificarSucesso("✅ Notificações ativadas!", 3);
        });
      }
    }
  });

  // Testar feedback
  btnTest?.addEventListener("click", () => {
    import("./notifications.js").then(({ notificarSucesso }) => {
      notificarSucesso("🎉 Teste de feedback sensorial completo!");
    });
  });
}

function carregarTema() {
  const temaSalvo = localStorage.getItem("tema") || "light";
  document.documentElement.setAttribute("data-theme", temaSalvo);
  // Atualiza ícone quando DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      atualizarIconeTema(temaSalvo)
    );
  } else {
    atualizarIconeTema(temaSalvo);
  }
}

function configurarToggleTema() {
  const toggleButton = document.getElementById("theme-toggle");
  if (toggleButton) {
    // Atualiza ícone inicial
    const temaAtual = document.documentElement.getAttribute("data-theme");
    atualizarIconeTema(temaAtual);

    toggleButton.addEventListener("click", () => {
      let temaAtual = document.documentElement.getAttribute("data-theme");
      const novoTema = temaAtual === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", novoTema);
      localStorage.setItem("tema", novoTema);
      atualizarIconeTema(novoTema);
    });
  }

  // Modal de configurações flutuante
  configurarModalConfig();

  // Footer de navegação mobile
  configurarFooterNav();

  // Painel desktop
  configurarDesktopPanel();
}

/**
 * Configura painel lateral desktop (apenas >768px)
 */
function configurarDesktopPanel() {
  // Só inicializar em desktop
  if (window.innerWidth <= 768) {
    console.log("Desktop panel: largura menor que 768px, não inicializado");
    return;
  }

  const configBtn = document.getElementById("desktop-config-btn");
  const logoutBtn = document.getElementById("desktop-logout-btn");
  const panel = document.querySelector(".desktop-config-panel");
  const backdrop = document.querySelector(".desktop-panel-backdrop");
  const closeBtn = document.querySelector(".panel-close-btn");

  console.log("Desktop panel elementos:", {
    configBtn,
    logoutBtn,
    panel,
    backdrop,
    closeBtn,
  });

  if (!configBtn || !panel || !backdrop || !closeBtn) {
    console.error("Desktop panel: elementos não encontrados");
    return;
  }

  console.log("Desktop panel: inicializado com sucesso");

  let isOpen = false;

  // Abrir painel
  const openPanel = () => {
    console.log("Desktop panel: abrindo painel");
    isOpen = true;
    panel.classList.add("show");
    backdrop.classList.add("show");
    console.log("Desktop panel: classes 'show' adicionadas");
  };

  // Fechar painel
  const closePanel = () => {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("show");
    backdrop.classList.remove("show");
  };

  // Click no botão config
  configBtn.addEventListener("click", openPanel);

  // Click no botão fechar
  closeBtn.addEventListener("click", closePanel);

  // Click no backdrop
  backdrop.addEventListener("click", closePanel);

  // ESC fecha painel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closePanel();
    }
  });

  // Botão logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const btnLogout = document.getElementById("btn-logout");
      if (btnLogout) {
        btnLogout.click();
      }
    });
  }

  // Sincronizar toggles com configurações mobile
  const syncToggles = () => {
    const desktopSom = document.getElementById("desktop-toggle-som");
    const desktopVibracao = document.getElementById("desktop-toggle-vibracao");
    const desktopPush = document.getElementById("desktop-toggle-push");

    const mobileSom = document.getElementById("toggle-som");
    const mobileVibracao = document.getElementById("toggle-vibracao");
    const mobilePush = document.getElementById("toggle-push");

    if (desktopSom && mobileSom) {
      desktopSom.checked = mobileSom.checked;
      desktopSom.addEventListener("change", () => {
        mobileSom.checked = desktopSom.checked;
        mobileSom.dispatchEvent(new Event("change"));
      });
    }

    if (desktopVibracao && mobileVibracao) {
      desktopVibracao.checked = mobileVibracao.checked;
      desktopVibracao.addEventListener("change", () => {
        mobileVibracao.checked = desktopVibracao.checked;
        mobileVibracao.dispatchEvent(new Event("change"));
      });
    }

    if (desktopPush && mobilePush) {
      desktopPush.checked = mobilePush.checked;
      desktopPush.addEventListener("change", () => {
        mobilePush.checked = desktopPush.checked;
        mobilePush.dispatchEvent(new Event("change"));
      });
    }
  };

  syncToggles();

  // Re-inicializar em resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 768 && isOpen) {
        closePanel();
      }
    }, 250);
  });
}

/**
 * Mostra lista de notificações não lidas
 */
function showNotificationsList() {
  const notifications = pushManager
    .getUnreadNotifications()
    .filter((n) => !n.read);

  if (notifications.length === 0) {
    notie.alert({
      type: "info",
      text: `<i class="bi bi-chat-square"></i> Você não tem notificações não lidas.`,
      time: 2,
    });
    return;
  }

  // Ordena por mais recente
  notifications.sort((a, b) => b.timestamp - a.timestamp);

  // Monta HTML da lista
  let html = `
    <div style="max-height: 400px; overflow-y: auto; padding: 1rem;">
      <h3 style="margin: 0 0 1rem 0; color: #fff; font-size: 1.2rem;">
        <i class="bi bi-chat-text"></i> Notificações (${notifications.length})
      </h3>
  `;

  notifications.slice(0, 10).forEach((notif) => {
    const date = new Date(notif.timestamp);
    const timeStr = date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `
      <div style="
        background: rgba(255,255,255,0.15); 
        padding: 1rem; 
        margin-bottom: 0.8rem; 
        border-radius: 0.5rem;
        border-left: 3px solid #ffa726;
      ">
        <div style="font-weight: bold; margin-bottom: 0.3rem; color: #ffa726;">
          ${notif.title}
        </div>
        <div style="font-size: 1.3rem; margin-bottom: 0.5rem; color: rgba(255,255,255,0.9);">
          ${notif.body}
        </div>
        <div style="font-size: 1.1rem; color: rgba(255,255,255,0.6);">
          ${timeStr}
        </div>
      </div>
    `;
  });

  html += `</div>`;

  notie.confirm({
    text: html,
    submitText: `<i class="bi bi-check2-circle"></i>`,
    cancelText: `<i class="bi bi-ban"></i>`,
    submitCallback: () => {
      pushManager.markAllAsRead();
      notie.alert({
        type: "success",
        text: "✓ Todas as notificações foram marcadas como lidas",
        time: 2,
      });
    },
  });
}

// Responsive mode: toggles visibility/behavior between mobile and desktop widths
function setupResponsiveMode() {
  const mq = window.matchMedia("(max-width: 768px)");

  function applyMode(m) {
    const isMobile = m.matches;
    const btnPrincipal = document.getElementById("btn-principal");
    const inputContainer = document.getElementById("edita-pontos");
    const inputPontosElement = document.getElementById("input-pontos");

    // Mobile: botões estão no footer (sempre acessíveis), input escondido por padrão
    if (isMobile) {
      if (btnPrincipal) btnPrincipal.classList.remove("hidden");
      if (inputContainer) inputContainer.classList.add("edita-pontos-hidden");
      if (inputPontosElement) {
        inputPontosElement.placeholder = ""; // no hint on mobile (keeps compact)
      }
    } else {
      // Desktop / landscape: esconde btn-principal (footer não aparece), mostra input sempre
      if (btnPrincipal) btnPrincipal.classList.add("hidden");
      if (inputContainer)
        inputContainer.classList.remove("edita-pontos-hidden");
      // On desktop we default to simulation mode (desktop users simulate more often)
      modoAtual = "simulacao";
      if (inputPontosElement) {
        inputPontosElement.placeholder =
          "Enter →Simular · Ctrl+Enter→ Registrar";
      }
    }
  }

  // Initial apply
  applyMode(mq);

  // Listen for changes
  mq.addEventListener("change", (e) => applyMode(e));
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

// ============================================================================
// SINCRONIZAÇÃO ENTRE ABAS
// ============================================================================

/**
 * 🛡️ PROTEÇÃO: Sincroniza dados entre múltiplas abas
 * Detecta mudanças no localStorage feitas por outras abas e atualiza a UI
 */
function configurarSincronizacaoAbas() {
  window.addEventListener("storage", (evento) => {
    const chaveAtual = `${STORAGE_PREFIX}${localStorage.getItem(
      "currentUser"
    )}`;

    // Ignora eventos de outras chaves
    if (evento.key !== chaveAtual) return;

    // Detecta mudança no localStorage de outra aba
    if (evento.newValue) {
      sincronizarDadosDeOutraAba(evento.newValue);
    } else {
      // Dados foram removidos (logout em outra aba)
      tratarLogoutEmOutraAba();
    }
  });

  debugLog("✅ Sincronização entre abas ativada");
}

/**
 * Sincroniza dados quando outra aba faz alterações
 * @param {string} novosValorJSON - JSON com novos dados
 */
function sincronizarDadosDeOutraAba(novosValorJSON) {
  try {
    const novosDados = JSON.parse(novosValorJSON);
    console.log("🔄 Dados atualizados de outra aba");

    // Verifica se há usuário logado nesta aba
    const mainContent = document.getElementById("main-content");
    if (!mainContent || mainContent.classList.contains("hidden")) {
      console.log("⏭️ Aba está na tela de login, ignorando sincronização");
      return;
    }

    // Atualizar cache local
    atualizarDadosUsuario(novosDados);

    // Atualizar TODA a UI usando dados centralizados (não localStorage)
    atualizarTodaUI(novosDados);

    // Notificar usuário
    notificarSincronizado();
  } catch (error) {
    console.error("❌ Erro ao sincronizar dados:", error);
  }
}

/**
 * Trata logout realizado em outra aba
 */
function tratarLogoutEmOutraAba() {
  console.log("🚪 Sessão encerrada em outra aba");

  notificarInfo("⚠️ Sessão encerrada. Recarregando...", 2);

  setTimeout(() => location.reload(), 2000);
}

// ============================================================================
// FUNÇÕES GLOBAIS PARA DEMONSTRAÇÃO
// ============================================================================
// Expõe funções no console para facilitar apresentações
// Uso rápido: window.carregarDemo()

/**
 * Carrega dados fictícios completos para apresentação
 * Usuário: yvenson | Histórico: 3 meses | Observações: 5
 *
 * ATENÇÃO: Sobrescreve dados existentes!
 *
 * @returns {boolean} true se carregado com sucesso
 */
window.carregarDemo = function () {
  console.clear();
  console.log(
    "%c🎬 CARREGANDO DADOS DE DEMONSTRAÇÃO",
    "color: #007bff; font-size: 20px; font-weight: bold"
  );
  console.log(
    "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "color: #007bff"
  );

  const sucesso = carregarDadosDemo();

  if (sucesso) {
    console.log(
      "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "color: #28a745"
    );
    console.log(
      "%c✅ PRONTO PARA APRESENTAÇÃO!",
      "color: #28a745; font-size: 18px; font-weight: bold"
    );
    console.log(
      "%cRecarregue a página para ver os dados (F5)",
      "color: #ffc107; font-size: 14px"
    );
  }

  return sucesso;
};

/**
 * Remove dados de demonstração e volta ao estado inicial
 *
 * @returns {boolean} true se removido com sucesso
 */
window.limparDemo = function () {
  console.clear();
  console.log(
    "%c🧹 LIMPANDO DADOS DE DEMONSTRAÇÃO",
    "color: #dc3545; font-size: 18px; font-weight: bold"
  );

  const sucesso = limparDadosDemo();

  if (sucesso) {
    console.log(
      "%c✅ Dados removidos! Recarregue para começar do zero.",
      "color: #28a745; font-size: 14px"
    );
  }

  return sucesso;
};

/**
 * Exibe informações detalhadas sobre os dados demo
 */
window.infoDemo = function () {
  console.clear();
  infoDadosDemo();
};

// Mensagem de boas-vindas no console (apenas em desenvolvimento)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  debugLog(
    "%c💡 COMANDOS DE DEMONSTRAÇÃO DISPONÍVEIS",
    "color: #ffc107; font-size: 16px; font-weight: bold"
  );
  debugLog("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #6c757d");
  debugLog(
    "%cwindow.carregarDemo()%c → Carregar dados completos (yvenson)",
    "color: #007bff; font-weight: bold",
    "color: #6c757d"
  );
  debugLog(
    "%cwindow.limparDemo()%c   → Remover dados demo",
    "color: #dc3545; font-weight: bold",
    "color: #6c757d"
  );
  debugLog(
    "%cwindow.infoDemo()%c     → Ver estatísticas dos dados",
    "color: #28a745; font-weight: bold",
    "color: #6c757d"
  );
  debugLog("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #6c757d");
}

// ============================================================================
// SCROLL PARA OBSERVAÇÕES
// ============================================================================

/**
 * Configura botão flutuante para scroll até campo de observações
 */
function configurarScrollParaObservacoes() {
  const scrollBtn = document.getElementById("scroll-to-obs-btn");
  const obsTextarea = document.getElementById("texterarea-obervacoes");
  const modal = document.getElementById("historico-modal");

  if (!scrollBtn || !obsTextarea) {
    return;
  }

  // Função para verificar se o textarea está visível na viewport do modal
  function isTextareaVisible() {
    if (!modal || modal.style.display === "none") return false;

    const modalRect = modal.getBoundingClientRect();
    const textareaRect = obsTextarea.getBoundingClientRect();

    // Verifica se o textarea está dentro da área visível do modal
    const isVisible =
      textareaRect.top >= modalRect.top &&
      textareaRect.bottom <= modalRect.bottom + 200; // 200px de tolerância

    return isVisible;
  }

  // Atualizar visibilidade do botão
  function updateButtonVisibility() {
    // Verificar se seção de previsões está aberta
    const predictionsSection = document.getElementById("predictions-section");
    const predictionsAberta =
      predictionsSection && !predictionsSection.classList.contains("hidden");

    if (predictionsAberta) {
      // Seção de previsões aberta = esconder botão
      scrollBtn.classList.add("hidden");
      return;
    }

    // Verificar se modal está aberto (usa classe modal-backdrop-hidden)
    const modalAberto =
      modal && !modal.classList.contains("modal-backdrop-hidden");
    const textareaVisivel = isTextareaVisible();

    if (!modalAberto) {
      // Modal fechado = esconder botão
      scrollBtn.classList.add("hidden");
      return;
    }

    // Modal aberto: mostrar/esconder baseado na visibilidade do textarea
    if (textareaVisivel) {
      scrollBtn.classList.add("hidden");
    } else {
      scrollBtn.classList.remove("hidden");
    }
  }

  // Scroll suave até o textarea
  scrollBtn.addEventListener("click", () => {
    obsTextarea.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Focar no textarea após o scroll
    setTimeout(() => {
      obsTextarea.focus();
      updateButtonVisibility();
    }, 500);
  });

  // Verificar visibilidade no scroll do modal
  if (modal) {
    modal.addEventListener("scroll", updateButtonVisibility);
  }

  // Observer para detectar mudanças no modal (abrir/fechar)
  const observer = new MutationObserver(() => {
    setTimeout(updateButtonVisibility, 100);
  });

  if (modal) {
    observer.observe(modal, {
      attributes: true,
      attributeFilter: ["style"],
    });
  }

  // Verificar visibilidade inicial
  setTimeout(updateButtonVisibility, 200);
}

// ============================================================================
// NAVEGAÇÃO ANÁLISES E PREVISÕES
// ============================================================================

/**
 * Configura navegação para seção de análises
 */
function configurarNavegacaoAnalises() {
  const btnAbrir = document.getElementById("btn-abrir-predictions");
  const btnVoltar = document.getElementById("btn-voltar-predictions");
  const section = document.getElementById("predictions-section");

  if (!btnAbrir || !section) return;

  // Abrir seção de análises
  btnAbrir.addEventListener("click", () => {
    // Fechar modal de histórico se estiver aberto
    const modalHistorico = document.getElementById("historico-modal");
    if (
      modalHistorico &&
      !modalHistorico.classList.contains("modal-backdrop-hidden")
    ) {
      modalHistorico.classList.add("modal-backdrop-hidden");
    }

    // Mostrar seção com skeleton
    section.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    const container = document.getElementById("predictions-container");
    if (container) {
      mostrarSkeleton(container, 4); // 4 cards skeleton
    }

    // Renderizar análises de forma assíncrona para não bloquear UI
    setTimeout(() => {
      renderizarAnalises();
    }, 50);

    // Esconder botão de scroll
    const scrollBtn = document.getElementById("scroll-to-obs-btn");
    if (scrollBtn) scrollBtn.classList.add("hidden");
  });

  // Função para fechar seção de previsões
  function fecharPrevisoes() {
    section.classList.add("hidden");
    document.body.style.overflow = "";
    document.body.style.overflowX = "";
    document.body.style.overflowY = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }

  // Fechar seção de análises
  if (btnVoltar) {
    btnVoltar.addEventListener("click", fecharPrevisoes);
  }

  // Fechar com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !section.classList.contains("hidden")) {
      fecharPrevisoes();
    }
  });
}

// Service worker / PWA offline support removed per user request.
// Registration and manifest were deleted to disable offline mode.

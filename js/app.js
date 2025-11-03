// js/app.js

const notie = window.notie;

import {
  // getChaveDadosUsuario, // Não é mais necessária aqui
  salvarDados,
  criarDadosIniciais,
  carregarDados,
  MAPA_METAS,
} from "./data.js";

// CORREÇÃO 1: Renomear a função no import para o nome correto
import {
  calcularEAtualizarDashboard,
  atualizarGraficoCircular,
  calcularMediaSemanal,
} from "./calc.js";

// Importar a função de atualização do gráfico
let modoAtual = "registro";

let dadosUsuario = null;

document.addEventListener("DOMContentLoaded", () => {
  dadosUsuario = carregarDados();
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

  // --- LÓGICA DE VALIDAÇÃO ---
  const regex = /^(?!.*(.)\1{2})[A-Za-z\u00C0-\u00Ff]{3,10}$/i;

  if (!regex.test(nomeFuncionario)) {
    notie.alert({
      type: "error",
      text: "Por favor, digite um nome valído e legível (3 a 10 letras, sem repetição tripla).",
      time: 4,
    });
    return;
  }

  if (metaValorString === "none") {
    notie.alert({
      type: "error",
      text: "Opa!, você esqueceu de selecionar uma meta válida.",
      time: 3,
    });
    return;
  }

  // --- LÓGICA CRÍTICA DE SALVAMENTO (PRIMEIRO LOGIN) ---

  // 1. CRIAÇÃO do novo objeto de dados
  dadosUsuario = criarDadosIniciais(nomeFuncionario, metaValorString);

  // 2. SALVAMENTO do objeto no data.js (localStorage)
  salvarDados(dadosUsuario);

  // 3. INÍCIO do Dashboard
  iniciarDashboard(nomeFuncionario);
}

function iniciarDashboard(nome) {
  // Se estivermos em um login automático ou se a variável global não estiver pronta,
  // garantimos o carregamento. No primeiro login, 'dadosUsuario' já estará pronto.
  if (!dadosUsuario) {
    dadosUsuario = carregarDados();
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
  userName.innerHTML = `<i class="bi bi-person-badge-fill"></i>${nomeFinal}`;
  metaData.classList.replace("meta-data-hidden", "meta-data");

  // 5. ATIVAÇÃO DO BOTÃO DE EDIÇÃO
  ativarBotaoEdit();
  ativarListenerMeta();
  configurarLimiteInput();
  configurarMoodalHistorico();
  editoresBtnsListerner();

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
  const PontotalElement = document.getElementById("ponto-total");
  if (PontotalElement) {
    const pontoTotal = dadosUsuario.realizadoTotal;

    const pontoFormatado = pontoTotal.toLocaleString("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    PontotalElement.textContent = pontoFormatado;
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
  }
  // 2. Dias Restantes
  const diasRestantesElement = document.getElementById("dias-restante");
  if (diasRestantesElement) {
    diasRestantesElement.textContent = resultados.diasUteisRestantes;
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

  // Decide o que fazer com base no modo atual
  if (modoAtual === "registro") {
    // --- Lógica de REGISTRO (movida de resgistrarDadosDiaria) ---
    let hoje = new Date();

    // Verifica se é fim de semana
    const diaDaSemana = hoje.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaDaSemana === 0 || diaDaSemana === 6) {
      notie.alert({
        type: "warning",
        text: "Fim de semana! Só é possível registrar pontos em dias úteis.",
        time: 4,
      });
      return;
    }

    let dataHojeKey =
      hoje.getFullYear() +
      "-" +
      String(hoje.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(hoje.getDate()).padStart(2, "0");

    if (pontoAdicionado < 100) {
      notie.alert({
        type: "error",
        text: "Para registro, o valor deve ser maior que 100.",
        time: 2,
      });
      return;
    }

    if (dadosUsuario.realizadoDiario[dataHojeKey]) {
      notie.alert({
        type: "error",
        text: "Registro bloqueado: O total de pontos para hoje já foi inserido.",
        time: 4,
      });
      document
        .getElementById("edita-pontos")
        .classList.add("edita-pontos-hidden");
      return;
    }

    dadosUsuario.realizadoDiario[dataHojeKey] = pontoAdicionado;
    dadosUsuario.realizadoTotal += pontoAdicionado;

    salvarDados(dadosUsuario);
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

      const novaMetaMensal = MAPA_METAS[metaAlterada];
      dadosUsuario.metaMensal = novaMetaMensal;
      salvarDados(dadosUsuario);
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
      if (this.value.length > 5) {
        this.value = this.value.slice(0, 5);
      }
    });
  }
}

function gerarHistoricoDetalhado(realizadoDiario) {
  const listaElement = document.getElementById("historico-lista");
  let htmlContent = "";
  if (realizadoDiario && Object.keys(realizadoDiario).length > 0) {
    const dataOrdenadas = Object.keys(realizadoDiario).sort().reverse();
    const ultimos5Dias = dataOrdenadas.slice(0, 5);

    ultimos5Dias.forEach((dataKey, index) => {
      const valor = realizadoDiario[dataKey];
      const valorFormatado = valor.toLocaleString("pt-BR", {
        style: "decimal",
      });
      const dataReduzida = dataKey.slice(5);
      const liId = `historico-item-${index}`;

      htmlContent += `
        <li class="historico-item-card position-relative" id="${liId}">
            <div class="historico-item-data" id="display-container-${liId}">
                <span class="card-data-valor">
                    ${dataReduzida} : ${valorFormatado} pontos
                </span>
                <button class="btn-corrigir btn btn-sm btn-light" data-li-id="${liId}" aria-label="Corrigir Registro">
                    <i class="bi bi-pencil"></i>
                </button>
            </div>
            <div class="edicao-in-place edita-pontos-hidden" id="edicao-${liId}" data-valor-antigo="${valor}" data-date-key="${dataKey}">
                <input type="number" value="${valor}" class="form-control  input-correcao">

                <div class="edit-botoes">
                <button class="btn btn-success btn-sm btn-salvar-correcao" aria-label="Salvar Correção">
                    <i class="bi bi-check-circle-fill"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-cancelar-correcao" aria-label="Cancelar Correção">
                    <i class="bi bi-x-lg"></i>
                </button>
                </div>
            </div>
        </li>
      `;
    });
  }

  listaElement.innerHTML =
    htmlContent ||
    '<li class="list-group-item">Nenhum registro encontrado.</li>';

  // Anexa os listeners depois que o HTML foi criado
  ligarListenersDeCorrecao();
  configurarListenersEdicaoInPlace();
}

function abrirModalHistorico() {
  if (!dadosUsuario) {
    dadosUsuario = carregarDados();
  }

  const mediaElement = document.getElementById("media-semanal");
  if (mediaElement) {
    const realizadoDiario = dadosUsuario.realizadoDiario;
    if (realizadoDiario && Object.keys(realizadoDiario).length > 0) {
      const media = calcularMediaSemanal(realizadoDiario);
      mediaElement.textContent = media.toLocaleString("pt-BR", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      mediaElement.textContent = "N/A";
    }
  }

  // Esta função agora também anexa os listeners
  gerarHistoricoDetalhado(dadosUsuario.realizadoDiario);

  const modal = document.getElementById("historico-modal");
  if (modal) {
    modal.classList.replace("modal-backdrop-hidden", "modal-backdrop");
    document.querySelector("main > section").classList.add("section-modal-open");
  }
}

function configurarMoodalHistorico() {
  const btnAbrir = document.getElementById("btn-abrir-historico");
  const btnFechar = document.getElementById("btn-fechar-historico");
  const modal = document.getElementById("historico-modal");

  if (btnAbrir) {
    btnAbrir.addEventListener("click", abrirModalHistorico);
  }

  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      modal.classList.replace("modal-backdrop", "modal-backdrop-hidden");
      document.querySelector("main > section").classList.remove("section-modal-open");
    });
  }
}

function chamarCorrecao(btn) {
  const liId = btn.getAttribute("data-li-id");
  const edicaoDiv = document.getElementById(`edicao-${liId}`);
  const displayContainer = document.getElementById(`display-container-${liId}`);

  if (edicaoDiv && displayContainer) {
    displayContainer.classList.add("edita-pontos-hidden");
    edicaoDiv.classList.remove("edita-pontos-hidden");

    const inputElement = edicaoDiv.querySelector(".input-correcao");
    if (inputElement) {
      inputElement.focus();
    }
  }
}

function corrigirRegistro(dataKey, novoValor, valorAntigo) {
  const diferenca = novoValor - valorAntigo;
  dadosUsuario.realizadoTotal += diferenca;
  dadosUsuario.realizadoDiario[dataKey] = novoValor;
  salvarDados(dadosUsuario);

  notie.alert({
    type: "success",
    text: `Registro de ${dataKey} corrigido com sucesso!`,
    time: 3,
  });

  // Redesenha o histórico para mostrar o valor atualizado e resetar a UI
  gerarHistoricoDetalhado(dadosUsuario.realizadoDiario);
  // Atualiza o dashboard principal
  iniciarDashboard(null); // Passa null para não exibir a mensagem de boas-vindas
}

function ligarListenersDeCorrecao() {
  document.querySelectorAll(".btn-corrigir").forEach((btn) => {
    // Clona e substitui o botão para remover listeners antigos e evitar duplicação
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", (e) => {
      const clickedButton = e.currentTarget;

      // VERIFICAÇÃO 1: Bloquear edições durante o fim de semana.
      const hoje = new Date();
      const diaDaSemana = hoje.getDay();
      if (diaDaSemana === 0 || diaDaSemana === 6) {
        notie.alert({
          type: "warning",
          text: "Não é possível corrigir registros durante o fim de semana.",
          time: 4,
        });
        return;
      }

      // VERIFICAÇÃO 2: Permitir edição apenas no último registro.
      const liId = clickedButton.getAttribute("data-li-id");
      const edicaoDiv = document.getElementById(`edicao-${liId}`);
      const dataKeyDoItem = edicaoDiv.getAttribute("data-date-key");

      // Pega a lista de todos os registros e a ordena do mais novo para o mais antigo.
      const dataOrdenadas = Object.keys(dadosUsuario.realizadoDiario)
        .sort()
        .reverse();
      const ultimoRegistroDataKey =
        dataOrdenadas.length > 0 ? dataOrdenadas[0] : null;

      if (dataKeyDoItem !== ultimoRegistroDataKey) {
        notie.alert({
          type: "error",
          text: "Apenas o último registro pode ser corrigido para manter a consistência dos dados.",
          time: 4,
        });
        return;
      }

      // Se todas as verificações passarem, prossiga para a edição.
      chamarCorrecao(clickedButton);
    });
  });
}

function configurarListenersEdicaoInPlace() {
  document.querySelectorAll(".btn-salvar-correcao").forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", (e) => {
      const edicaoDiv = e.currentTarget.closest(".edicao-in-place");
      const dataKey = edicaoDiv.getAttribute("data-date-key");
      const valorAntigo = Number(edicaoDiv.getAttribute("data-valor-antigo"));
      const inputNovoValor = edicaoDiv.querySelector(".input-correcao");
      const novoValor = Number(inputNovoValor.value);

      if (isNaN(novoValor) || novoValor < 0) {
        notie.alert({ type: "error", text: "Valor inválido.", time: 2 });
        return;
      }

      if (novoValor === valorAntigo) {
        notie.alert({
          type: "warning",
          text: "Ops!!! esse valor já foi registrado",
          time: 2,
        });
        return;
      }
      corrigirRegistro(dataKey, novoValor, valorAntigo);
    });
  });

  document.querySelectorAll(".btn-cancelar-correcao").forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", (e) => {
      const edicaoDiv = e.currentTarget.closest(".edicao-in-place");
      ocultarEdicaoInPlace(edicaoDiv);
    });
  });
}

function ocultarEdicaoInPlace(edicaoDiv) {
  edicaoDiv.classList.add("edita-pontos-hidden");

  const liContainer = edicaoDiv.closest(".historico-item-card");
  const displayContainer = liContainer
    ? liContainer.querySelector("[id^=display-container-]")
    : null;

  if (displayContainer) {
    displayContainer.classList.remove("edita-pontos-hidden");
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
  const dadosSimulados = {
    nome: dadosUsuario.nome, // Mantém o nome para consistência
    metaMensal: dadosUsuario.metaMensal,
    realizadoDiario: {},
    realizadoTotal: pontoAdicionado,
  };

  const resultadoSimulado = calcularEAtualizarDashboard(dadosSimulados);

  // --- ATUALIZAÇÃO VISUAL COMPLETA ---
  const dadosOriginais = dadosUsuario; // Salva os dados reais
  dadosUsuario = dadosSimulados; // Troca temporariamente para os dados simulados
  atualizarUIDashboard(resultadoSimulado); // Atualiza TODA a UI com os dados da simulação
  dadosUsuario = dadosOriginais; // Restaura os dados reais para o resto da lógica
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

function alternarDisplay(element) {
  element.classList.toggle("hidden");
}

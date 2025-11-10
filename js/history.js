// js/history.js

import {
  destacarElemento,
  ocultarEdicaoInPlace,
  chamarCorrecao,
} from "./ui.js";
import { calcularMediaSemanal } from "./calc.js";
import { getDadosUsuario, atualizarDadosUsuario, salvarDados } from "./data.js";
import { validarEdicao } from "./validation.js";
import { iniciarDashboard } from "./app.js";

function carregarDadosHistorico() {
  const dadosUsuario = getDadosUsuario();

  if (dadosUsuario) {
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
        destacarElemento("media-semanal");
      } else {
        mediaElement.textContent = "N/A";
      }
    }

    gerarHistoricoDetalhado(dadosUsuario.realizadoDiario);
  }
}

function gerarHistoricoDetalhado(realizadoDiario) {
  const listaElement = document.getElementById("historico-lista");
  let htmlContent = "";
  const hoje = new Date();
  const dataKeys = [];
  let diasUteisAdicionados = 0;
  for (let i = 0; diasUteisAdicionados < 5; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    const diaSemana = data.getDay();

    // Apenas dias úteis (Segunda a Sexta)
    if (diaSemana !== 0 && diaSemana !== 6) {
      const dataKey =
        data.getFullYear() +
        "-" +
        String(data.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(data.getDate()).padStart(2, "0");
      dataKeys.push(dataKey);
      diasUteisAdicionados++;
    }
  }

  if (realizadoDiario) {
    dataKeys.forEach((dataKey, index) => {
      const valor = realizadoDiario[dataKey];
      const data = new Date(dataKey + "T00:00:00");
      const diaSemana = data.getDay();
      const diaDoMes = data.getDate();
      const isWeekend = diaSemana === 0 || diaSemana === 6; // Domingo (0) e Sábado (6)
      const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const nomeDiaSemana = `${diasDaSemana[diaSemana]} ${diaDoMes}`;

      const liId = `historico-item-${index}`;

      let isEditable = false;
      if (valor) {
        const hojeDataKey =
          hoje.getFullYear() +
          "-" +
          String(hoje.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(hoje.getDate()).padStart(2, "0");
        const ultimoRegistroDataKey = Object.keys(realizadoDiario)
          .sort()
          .reverse()[0];
        isEditable =
          dataKey === ultimoRegistroDataKey && dataKey === hojeDataKey;
      } else {
        isEditable = !isWeekend;
      }

      htmlContent += `
                <li class="historico-item-card position-relative" id="${liId}">
                    <div class="historico-item-data" id="display-container-${liId}">
                        <span class="card-data-valor">
                            <strong>${nomeDiaSemana}</strong> : ${
        valor
          ? valor.toLocaleString("pt-BR", { style: "decimal" }) + " pontos"
          : "registro não fornecido"
      }
                        </span>
                        ${
                          isEditable
                            ? `
                        <button class="btn-corrigir btn btn-sm btn-light" data-li-id="${liId}" aria-label="Corrigir Registro">
                            <strong><i class="bi bi-pencil"></i></strong>
                        </button>
                        `
                            : ""
                        }
                    </div>
                    <div class="edicao-in-place edita-pontos-hidden" id="edicao-${liId}" data-valor-antigo="${
        valor || ""
      }" data-date-key="${dataKey}">
                        <input type="number" value="${
                          valor || ""
                        }" class="form-control input-correcao" placeholder="Insira o valor">
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
  
  // REMOVIDO: Listeners antigos.
  // A delegação de eventos substitui a necessidade de ligar/desligar listeners.
}

export function abrirModalHistorico() {
  carregarDadosHistorico();

  const modal = document.getElementById("historico-modal");
  if (modal) {
    modal.classList.replace("modal-backdrop-hidden", "modal-backdrop");
    document
      .querySelector("main > section")
      .classList.add("section-modal-open");
  }
}

export function configurarModalHistorico() {
  const btnAbrir = document.getElementById("btn-abrir-historico");
  const btnFechar = document.getElementById("btn-fechar-historico");
  const modal = document.getElementById("historico-modal");

  // NOVO: Centralizando os listeners do modal com delegação de eventos.
  const listaHistorico = document.getElementById("historico-lista");
  if (listaHistorico) listaHistorico.addEventListener("click", handleHistoricoClick);

  if (btnAbrir) {
    btnAbrir.addEventListener("click", abrirModalHistorico);
  }

  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      modal.classList.replace("modal-backdrop", "modal-backdrop-hidden");
      document
        .querySelector("main > section")
        .classList.remove("section-modal-open");
    });
  }
}

function corrigirRegistro(dataKey, novoValor, valorAntigo, liId) {
  const dadosUsuario = getDadosUsuario();
  const diferenca = valorAntigo ? novoValor - valorAntigo : novoValor;
  dadosUsuario.realizadoTotal += diferenca;
  dadosUsuario.realizadoDiario[dataKey] = novoValor;
  atualizarDadosUsuario(dadosUsuario);

  const data = new Date(dataKey + "T00:00:00");
  const diasDaSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const nomeDiaSemana = diasDaSemana[data.getDay()];

  notie.alert({
    type: "success",
    text: `Registro de ${nomeDiaSemana} corrigido com sucesso!`,
    time: 3,
  });

  // MELHORIA DE UX: Atualiza o item específico em vez de recarregar a lista inteira.
  atualizarItemHistoricoUI(liId, novoValor, nomeDiaSemana);
  // Atualiza o dashboard principal
  iniciarDashboard(null); // Passa null para não exibir a mensagem de boas-vindas
}

/**
 * Processa o texto de observação em busca de comandos específicos usando uma abordagem baseada em regras.
 * @param {string} obsText O texto a ser processado.
 * @returns {{totalBonus: number, agendamentoOff: string|null, limparDados: boolean, remocaoAgendamento: string|null}}
 */
function processarObservacao(obsText) {
  const resultados = {
    totalBonus: 0,
    agendamentoOff: null,
    limparDados: false,
    remocaoAgendamento: null,
  };

  const regrasDeComando = [
    {
      regex: /ajudar\s*no\s*recebimento/g,
      processar: (match, res) => { res.totalBonus += 100; },
    },
    {
      regex: /outro\s*sector\s*#?(\d+)/g,
      processar: (match, res) => { res.totalBonus += Number(match[1]) || 0; },
    },
    {
      regex: /(?:feriado|aniversário)\s*(\d{2}\/\d{2}\/\d{4})/gi,
      processar: (match, res) => { res.agendamentoOff = match[1]; },
    },
    {
      regex: /(?:remover|cancelar|excluir)\s*(?:feriado|aniversário|agendamento)?\s*(\d{2}\/\d{2}\/\d{4})/gi,
      processar: (match, res) => { res.remocaoAgendamento = match[1]; },
    },
    {
      regex: /limpar\s*dados/i,
      processar: (match, res) => { res.limparDados = true; },
    },
  ];

  regrasDeComando.forEach(regra => {
    // Para regex com a flag 'g', usamos um loop. Para as outras, um simples 'exec'.
    if (regra.regex.global) {
      let match;
      while ((match = regra.regex.exec(obsText)) !== null) {
        regra.processar(match, resultados);
      }
    } else {
      const match = regra.regex.exec(obsText);
      if (match) {
        regra.processar(match, resultados);
      }
    }
  });

  return resultados;
}

export function solicitarBonus() {
  const dadosusuario = getDadosUsuario();

  if (!dadosusuario) {
    notie.alert({
      type: "error",
      text: "Dados do usuário não encontrados. Por favor, configure seu perfil primeiro.",
      time: 4,
    });
    return;
  }

  const observacoes = document
    .getElementById("texterarea-obervacoes")
    .value.trim();

  if (!observacoes) {
    notie.alert({
      type: "info",
      text: "Nenhuma observação inserida.",
      time: 2,
    });
    return;
  }

  const resultadoDosProcessamentos = processarObservacao(observacoes);

  if (resultadoDosProcessamentos.limparDados) {
    notie.confirm({
      text: "Você tem certeza que deseja limpar todos os seus dados? Esta ação não pode ser desfeita.",
      submitText: "Sim",
      cancelText: "Não",
      submitCallback: () => {
        localStorage.clear();
        notie.alert({
          type: "success",
          text: "Seus dados foram limpos com sucesso!",
          time: 3,
        });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      },
    });
    return;
  }

  const valorBonus = resultadoDosProcessamentos.totalBonus;
  const diaOff = resultadoDosProcessamentos.agendamentoOff;
  const remocaoAgendamento = resultadoDosProcessamentos.remocaoAgendamento;

  if (valorBonus <= 0 && !diaOff && !remocaoAgendamento) {
    notie.alert({
      type: "info",
      text: "Nenhum comando válido (bônus, agendamento ou remoção) encontrado na observação.",
      time: 3,
    });

    return;
  }

  let hoje = new Date();
  const dataKey = hoje.toISOString().slice(0, 10);
  let dadosUsuario = getDadosUsuario();

  if (valorBonus > 0) {
    // Garante que o campo de observações exista para não quebrar o app para usuários antigos
    if (!dadosUsuario.observacoesDiarias) {
      dadosUsuario.observacoesDiarias = {};
    }

    // Adiciona o bônus ao dia atual, se já houver um valor, ou cria o registro
    const valorExistente = dadosUsuario.realizadoDiario[dataKey] || 0;
    dadosUsuario.realizadoDiario[dataKey] = valorExistente + valorBonus;

    // Adiciona o bônus ao total geral
    dadosUsuario.realizadoTotal += valorBonus;

    // Salva a observação
    dadosUsuario.observacoesDiarias[dataKey] =
      (dadosUsuario.observacoesDiarias[dataKey] || "") + "\n" + observacoes;
  }

  if (diaOff) {
    dadosUsuario = salvarDiaOffAgendado(diaOff, dadosUsuario);
  }

  if (remocaoAgendamento) {
    dadosUsuario = removerDiaOffAgendado(remocaoAgendamento, dadosUsuario);
  }

  salvarDados(dadosUsuario);
  iniciarDashboard(null); // Atualiza o dashboard

  if (valorBonus > 0) {
    notie.alert({
      type: "success",
      text: `Bônus de ${valorBonus} pontos aplicado com sucesso!`,
      time: 3,
    });
  }
}

function salvarDiaOffAgendado(dataOff, dadosUsuario) {
  if (!dataOff) return;

  if (!dadosUsuario.diasOffAgendados) {
    dadosUsuario.diasOffAgendados = [];
  }

  const dataExiste = dadosUsuario.diasOffAgendados.includes(dataOff);
  if (dataExiste) {
    notie.alert({
      type: "info",
      text: `A data de ${dataOff} já está agendada.`,
      time: 2,
    });
    return dadosUsuario;
  }

  dadosUsuario.diasOffAgendados.push(dataOff);

  // Feedback para o colaborador
  notie.alert({
    type: "success",
    text: `Dia Off agendado com sucesso! O dia ${dataOff} foi removido da contagem de dias úteis restantes.`,
    time: 3,
  });

  return dadosUsuario;
}

// NOVO: Função para atualizar a UI de um item específico após a edição.
function atualizarItemHistoricoUI(liId, novoValor, nomeDiaSemana) {
  const liElement = document.getElementById(liId);
  if (!liElement) return;

  const displayContainer = liElement.querySelector("[id^=display-container-]");
  const edicaoDiv = liElement.querySelector(".edicao-in-place");
  const valorSpan = displayContainer.querySelector(".card-data-valor");

  // Atualiza o texto do display
  valorSpan.innerHTML = `<strong>${nomeDiaSemana}</strong> : ${novoValor.toLocaleString("pt-BR", { style: "decimal" })} pontos`;

  // Atualiza os atributos para futuras edições
  edicaoDiv.setAttribute("data-valor-antigo", novoValor);
  edicaoDiv.querySelector(".input-correcao").value = novoValor;

  // Esconde a edição e mostra o display
  ocultarEdicaoInPlace(edicaoDiv);
  destacarElemento(liId);
}

// NOVO: Handler centralizado para todos os cliques dentro da lista de histórico.
function handleHistoricoClick(event) {
  const target = event.target;

  // Encontra o botão que foi realmente clicado, mesmo que o clique tenha sido no ícone dentro dele.
  const btnCorrigir = target.closest(".btn-corrigir");
  const btnSalvar = target.closest(".btn-salvar-correcao");
  const btnCancelar = target.closest(".btn-cancelar-correcao");

  if (btnCorrigir) {
    const liId = btnCorrigir.getAttribute("data-li-id");
    const edicaoDiv = document.getElementById(`edicao-${liId}`);
    const dataKeyDoItem = edicaoDiv.getAttribute("data-date-key");
    const valorAntigo = edicaoDiv.getAttribute("data-valor-antigo");

    if (valorAntigo) {
      const dadosUsuario = getDadosUsuario();
      const { valido, mensagem } = validarEdicao(dataKeyDoItem, dadosUsuario);
      if (!valido) {
        notie.alert({ type: "error", text: mensagem, time: 4 });
        return;
      }
    }
    chamarCorrecao(btnCorrigir);
  }

  if (btnSalvar) {
    const edicaoDiv = btnSalvar.closest(".edicao-in-place");
    const liId = edicaoDiv.closest(".historico-item-card").id;
    const dataKey = edicaoDiv.getAttribute("data-date-key");
    const valorAntigo = Number(edicaoDiv.getAttribute("data-valor-antigo"));
    const inputNovoValor = edicaoDiv.querySelector(".input-correcao");
    const novoValor = Number(inputNovoValor.value);

    // Validações
    if (isNaN(novoValor) || novoValor < 100 || novoValor > 10000) {
      notie.alert({ type: "error", text: "Valor inválido. Insira um valor entre 100 e 10.000.", time: 3 });
      return;
    }
    if (novoValor === valorAntigo) {
      notie.alert({ type: "warning", text: "O valor inserido é o mesmo que o anterior.", time: 2 });
      ocultarEdicaoInPlace(edicaoDiv); // Cancela a edição
      return;
    }

    const data = new Date(dataKey + "T00:00:00");
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      notie.alert({ type: "error", text: "Registros não são permitidos aos sábados e domingos.", time: 4 });
      return;
    }

    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const nomeDiaSemana = `${diasDaSemana[diaSemana]} ${data.getDate()}`;

    notie.confirm({
      text: `Confirma o registro de <strong>${novoValor.toLocaleString("pt-BR")}</strong> pontos para <strong>${nomeDiaSemana}</strong>?`,
      submitText: "Sim",
      cancelText: "Não",
      submitCallback: () => {
        corrigirRegistro(dataKey, novoValor, valorAntigo, liId);
      },
      cancelCallback: () => {
        ocultarEdicaoInPlace(edicaoDiv);
      }
    });
  }

  if (btnCancelar) {
    const edicaoDiv = btnCancelar.closest(".edicao-in-place");
    ocultarEdicaoInPlace(edicaoDiv);
  }
}

function removerDiaOffAgendado(dataOff, dadosUsuario) {
  if (!dataOff || !dadosUsuario.diasOffAgendados) {
    notie.alert({
      type: "warning",
      text: "Nenhum agendamento para remover.",
      time: 3,
    });
    return dadosUsuario;
  }

  const index = dadosUsuario.diasOffAgendados.indexOf(dataOff);
  if (index > -1) {
    dadosUsuario.diasOffAgendados.splice(index, 1);
    notie.alert({
      type: "success",
      text: `O agendamento para ${dataOff} foi removido com sucesso.`,
      time: 3,
    });
  } else {
    notie.alert({
      type: "warning",
      text: `Não foi encontrado um agendamento para a data ${dataOff}.`,
      time: 3,
    });
  }

  return dadosUsuario;
}

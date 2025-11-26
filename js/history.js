// js/history.js

import { debugWarn } from "./debug.js";
import {
  destacarElemento,
  ocultarEdicaoInPlace,
  chamarCorrecao,
} from "./ui.js";
import { calcularMediaSemanal } from "./calc.js";
import {
  getDadosUsuario,
  atualizarDadosUsuario,
  salvarDados,
  MAPA_METAS,
} from "./data.js";
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
    const dadosUsuario = getDadosUsuario();
    const diasAgendados = dadosUsuario?.diasOffAgendados || [];

    dataKeys.forEach((dataKey, index) => {
      const valor = realizadoDiario[dataKey];
      const data = new Date(dataKey + "T00:00:00");
      const diaSemana = data.getDay();
      const diaDoMes = data.getDate();
      const isWeekend = diaSemana === 0 || diaSemana === 6; // Domingo (0) e Sábado (6)
      const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const nomeDiaSemana = `${diasDaSemana[diaSemana]} ${diaDoMes}`;

      const liId = `historico-item-${index}`;

      // Converter dataKey para formato BR para verificar agendamento
      const dia = String(data.getDate()).padStart(2, "0");
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const ano = data.getFullYear();
      const dataBR = `${dia}/${mes}/${ano}`;
      const isDiaAgendado = diasAgendados.includes(dataBR);

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
        isEditable = !isWeekend && !isDiaAgendado;
      }

      // Determinar o texto a exibir quando não há valor
      let textoSemValor = "registro não fornecido";
      if (!valor) {
        if (isDiaAgendado) {
          textoSemValor = "🏥 dia agendado (folga/atestado)";
        } else if (isWeekend) {
          textoSemValor = "fim de semana";
        }
      }

      htmlContent += `
                <li class="historico-item-card position-relative" id="${liId}">
                    <fieldset class="historico-item-fieldset">
                        <legend class="historico-item-legend">${nomeDiaSemana}</legend>
                        <div class="historico-item-data" id="display-container-${liId}">
                            <span class="card-data-valor">
                                ${
                                  valor
                                    ? valor.toLocaleString("pt-BR", {
                                        style: "decimal",
                                      }) + " pontos"
                                    : textoSemValor
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
                    </fieldset>
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
  if (listaHistorico)
    listaHistorico.addEventListener("click", handleHistoricoClick);

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
 * @returns {{totalBonus: number, agendamentoOff: string|null, limparDados: boolean, remocaoAgendamento: string|null, errosCaixa: number, caixaFechada: number, atestado: object|null}}
 */
function processarObservacao(obsText) {
  const resultados = {
    totalBonus: 0,
    caixaFechada: 0,
    errosCaixa: 0,
    agendamentoOff: null,
    limparDados: false,
    remocaoAgendamento: null,
    atestado: null,
    valorPonto: null,
  };

  const regrasDeComando = [
    {
      // Detecta comando: meta alterado (45000, 55000, 65000, 90000)
      // Exige exatamente 4 valores separados por vírgula dentro dos parênteses.
      regex:
        /meta\s*alterada\s*\(\s*(\d{3,6})\s*,\s*(\d{3,6})\s*,\s*(\d{3,6})\s*,\s*(\d{3,6})\s*\)/i,
      processar: (match, res) => {
        const a = Number(match[1]);
        const b = Number(match[2]);
        const c = Number(match[3]);
        const d = Number(match[4]);
        if ([a, b, c, d].every((v) => !isNaN(v) && v > 0)) {
          res.metaAlteradaArray = [a, b, c, d];
        }
      },
    },
    {
      regex: /ajudar\s*no\s*recebimento/g,
      processar: (match, res) => {
        res.totalBonus += 100;
      },
    },
    {
      regex: /outro\s*sector\s*#?(\d+)/g,
      processar: (match, res) => {
        res.totalBonus += Number(match[1]) || 0;
      },
    },
    {
      regex: /(?:feriado|aniversário)\s*(\d{2}\/\d{2}\/\d{4})/gi,
      processar: (match, res) => {
        res.agendamentoOff = match[1];
      },
    },
    {
      regex:
        /(?:remover|cancelar|excluir)\s*(?:feriado|aniversário|agendamento)?\s*(\d{2}\/\d{2}\/\d{4})/gi,
      processar: (match, res) => {
        res.remocaoAgendamento = match[1];
      },
    },
    {
      regex: /limpar\s*dados/i,
      processar: (match, res) => {
        res.limparDados = true;
      },
    },

    {
      regex: /(?:caixas|caixa fechada)\s*\((\d{1,4})\)/i,
      processar: (match, res) => {
        res.caixaFechada += Number(match[1]) || 0;
      },
    },

    {
      regex: /erros\s*\((\d+)\)/i,
      processar: (match, res) => {
        res.errosCaixa += Number(match[1]) || 0;
      },
    },
    {
      // Detecta valor do ponto
      // Formatos aceitos:
      // - valor do ponto R$ 0,50
      // - ponto vale R$ 0,35
      // - valor ponto: 0.50
      regex:
        /(?:valor\s*(?:do\s*)?ponto|ponto\s*vale)\s*[:\s]*R?\$?\s*(\d+[.,]\d{2})/gi,
      processar: (match, res) => {
        const valorStr = match[1].replace(",", ".");
        const valor = parseFloat(valorStr);
        if (!isNaN(valor) && valor > 0) {
          res.valorPonto = valor;
        }
      },
    },
    {
      // Detecta atestado médico com duração e/ou período específico
      // Formatos aceitos:
      // - atestado (1 dia)
      // - atestado 3 dias
      // - atestado de 23/11 a 25/11
      // - atestado de 23/11/2025 até 25/11/2025
      regex:
        /(?:atestado|afastamento)(?:\s+(?:médico|de\s+saúde|saúde))?\s*(?:(\d+)\s*(?:dias?|d))?\s*(?:(?:de|em)\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?))?(?:\s*(?:a|até|ao)\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?))?/gi,
      processar: (match, res) => {
        const dias = match[1] ? parseInt(match[1]) : 1;
        const dataInicio = match[2] || null;
        const dataFim = match[3] || null;

        res.atestado = {
          dias,
          dataInicio,
          dataFim,
          textoOriginal: match[0],
        };
      },
    },
  ];

  regrasDeComando.forEach((regra) => {
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
  let dadosUsuario = getDadosUsuario();

  if (!dadosUsuario) {
    notie.alert({
      type: "error",
      text: "Dados do usuário não encontrados. Por favor, configure seu perfil primeiro.",
      time: 4,
    });
    return;
  }

  const observacoesElement = document.getElementById("texterarea-obervacoes");
  const observacoes = observacoesElement.value.trim();

  if (!observacoes) {
    notie.alert({
      type: "info",
      text: "Nenhuma observação inserida.",
      time: 5,
    });
    return;
  }

  const resultadoDosProcessamentos = processarObservacao(observacoes);

  // Trigger: if the observation mentions 'relatório' open the report page (simple substring, no complex regex)
  const obsLower = observacoes.toLowerCase();
  if (obsLower.includes("relat") || obsLower.includes("relatório")) {
    try {
      // Abre em nova aba a página de relatório
      window.open("report.html", "_blank");
    } catch (e) {
      debugWarn("Não foi possível abrir a página de relatório:", e);
    }
    // Não processa outros comandos quando o usuário apenas solicitou o relatório
    return;
  }

  // Se a observação contiver comando de alteração de meta com 4 valores, aplicamos imediatamente
  if (resultadoDosProcessamentos.metaAlteradaArray) {
    const arr = resultadoDosProcessamentos.metaAlteradaArray;
    // Mapear as posições para as chaves fixas de R$
    const chaves = ["300", "400", "500", "600"];
    if (arr.length === 4) {
      // Validação de intervalo (evita valores absurdos)
      const MIN_META = 10000;
      const MAX_META = 100000;
      const foraDoIntervalo = arr.some(
        (v) => v < MIN_META || v > MAX_META || isNaN(v)
      );
      if (foraDoIntervalo) {
        notie.alert({
          type: "error",
          text: `Valores inválidos: informe 4 números entre ${MIN_META.toLocaleString(
            "pt-BR"
          )} e ${MAX_META.toLocaleString("pt-BR")}.`,
          time: 5,
        });
      } else {
        // Pedir confirmação antes de sobrescrever o mapa de metas do usuário
        const resumo = `300→${arr[0]}, 400→${arr[1]}, 500→${arr[2]}, 600→${arr[3]}`;
        notie.confirm({
          text: `Confirma sobrescrever as metas atuais com: ${resumo}?`,
          submitText: "Sim, substituir",
          cancelText: "Cancelar",
          submitCallback: () => {
            if (!dadosUsuario.mapaMetas) dadosUsuario.mapaMetas = {};
            for (let i = 0; i < 4; i++) {
              dadosUsuario.mapaMetas[chaves[i]] = Number(arr[i]);
            }

            // Atualiza metaMensal para a chave atualmente selecionada no dropdown, se existir,
            // caso contrário define para a primeira opção (300)
            const selectedKey =
              (document.getElementById("meta-dropdown") || {}).value || "300";
            const novaMetaMensal =
              (dadosUsuario.mapaMetas && dadosUsuario.mapaMetas[selectedKey]) ||
              arr[0];
            dadosUsuario.metaMensal = novaMetaMensal;

            salvarDados(dadosUsuario);
            iniciarDashboard(null);

            notie.alert({
              type: "success",
              text: `Mapeamento de metas atualizado. Novas metas: ${arr.join(
                ", "
              )}`,
              time: 4,
            });
          },
          cancelCallback: () => {
            notie.alert({
              type: "info",
              text: "Operação cancelada. Nenhuma alteração foi feita.",
              time: 3,
            });
          },
        });
      }
    } else {
      notie.alert({
        type: "error",
        text: "Comando inválido: informe exatamente 4 valores entre parênteses separados por vírgula.",
        time: 4,
      });
    }
  }

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
  const erros = resultadoDosProcessamentos.errosCaixa;
  const caixaFechada = resultadoDosProcessamentos.caixaFechada;
  const atestado = resultadoDosProcessamentos.atestado;

  const isValid =
    valorBonus > 0 ||
    diaOff ||
    remocaoAgendamento ||
    erros > 0 ||
    caixaFechada > 0 ||
    atestado ||
    resultadoDosProcessamentos.metaAlteradaArray;

  if (!isValid) {
    notie.alert({
      type: "info",
      text: "Nenhum comando válido (bônus, agendamento ou remoção) encontrado na observação.",
      time: 3,
    });

    return;
  }

  let hoje = new Date();
  const dataKey = hoje.toISOString().slice(0, 10);

  // Lógica do Top 5: Acumula caixas e erros
  if (caixaFechada > 0 || erros > 0) {
    if (dadosUsuario.totalCaixas === undefined) {
      dadosUsuario.totalCaixas = 0;
    }
    if (dadosUsuario.totalErros === undefined) {
      dadosUsuario.totalErros = 0;
    }

    // Validação de valores suspeitos de caixas
    if (caixaFechada > 0) {
      if (caixaFechada < 10) {
        notie.alert({
          type: "warning",
          text: `⚠️ Valor muito baixo: ${caixaFechada.toLocaleString(
            "pt-BR"
          )} caixas. Mínimo recomendado: 10.`,
          time: 4,
        });
      } else if (caixaFechada > 4999) {
        notie.alert({
          type: "warning",
          text: `⚠️ Valor muito alto: ${caixaFechada.toLocaleString(
            "pt-BR"
          )} caixas. Valores normais para a atividade: até 4999.`,
          time: 4,
        });
      } else {
        notie.alert({
          type: "info",
          text: `📦 ${caixaFechada.toLocaleString(
            "pt-BR"
          )} caixas registradas com sucesso!`,
          time: 3,
        });
      }
    }

    if (erros > 0) {
      notie.alert({
        type: "info",
        text: `⚠️ ${erros} erro(s) registrado(s).`,
        time: 5,
      });
    }

    dadosUsuario.totalCaixas += caixaFechada;
    dadosUsuario.totalErros += erros;
  }

  if (valorBonus > 0) {
    // Garante que o campo de observações exista para não quebrar o app para usuários antigos
    if (!dadosUsuario.observacoesDiarias) {
      dadosUsuario.observacoesDiarias = {};
    }

    // Rastreia histórico de bônus para relatório
    if (!dadosUsuario.historicoBonus) {
      dadosUsuario.historicoBonus = [];
    }

    // Identifica o tipo de bônus
    let tipoBonus = "Outros";
    if (/ajudar\s*no\s*recebimento/i.test(observacoes)) {
      tipoBonus = "Ajudar no recebimento";
    } else if (/outro\s*sector/i.test(observacoes)) {
      tipoBonus = "Outro setor";
    }

    dadosUsuario.historicoBonus.push({
      data: dataKey,
      tipo: tipoBonus,
      valor: valorBonus,
      descricao: observacoes.substring(0, 100), // Limita a 100 caracteres
    });

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

  if (atestado) {
    dadosUsuario = processarAtestado(atestado, dadosUsuario, observacoes);
  }

  // Salva o valor do ponto se detectado
  if (resultadoDosProcessamentos.valorPonto) {
    dadosUsuario.valorPonto = resultadoDosProcessamentos.valorPonto;
    notie.alert({
      type: "success",
      text: `💰 Valor do ponto configurado: R$ ${resultadoDosProcessamentos.valorPonto
        .toFixed(2)
        .replace(".", ",")}`,
      time: 3,
    });
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
  observacoesElement.value = "";
}

/**
 * Processa atestado médico e agenda os dias automaticamente
 */
function processarAtestado(atestado, dadosUsuario, observacaoTexto) {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0); // Normaliza para meio-dia
  let dataInicio, dataFim;

  // Determina data de início
  if (atestado.dataInicio) {
    dataInicio = parseDateBR(atestado.dataInicio);
  } else {
    dataInicio = new Date(hoje);
  }

  // Determina data de fim
  if (atestado.dataFim) {
    dataFim = parseDateBR(atestado.dataFim);
  } else if (atestado.dias > 1) {
    dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + atestado.dias - 1);
  } else {
    dataFim = new Date(dataInicio);
  }

  // Agenda todos os dias do período
  const datasAtestado = [];
  const dataAtual = new Date(dataInicio);

  while (dataAtual <= dataFim) {
    const dataBR = formatDateToBR(dataAtual);
    datasAtestado.push(dataBR);

    // Agenda o dia se ainda não estiver agendado
    if (!dadosUsuario.diasOffAgendados) {
      dadosUsuario.diasOffAgendados = [];
    }
    if (!dadosUsuario.diasOffAgendados.includes(dataBR)) {
      dadosUsuario.diasOffAgendados.push(dataBR);
    }

    // Adiciona observação no dia
    const dataISO = dataAtual.toISOString().slice(0, 10);
    if (!dadosUsuario.observacoesDiarias) {
      dadosUsuario.observacoesDiarias = {};
    }
    const obsAtual = dadosUsuario.observacoesDiarias[dataISO] || "";
    const obsAtestado = `🏥 Atestado médico (${atestado.dias} dia${
      atestado.dias > 1 ? "s" : ""
    })`;
    dadosUsuario.observacoesDiarias[dataISO] =
      obsAtual + (obsAtual ? "\n" : "") + obsAtestado;

    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  notie.alert({
    type: "success",
    text: `Atestado registrado: ${datasAtestado.length} dia(s) agendado(s) - ${
      datasAtestado[0]
    } a ${datasAtestado[datasAtestado.length - 1]}`,
    time: 4,
  });

  return dadosUsuario;
}

/**
 * Converte data no formato DD/MM ou DD/MM/YYYY para objeto Date
 */
function parseDateBR(dataBR) {
  const partes = dataBR.split("/");
  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1;
  const ano = partes[2] ? parseInt(partes[2]) : new Date().getFullYear();

  // Cria a data ao meio-dia para evitar problemas de fuso horário
  const date = new Date(ano, mes, dia, 12, 0, 0, 0);
  return date;
}

/**
 * Formata objeto Date para DD/MM/YYYY
 */
function formatDateToBR(date) {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
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
      time: 5,
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

  // Observação: não há variáveis locais `errosCaixa` ou `caixaFechada` aqui;
  // mensagens relacionadas a erros/caixas são tratadas em outro fluxo.

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
  valorSpan.textContent = `${novoValor.toLocaleString("pt-BR", {
    style: "decimal",
  })} pontos`;

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
      notie.alert({
        type: "error",
        text: "Valor inválido. Insira um valor entre 100 e 10.000.",
        time: 3,
      });
      return;
    }
    if (novoValor === valorAntigo) {
      notie.alert({
        type: "warning",
        text: "O valor inserido é o mesmo que o anterior.",
        time: 5,
      });
      ocultarEdicaoInPlace(edicaoDiv); // Cancela a edição
      return;
    }

    const data = new Date(dataKey + "T00:00:00");
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      notie.alert({
        type: "error",
        text: "Registros não são permitidos aos sábados e domingos.",
        time: 4,
      });
      return;
    }

    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const nomeDiaSemana = `${diasDaSemana[diaSemana]} ${data.getDate()}`;

    notie.confirm({
      text: `Confirma o registro de <strong>${novoValor.toLocaleString(
        "pt-BR"
      )}</strong> pontos para <strong>${nomeDiaSemana}</strong>?`,
      submitText: "Sim",
      cancelText: "Não",
      submitCallback: () => {
        corrigirRegistro(dataKey, novoValor, valorAntigo, liId);
      },
      cancelCallback: () => {
        ocultarEdicaoInPlace(edicaoDiv);
      },
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

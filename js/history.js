// js/history.js

import { destacarElemento, ocultarEdicaoInPlace, chamarCorrecao } from "./ui.js";
import { calcularMediaSemanal } from "./calc.js";
import { carregarDados, salvarDados } from "./data.js";
import { validarEdicao } from "./validation.js";
import { iniciarDashboard } from "./app.js";

let dadosUsuario = null;

function carregarDadosHistorico() {
    if (!dadosUsuario) {
        dadosUsuario = carregarDados();
    }

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
  if (realizadoDiario && Object.keys(realizadoDiario).length > 0) {
    const dataOrdenadas = Object.keys(realizadoDiario).sort().reverse();
    const ultimos5Dias = dataOrdenadas.slice(0, 5);

    const hoje = new Date();
    const hojeDataKey = hoje.getFullYear() +
        "-" +
        String(hoje.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(hoje.getDate()).padStart(2, "0");
    
    const ultimoRegistroDataKey = dataOrdenadas.length > 0 ? dataOrdenadas[0] : null;

    ultimos5Dias.forEach((dataKey, index) => {
      const valor = realizadoDiario[dataKey];
      const valorFormatado = valor.toLocaleString("pt-BR", {
        style: "decimal",
      });
      const dataReduzida = dataKey.slice(5);
      const liId = `historico-item-${index}`;

      const isEditable = dataKey === ultimoRegistroDataKey && dataKey === hojeDataKey;

      htmlContent += `
        <li class="historico-item-card position-relative" id="${liId}">
            <div class="historico-item-data" id="display-container-${liId}">
                <span class="card-data-valor">
                    ${dataReduzida} : ${valorFormatado} pontos
                </span>
                ${isEditable ? `
                <button class="btn-corrigir btn btn-sm btn-light" data-li-id="${liId}" aria-label="Corrigir Registro">
                    <i class="bi bi-pencil"></i>
                </button>
                ` : ''}
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

export function abrirModalHistorico() {
  carregarDadosHistorico();

  const modal = document.getElementById("historico-modal");
  if (modal) {
    modal.classList.replace("modal-backdrop-hidden", "modal-backdrop");
    document.querySelector("main > section").classList.add("section-modal-open");
  }
}

export function configurarModalHistorico() {
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
      const liId = clickedButton.getAttribute("data-li-id");
      const edicaoDiv = document.getElementById(`edicao-${liId}`);
      const dataKeyDoItem = edicaoDiv.getAttribute("data-date-key");

      const { valido, mensagem } = validarEdicao(dataKeyDoItem, dadosUsuario);

      if (!valido) {
        notie.alert({
          type: "error",
          text: mensagem,
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

      if (isNaN(novoValor) || novoValor < 100 || novoValor > 10000) {
        notie.alert({ type: "error", text: "Valor inválido. Insira um valor entre 100 e 10.000.", time: 3 });
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

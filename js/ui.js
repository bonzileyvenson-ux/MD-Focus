export function destacarElemento(elementId) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.classList.add("valor-atualizado");
        setTimeout(() => {
            elemento.classList.remove("valor-atualizado");
        }, 700);
    }
}

export function alternarDisplay(element) {
  element.classList.toggle("hidden");
}

export function ocultarEdicaoInPlace(edicaoDiv) {
  edicaoDiv.classList.add("edita-pontos-hidden");

  const liContainer = edicaoDiv.closest(".historico-item-card");
  const displayContainer = liContainer
    ? liContainer.querySelector("[id^=display-container-]")
    : null;

  if (displayContainer) {
    displayContainer.classList.remove("edita-pontos-hidden");
  }
}

export function chamarCorrecao(btn) {
  const liId = btn.getAttribute("data-li-id");
  const edicaoDiv = document.getElementById(`edicao-${liId}`);
  const displayContainer = document.getElementById(`display-container-${liId}`);

  if (edicaoDiv && displayContainer) {
    displayContainer.classList.add("edita-pontos-hidden");
    edicaoDiv.classList.remove("edita-pontos-hidden");

    const inputElement = edicaoDiv.querySelector(".input-correcao");
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  }
}

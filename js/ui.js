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

/**
 * Show a notie alert with an optional rounded app icon on the left.
 * @param {{type: string, text: string, time: number, iconUrl: string}} opts
 */
export function notieWithIcon(opts = {}) {
  const { type = "info", text = "", time = 3, iconUrl = null } = opts;
  if (typeof notie === "undefined") {
    console.warn("notie is not available");
    return;
  }
  notie.alert({ type, text, time });

  // Try to attach to the most recently created .notie-container
  let attempts = 0;
  const maxAttempts = 30;
  const delay = 60; // ms

  const attach = () => {
    const nodes = document.querySelectorAll(".notie-container");
    const nc = nodes && nodes.length ? nodes[nodes.length - 1] : null;
    if (!nc) {
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(attach, delay);
      }
      return;
    }

    if (iconUrl) {
      // ensure proper url(...) value
      const cssUrl = `url("${iconUrl}")`;
      nc.style.setProperty("--notie-icon", cssUrl);
    }
    nc.classList.add("with-icon");

    // Cleanup after notification disappears (give small buffer)
    if (time && time > 0) {
      setTimeout(() => {
        nc.classList.remove("with-icon");
        try {
          nc.style.removeProperty("--notie-icon");
        } catch (e) {}
      }, time * 1000 + 800);
    }
  };

  setTimeout(attach, delay);
}

// Expose helper to global scope so it can be called from console (for debugging/testing)
try {
  if (typeof window !== "undefined") {
    window.notieWithIcon = notieWithIcon;
  }
} catch (e) {
  // ignore
}

/**
 * Enable automatic app-icon decoration for all notie notifications.
 * It wraps `notie.alert` and `notie.confirm` so the icon appears by default.
 * @param {object} options
 * @param {string} options.iconUrl - URL to the icon to use (defaults to './touch-icon.png')
 */
export function enableGlobalNotieIcon(options = {}) {
  const { iconUrl = "./touch-icon.png" } = options;

  const waitAndPatch = () => {
    if (typeof window === "undefined" || typeof window.notie === "undefined") {
      setTimeout(waitAndPatch, 60);
      return;
    }

    const originalAlert = window.notie.alert.bind(window.notie);
    const originalConfirm = window.notie.confirm
      ? window.notie.confirm.bind(window.notie)
      : null;

    function attachIconToLatest(time, icon) {
      // same attach logic used by notieWithIcon
      let attempts = 0;
      const maxAttempts = 30;
      const delay = 60;
      const attach = () => {
        const nodes = document.querySelectorAll(".notie-container");
        const nc = nodes && nodes.length ? nodes[nodes.length - 1] : null;
        if (!nc) {
          attempts += 1;
          if (attempts < maxAttempts) setTimeout(attach, delay);
          return;
        }
        if (icon) nc.style.setProperty("--notie-icon", `url("${icon}")`);
        nc.classList.add("with-icon");
        if (time && time > 0) {
          setTimeout(() => {
            nc.classList.remove("with-icon");
            try {
              nc.style.removeProperty("--notie-icon");
            } catch (e) {}
          }, time * 1000 + 800);
        }
      };
      setTimeout(attach, delay);
    }

    // Patch alert
    window.notie.alert = function (opts) {
      // support old signature: (opts) or (type, text, time)
      let type = "info",
        text = "",
        time = 3;
      if (typeof opts === "object") {
        type = opts.type || "info";
        text = opts.text || "";
        time = typeof opts.time === "number" ? opts.time : 3;
        originalAlert(opts);
      } else {
        // positional args
        type = arguments[0] || "info";
        text = arguments[1] || "";
        time = typeof arguments[2] === "number" ? arguments[2] : 3;
        originalAlert(type, text, time);
      }
      attachIconToLatest(time, iconUrl);
    };

    // Patch confirm (if exists)
    if (originalConfirm) {
      window.notie.confirm = function (opts) {
        // notie.confirm signature: (text, submitCallback, cancelCallback, submitText, cancelText)
        originalConfirm.apply(null, arguments);
        // confirm stays until user interacts, no auto-remove time — attach without auto cleanup
        attachIconToLatest(0, iconUrl);
      };
    }
  };

  waitAndPatch();

  // expose for debugging
  try {
    if (typeof window !== "undefined")
      window.enableGlobalNotieIcon = enableGlobalNotieIcon;
  } catch (e) {}
}

// Enable default global icon using favicon.png automatically
try {
  if (typeof window !== "undefined") {
    // small delay to avoid race with module loading
    setTimeout(
      () => enableGlobalNotieIcon({ iconUrl: "./touch-icon.png" }),
      120
    );
  }
} catch (e) {
  // ignore
}

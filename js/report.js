import { getDadosUsuario } from "./data.js";

function renderReport() {
  const dados = safeGetDadosUsuario();
  const tbody = document.querySelector("#report-table tbody");
  const elUsuario = document.getElementById("report-usuario");
  const elData = document.getElementById("report-data");
  const elMetaMensal = document.getElementById("report-meta-mensal");
  const elTotalRealizado = document.getElementById("report-total-realizado");
  const elAtividades = document.getElementById("report-atividades");
  const elErros = document.getElementById("report-erros");

  if (!dados) {
    console.log("Nenhum dado encontrado para o usuário atual");
    if (elUsuario) elUsuario.textContent = "-";
    if (tbody)
      tbody.innerHTML = `<tr><td colspan=\"4\">Nenhum movimento registrado.</td></tr>`;
    return;
  }

  if (elUsuario) elUsuario.textContent = dados.nome || "-";
  if (elData) elData.textContent = new Date().toLocaleDateString("pt-BR");
  if (elMetaMensal)
    elMetaMensal.textContent =
      typeof dados.metaMensal === "number"
        ? dados.metaMensal.toLocaleString("pt-BR")
        : "-";
  if (elTotalRealizado)
    elTotalRealizado.textContent =
      typeof dados.realizadoTotal === "number"
        ? dados.realizadoTotal.toLocaleString("pt-BR")
        : "0";
  if (elAtividades)
    elAtividades.textContent =
      typeof dados.totalCaixas === "number"
        ? dados.totalCaixas.toLocaleString("pt-BR")
        : dados.totalCaixas || "-";
  if (elErros)
    elErros.textContent =
      typeof dados.totalErros === "number"
        ? dados.totalErros.toLocaleString("pt-BR")
        : dados.totalErros || "-";

  const movimentos = buildMovements(dados);
  if (!tbody) return;
  tbody.innerHTML = "";

  let totalPontos = 0;
  let diasTrabalhados = 0;
  let diasNaoTrabalhados = 0;

  movimentos.forEach((movimento) => {
    const tr = document.createElement("tr");

    // Adiciona classes para estilização visual e conta dias não trabalhados
    if (movimento.type === "Atestado") {
      tr.classList.add("row-atestado");
      diasNaoTrabalhados++;
    } else if (movimento.type === "Agendamento") {
      tr.classList.add("row-agendamento");
      diasNaoTrabalhados++;
    } else if (movimento.type === "Não informado") {
      tr.classList.add("row-nao-informado");
    } else if (movimento.type === "Trabalho") {
      tr.classList.add("row-trabalho");
      if (typeof movimento.points === "number") {
        totalPontos += movimento.points;
        diasTrabalhados++;
      }
    }

    const tdDate = document.createElement("td");
    tdDate.textContent = formatDateISO(movimento.date);

    const tdType = document.createElement("td");
    tdType.textContent = movimento.type;

    const tdPoints = document.createElement("td");
    tdPoints.textContent =
      typeof movimento.points === "number"
        ? movimento.points.toLocaleString("pt-BR")
        : movimento.points;
    tdPoints.classList.add("col-pontos");

    const tdNotes = document.createElement("td");
    tdNotes.textContent = movimento.notes || "-";
    tdNotes.classList.add("col-observacoes");
    if (!movimento.notes || movimento.notes === "-") {
      tdNotes.classList.add("empty-cell");
    }

    tr.appendChild(tdDate);
    tr.appendChild(tdType);
    tr.appendChild(tdPoints);
    tr.appendChild(tdNotes);
    tbody.appendChild(tr);
  });

  // Adiciona linha de totais no tfoot com resumo completo para o gestor
  const tfoot = document.querySelector(".report-table tfoot");
  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td style="text-align: right; font-weight: bold;">TOTAL:</td>
        <td style="font-weight: bold; color: #155724; text-align: center;">${totalPontos.toLocaleString(
          "pt-BR"
        )} pts</td>
        <td style="text-align: center; font-style: italic; color: #28a745;">${diasTrabalhados} trabalhado(s)</td>
        <td style="text-align: center; font-style: italic; color: #dc3545;">${diasNaoTrabalhados} não trabalhado(s)</td>
      </tr>
    `;
  }

  renderObservations(dados);
}

/**
 * Formata data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 */
function formatDateISO(dateStr) {
  const dataObj = new Date(dateStr);
  return dataObj.toLocaleDateString("pt-BR");
}

/**
 * Adiciona zero à esquerda em números menores que 10
 */
function pad(numero) {
  return String(numero).padStart(2, "0");
}

/**
 * Converte data para formato ISO (YYYY-MM-DD)
 */
function toISO(ano, indiceMes, dia) {
  return `${ano}-${pad(indiceMes + 1)}-${pad(dia)}`;
}

/**
 * Retorna array com todos os dias do mês em formato ISO
 */
function getDaysOfMonth(year, monthIndex) {
  const dias = [];
  const ultimoDia = new Date(year, monthIndex + 1, 0).getDate();

  for (let dia = 1; dia <= ultimoDia; dia++) {
    dias.push(toISO(year, monthIndex, dia));
  }

  return dias;
}

/**
 * Obtém dados do usuário com tratamento de erro para localStorage bloqueado
 */
function safeGetDadosUsuario() {
  try {
    return getDadosUsuario();
  } catch (erro) {
    console.warn("Acesso ao localStorage bloqueado ou indisponível:", erro);
    return null;
  }
}

/**
 * Constrói array de movimentos do mês atual
 * Exclui finais de semana (sábado e domingo)
 * Classifica dias como: Trabalho, Agendamento ou Não informado
 */
function buildMovements(dados) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const indiceMes = agora.getMonth();
  const diasDoMes = getDaysOfMonth(ano, indiceMes);
  const movimentos = [];

  // Converte agendamentos de DD/MM/YYYY para YYYY-MM-DD
  const offSetISO = new Set();
  if (dados && Array.isArray(dados.diasOffAgendados)) {
    dados.diasOffAgendados.forEach((dataBR) => {
      const partes = String(dataBR).split("/");
      if (partes.length === 3) {
        const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
        offSetISO.add(dataISO);
      }
    });
  }

  // Cria mapa de observações por data (ISO)
  const obsMap = {};
  if (
    dados &&
    dados.observacoesDiarias &&
    typeof dados.observacoesDiarias === "object"
  ) {
    Object.keys(dados.observacoesDiarias).forEach((dataKey) => {
      const raw = String(dados.observacoesDiarias[dataKey] || "");
      const linhas = raw
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (linhas.length) obsMap[dataKey] = linhas.join("; ");
    });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  diasDoMes.forEach((isoDate) => {
    const dataObj = new Date(isoDate + "T00:00:00");
    const diaSemana = dataObj.getDay();

    // Ignora finais de semana (0=domingo, 6=sábado)
    if (diaSemana === 0 || diaSemana === 6) return;

    const obs = obsMap[isoDate] || "";
    const dataJaPassou = dataObj < hoje;

    // Verifica se é atestado médico (detecta ícone 🏥 ou palavra "atestado")
    const isAtestado = obs.includes("🏥") || /atestado|afastamento/i.test(obs);

    // Caso 1: Dia agendado (folga, feriado, aniversário)
    if (offSetISO.has(isoDate)) {
      const tipo = isAtestado ? "Atestado" : "Agendamento";
      movimentos.push({
        date: isoDate,
        type: tipo,
        points: "-",
        notes: obs || "Dia agendado como folga",
      });
      return;
    }

    // Caso 2: Dia com trabalho registrado
    if (dados?.realizadoDiario?.[isoDate] !== undefined) {
      const pontos = dados.realizadoDiario[isoDate];
      movimentos.push({
        date: isoDate,
        type: "Trabalho",
        points: typeof pontos === "number" ? pontos : pontos || 0,
        notes: obs || "-",
      });
      return;
    }

    // Caso 3: Dia não informado (mensagem varia conforme data)
    const mensagemPadrao = dataJaPassou
      ? "Sem observações"
      : "Aguardando preenchimento";

    movimentos.push({
      date: isoDate,
      type: "Não informado",
      points: "-",
      notes: obs || mensagemPadrao,
    });
  });

  return movimentos;
}

/**
 * Renderiza seção de observações agrupadas por data
 */
function renderObservations(dados) {
  const container = document.getElementById("report-observations");
  if (!container) return;
  const byDate = {};

  // Adiciona observações diárias (texto multilinha)
  if (
    dados &&
    dados.observacoesDiarias &&
    typeof dados.observacoesDiarias === "object"
  ) {
    const mapa = dados.observacoesDiarias;
    const chaves = Object.keys(mapa).sort((a, b) => (a < b ? -1 : 1));
    chaves.forEach((dataKey) => {
      const raw = String(mapa[dataKey] || "");
      const linhas = raw
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (linhas.length) byDate[dataKey] = linhas;
    });
  }

  // Adiciona observações do array (compatibilidade)
  if (dados && Array.isArray(dados.observacoes) && dados.observacoes.length) {
    dados.observacoes.forEach((item) => {
      const chaveData = item.date || "";
      if (!byDate[chaveData]) byDate[chaveData] = [];
      if (item.text) byDate[chaveData].push(item.text);
    });
  }

  // Adiciona agendamentos (dia off, feriado, aniversário) como observações
  if (
    dados &&
    Array.isArray(dados.diasOffAgendados) &&
    dados.diasOffAgendados.length
  ) {
    dados.diasOffAgendados.forEach((dataBR) => {
      // Converte de DD/MM/YYYY para YYYY-MM-DD (formato ISO usado no relatório)
      const partes = String(dataBR).split("/");
      if (partes.length === 3) {
        const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
        if (!byDate[dataISO]) byDate[dataISO] = [];
        byDate[dataISO].push("📅 Agendamento: Dia off / Feriado / Aniversário");
      }
    });
  }

  if (Object.keys(byDate).length === 0) {
    container.innerHTML = `<div class="no-observations">Nenhuma observacao registrada.</div>`;
    return;
  }

  const keys = Object.keys(byDate).sort((aKey, bKey) => (aKey < bKey ? 1 : -1));
  const html = keys
    .map((date) => {
      const items = byDate[date]
        .map((texto) => `<li class="obs-item">${texto}</li>`)
        .join("");
      return `<div class="obs-day"><div class="obs-date">${formatDateISO(
        date
      )}</div><ul>${items}</ul></div>`;
    })
    .join("");

  container.innerHTML = html;
}

/**
 * Configura ações dos botões: Imprimir, Baixar PDF e Enviar Email
 */
function setupActions() {
  const btnPrint = document.getElementById("btn-print");
  const btnDownload = document.getElementById("btn-download");
  const btnEmail = document.getElementById("btn-email");

  if (btnPrint) btnPrint.addEventListener("click", () => window.print());

  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      const element = document.getElementById("report-root");
      const safeDados = safeGetDadosUsuario();
      const filenameBase =
        safeDados && safeDados.nome ? safeDados.nome : "relatorio";

      // Oculta elementos que não devem aparecer no PDF
      const reportActions = document.querySelector(".report-actions");
      const reportNotes = document.querySelector(".report-notes");

      if (reportActions) reportActions.style.display = "none";
      if (reportNotes) reportNotes.style.display = "none";

      const opt = {
        margin: 10,
        filename: `relatorio-${filenameBase}-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      if (typeof html2pdf === "function") {
        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            // Restaura os elementos após gerar o PDF
            if (reportActions) reportActions.style.display = "";
            if (reportNotes) reportNotes.style.display = "";
          });
      } else {
        alert("Exportacao para PDF indisponivel: html2pdf nao encontrada.");
        // Restaura mesmo se houver erro
        if (reportActions) reportActions.style.display = "";
        if (reportNotes) reportNotes.style.display = "";
      }
    });
  }

  if (btnEmail) {
    btnEmail.addEventListener("click", async () => {
      const dados = safeGetDadosUsuario();
      const subjectRaw =
        dados && dados.nome
          ? `Relatorio de Movimentos - ${dados.nome}`
          : "Relatorio de Movimentos";
      const bodyRaw =
        dados && dados.nome
          ? `Segue relatorio de movimentos do colaborador ${
              dados.nome
            }.\n\nGere o PDF com o botao 'Baixar PDF' e anexe ao email.\n\nObservacoes: ${
              dados.observacoesGeral || "-"
            }`
          : "Nao foi possivel ler os dados do usuario. Gere o PDF e anexe manualmente.";

      const mailto = `mailto:?subject=${encodeURIComponent(
        subjectRaw
      )}&body=${encodeURIComponent(bodyRaw)}`;

      try {
        const win = window.open(mailto, "_blank");
        if (win) return;
      } catch (erro) {
        // Método 1 falhou, tenta alternativa
      }

      // Tenta abrir com elemento anchor
      try {
        const anchorElement = document.createElement("a");
        anchorElement.href = mailto;
        anchorElement.style.display = "none";
        document.body.appendChild(anchorElement);
        anchorElement.click();
        anchorElement.remove();
        return;
      } catch (erro) {
        // Método 2 falhou, tenta alternativa
      }

      // Tenta abrir com location.href
      try {
        window.location.href = mailto;
        setTimeout(() => showEmailFallback(mailto), 600);
        return;
      } catch (erro) {
        // Todos os métodos falharam
      }

      // Mostra painel de fallback
      showEmailFallback(mailto);
    });
  }
}

/**
 * Configura funcionalidade de assinaturas
 * Oculta inputs e mostra nomes quando ambos (nome + cargo) são preenchidos
 */
function setupSignatures() {
  const colaboradorNomeInput = document.getElementById("sig-colaborador-nome");
  const colaboradorCargoInput = document.getElementById(
    "sig-colaborador-cargo"
  );
  const coordenadorNomeInput = document.getElementById("sig-coordenador-nome");
  const coordenadorCargoInput = document.getElementById(
    "sig-coordenador-cargo"
  );

  function updateSignature(tipo) {
    const nomeInput = document.getElementById(`sig-${tipo}-nome`);
    const cargoInput = document.getElementById(`sig-${tipo}-cargo`);
    const signatureDiv = document.getElementById(`signature-${tipo}`);
    const signedNome = document.getElementById(`signed-${tipo}-nome`);
    const signedCargo = document.getElementById(`signed-${tipo}-cargo`);

    const nome = nomeInput.value.trim();
    const cargo = cargoInput.value.trim();

    if (nome && cargo) {
      signedNome.textContent = nome;
      signedCargo.textContent = cargo;
      signatureDiv.classList.add("is-signed");
    } else {
      signatureDiv.classList.remove("is-signed");
    }
  }

  if (colaboradorNomeInput && colaboradorCargoInput) {
    colaboradorNomeInput.addEventListener("blur", () =>
      updateSignature("colaborador")
    );
    colaboradorCargoInput.addEventListener("blur", () =>
      updateSignature("colaborador")
    );
  }

  if (coordenadorNomeInput && coordenadorCargoInput) {
    coordenadorNomeInput.addEventListener("blur", () =>
      updateSignature("coordenador")
    );
    coordenadorCargoInput.addEventListener("blur", () =>
      updateSignature("coordenador")
    );
  }
}

/**
 * Mostra painel de fallback quando cliente de email não abre automaticamente
 */
function showEmailFallback(mailto) {
  const panel = document.getElementById("email-fallback-panel");
  const textarea = document.getElementById("email-fallback-link");
  const openLink = document.getElementById("email-fallback-open");
  if (!panel || !textarea || !openLink) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mailto);
        alert(
          "Nao foi possivel abrir o cliente automaticamente. O link de email foi copiado para a area de transferencia."
        );
      } else {
        window.prompt(
          "Copie o link de email abaixo e use no seu cliente de email:",
          mailto
        );
      }
    } catch (erro) {
      window.prompt(
        "Copie o link de email abaixo e use no seu cliente de email:",
        mailto
      );
    }
    return;
  }

  textarea.value = mailto;
  openLink.href = mailto;
  panel.style.display = "block";
}

/**
 * Oculta painel de fallback de email
 */
function hideEmailFallback() {
  const panel = document.getElementById("email-fallback-panel");
  if (panel) panel.style.display = "none";
}

/**
 * Configura botões do painel de fallback (copiar e fechar)
 */
function setupEmailFallback() {
  const copyBtn = document.getElementById("email-fallback-copy");
  const closeBtn = document.getElementById("email-fallback-close");
  const openLink = document.getElementById("email-fallback-open");
  const textarea = document.getElementById("email-fallback-link");

  if (copyBtn && textarea) {
    copyBtn.addEventListener("click", async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textarea.value);
          copyBtn.textContent = "Copiado";
          setTimeout(() => (copyBtn.textContent = "Copiar link"), 1800);
        } else {
          textarea.select();
          document.execCommand("copy");
          copyBtn.textContent = "Copiado";
          setTimeout(() => (copyBtn.textContent = "Copiar link"), 1800);
        }
      } catch (erro) {
        // Fallback: mostra prompt nativo
        window.prompt(
          "Copie o link de email abaixo e use no seu cliente de email:",
          textarea.value
        );
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", hideEmailFallback);
  if (openLink) openLink.addEventListener("click", hideEmailFallback);
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  renderReport();
  setupActions();
  setupSignatures();
  setupEmailFallback();
});

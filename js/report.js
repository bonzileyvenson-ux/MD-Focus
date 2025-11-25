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
  renderAnalysis(dados);
}

/**
 * Renderiza a seção de análise e recomendações
 */
function renderAnalysis(dados) {
  const analysisContent = document.getElementById("analysis-content");
  if (!analysisContent) return;

  const totalCaixas = dados.totalCaixas || 0;
  const totalErros = dados.totalErros || 0;
  const totalPontos = dados.realizadoTotal || 0;
  const metaMensal = dados.metaMensal || 0;

  const cards = [];

  // Análise de erros
  if (totalCaixas > 0) {
    const MAX_ERRO_PERCENT = 0.018; // 1.8%
    const erroRatio = totalErros / totalCaixas;
    const erroPercent = (erroRatio * 100).toFixed(2);
    const errosOk = erroRatio <= MAX_ERRO_PERCENT;

    if (!errosOk) {
      // Calcular quantas caixas sem erros são necessárias
      let caixasExtras = 0;
      let taxaNova = erroRatio;

      while (taxaNova > MAX_ERRO_PERCENT) {
        caixasExtras += 10;
        const novoTotalCaixas = totalCaixas + caixasExtras;
        taxaNova = totalErros / novoTotalCaixas;
        if (caixasExtras > 2000) break; // Limite de segurança
      }

      const totalFinal = totalCaixas + caixasExtras;
      const taxaFinal = ((totalErros / totalFinal) * 100).toFixed(2);

      cards.push({
        type: "danger",
        icon: "bi-exclamation-triangle-fill",
        title: "Taxa de Erros Acima do Limite",
        body: `
          Sua taxa atual de erros é <strong class="highlight">${erroPercent}%</strong>, 
          acima do limite de <strong>1.8%</strong>.
          <br><br>
          Com <strong>${totalErros}</strong> erros em <strong>${totalCaixas}</strong> caixas, 
          você está cometendo aproximadamente <strong>${(
            (totalErros / totalCaixas) *
            100
          ).toFixed(2)} erros a cada 100 caixas</strong>.
        `,
        recommendation: `
          <i class="bi bi-lightbulb recommendation-icon"></i>
          <strong>Recomendação:</strong> Faça <strong>${caixasExtras} caixas sem erros</strong> 
          para baixar sua taxa para ${taxaFinal}% (dentro do limite).
          <br>Total final: ${totalFinal.toLocaleString(
            "pt-BR"
          )} caixas com ${totalErros} erros.
        `,
      });
    } else {
      cards.push({
        type: "success",
        icon: "bi-check-circle-fill",
        title: "Taxa de Erros Excelente",
        body: `
          Parabéns! Sua taxa de erros está em <strong class="highlight">${erroPercent}%</strong>, 
          bem dentro do limite de <strong>1.8%</strong>.
          <br><br>
          Continue mantendo esse padrão de qualidade!
        `,
      });
    }
  }

  // Análise de meta
  if (metaMensal > 0) {
    const pontosOk = totalPontos >= metaMensal;
    const faltaPontos = metaMensal - totalPontos;
    const percentualAtingido = ((totalPontos / metaMensal) * 100).toFixed(1);

    if (!pontosOk && faltaPontos > 0) {
      // Calcular dias úteis restantes do mês
      const hoje = new Date();
      const ultimoDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0
      ).getDate();
      const diasRestantes = ultimoDia - hoje.getDate();
      const pontosPorDia = Math.ceil(faltaPontos / Math.max(diasRestantes, 1));

      cards.push({
        type: "warning",
        icon: "bi-graph-up-arrow",
        title: "Meta Mensal em Andamento",
        body: `
          Você atingiu <strong class="highlight">${percentualAtingido}%</strong> da meta mensal.
          <br><br>
          Faltam <strong>${faltaPontos.toLocaleString("pt-BR")} pontos</strong> 
          para completar os <strong>${metaMensal.toLocaleString(
            "pt-BR"
          )} pontos</strong> da meta.
        `,
        recommendation: `
          <i class="bi bi-lightbulb recommendation-icon"></i>
          <strong>Recomendação:</strong> Com aproximadamente <strong>${diasRestantes} dias restantes</strong> no mês, 
          você precisa fazer em média <strong>${pontosPorDia.toLocaleString(
            "pt-BR"
          )} pontos por dia</strong> para atingir sua meta.
        `,
      });
    } else if (pontosOk) {
      const excedente = totalPontos - metaMensal;
      cards.push({
        type: "success",
        icon: "bi-trophy-fill",
        title: "Meta Mensal Atingida",
        body: `
          Excelente! Você atingiu <strong class="highlight">${percentualAtingido}%</strong> da meta mensal.
          <br><br>
          Você superou a meta em <strong>${excedente.toLocaleString(
            "pt-BR"
          )} pontos</strong>!
        `,
      });
    }
  }

  // Renderizar cards
  if (cards.length === 0) {
    analysisContent.innerHTML =
      '<p style="text-align:center; color: #666;">Nenhuma análise disponível no momento.</p>';
    return;
  }

  analysisContent.innerHTML = cards
    .map(
      (card) => `
    <div class="analysis-card ${card.type}">
      <div class="card-header">
        <i class="bi ${card.icon} card-icon"></i>
        <div class="card-title">${card.title}</div>
      </div>
      <div class="card-body">
        ${card.body}
        ${
          card.recommendation
            ? `<div class="card-recommendation">${card.recommendation}</div>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");
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
// INSIGHTS E ANÁLISES AVANÇADAS
// ========================================

/**
 * Gera insights inteligentes baseados nos dados do usuário
 */
function generateInsights(dados) {
  const insightsContainer = document.getElementById("insights-grid");
  if (!insightsContainer) return;

  const historico = dados.historico || [];
  const realizadoDiario = dados.realizadoDiario || {};

  if (historico.length === 0) {
    insightsContainer.innerHTML =
      '<p style="text-align: center; color: #666;">Sem dados suficientes para gerar insights.</p>';
    return;
  }

  // Análise por dia da semana
  const porDiaSemana = {};
  const diasSemana = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  Object.entries(realizadoDiario).forEach(([dataKey, pontos]) => {
    const [ano, mes, dia] = dataKey.split("-");
    const data = new Date(ano, mes - 1, dia, 12, 0, 0);
    const diaSemana = data.getDay();

    if (!porDiaSemana[diaSemana]) {
      porDiaSemana[diaSemana] = { total: 0, count: 0 };
    }
    porDiaSemana[diaSemana].total += pontos;
    porDiaSemana[diaSemana].count += 1;
  });

  // Encontra melhor dia da semana
  let melhorDia = { nome: "", media: 0, diaSemana: 0 };
  Object.entries(porDiaSemana).forEach(([dia, dados]) => {
    const media = dados.total / dados.count;
    if (media > melhorDia.media) {
      melhorDia = { nome: diasSemana[dia], media, diaSemana: parseInt(dia) };
    }
  });

  // Calcula média geral
  const diasTrabalhados = Object.keys(realizadoDiario).length;
  const mediaGeral =
    diasTrabalhados > 0 ? dados.realizadoTotal / diasTrabalhados : 0;

  // Calcula sequência atual
  const datasOrdenadas = Object.keys(realizadoDiario).sort();
  let sequenciaAtual = 0;
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  for (let i = datasOrdenadas.length - 1; i >= 0; i--) {
    const [ano, mes, dia] = datasOrdenadas[i].split("-");
    const data = new Date(ano, mes - 1, dia, 12, 0, 0);
    const diffDias = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));

    if (diffDias === sequenciaAtual) {
      sequenciaAtual++;
    } else {
      break;
    }
  }

  // Tendência (últimos 7 dias vs 7 dias anteriores)
  const ultimos7 =
    datasOrdenadas
      .slice(-7)
      .reduce((sum, key) => sum + realizadoDiario[key], 0) / 7;
  const anteriores7 =
    datasOrdenadas
      .slice(-14, -7)
      .reduce((sum, key) => sum + realizadoDiario[key], 0) / 7;
  const tendencia =
    ultimos7 > anteriores7
      ? "crescente"
      : ultimos7 < anteriores7
      ? "decrescente"
      : "estável";

  // Gera cards de insights
  const insights = [
    {
      icon: "📅",
      title: "Melhor Dia da Semana",
      description: `Você trabalha melhor às ${melhorDia.nome}s`,
      value: `${melhorDia.media.toFixed(0)} pts/dia`,
    },
    {
      icon: "📊",
      title: "Média Diária",
      description: "Produtividade média por dia",
      value: `${mediaGeral.toFixed(0)} pts`,
    },
    {
      icon: "🔥",
      title: "Sequência Ativa",
      description:
        sequenciaAtual > 0
          ? "Dias consecutivos trabalhando"
          : "Nenhuma sequência ativa",
      value: `${sequenciaAtual} dias`,
    },
    {
      icon:
        tendencia === "crescente"
          ? "📈"
          : tendencia === "decrescente"
          ? "📉"
          : "➡️",
      title: "Tendência",
      description: "Últimos 7 dias vs anteriores",
      value:
        tendencia === "crescente"
          ? "Crescente"
          : tendencia === "decrescente"
          ? "Decrescente"
          : "Estável",
    },
  ];

  insightsContainer.innerHTML = insights
    .map(
      (insight) => `
    <div class="insight-card">
      <div class="insight-icon">${insight.icon}</div>
      <div class="insight-title">${insight.title}</div>
      <div class="insight-description">${insight.description}</div>
      <div class="insight-value">${insight.value}</div>
    </div>
  `
    )
    .join("");
}

/**
 * Gera ranking dos melhores dias
 */
function generateRanking(dados) {
  const rankingContainer = document.getElementById("ranking-content");
  if (!rankingContainer) return;

  const realizadoDiario = dados.realizadoDiario || {};

  if (Object.keys(realizadoDiario).length === 0) {
    rankingContainer.innerHTML =
      '<p style="text-align: center; color: #666;">Sem dados para ranking.</p>';
    return;
  }

  // Converte para array e ordena
  const diasOrdenados = Object.entries(realizadoDiario)
    .map(([dataKey, pontos]) => {
      const [ano, mes, dia] = dataKey.split("-");
      const data = new Date(ano, mes - 1, dia, 12, 0, 0);
      return {
        dataKey,
        dataFormatada: `${dia}/${mes}/${ano}`,
        pontos,
        diaSemana: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][
          data.getDay()
        ],
      };
    })
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 10); // Top 10

  rankingContainer.innerHTML = diasOrdenados
    .map((dia, index) => {
      const positionClass =
        index === 0
          ? "top-1"
          : index === 1
          ? "top-2"
          : index === 2
          ? "top-3"
          : "";
      const medal =
        index === 0
          ? "🥇"
          : index === 1
          ? "🥈"
          : index === 2
          ? "🥉"
          : `${index + 1}º`;

      return `
      <div class="ranking-item">
        <div class="ranking-position ${positionClass}">${medal}</div>
        <div class="ranking-day">
          ${dia.dataFormatada} (${dia.diaSemana})
        </div>
        <div class="ranking-value">${dia.pontos.toLocaleString(
          "pt-BR"
        )} pts</div>
      </div>
    `;
    })
    .join("");
}

/**
 * Gera comparativo mensal (mês atual vs mês anterior)
 */
function generateComparison(dados) {
  const comparisonContainer = document.getElementById("comparison-content");
  if (!comparisonContainer) return;

  const realizadoDiario = dados.realizadoDiario || {};
  const historico = dados.historico || [];

  if (Object.keys(realizadoDiario).length === 0) {
    comparisonContainer.innerHTML =
      '<p style="text-align: center; color: #666;">Sem dados para comparação.</p>';
    return;
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  let pontosAtual = 0,
    diasAtual = 0,
    errosAtual = 0;
  let pontosAnterior = 0,
    diasAnterior = 0,
    errosAnterior = 0;

  // Conta dados do mês atual
  Object.entries(realizadoDiario).forEach(([dataKey, pontos]) => {
    const [ano, mes] = dataKey.split("-");
    if (parseInt(ano) === anoAtual && parseInt(mes) - 1 === mesAtual) {
      pontosAtual += pontos;
      diasAtual++;
    } else if (
      parseInt(ano) === anoAnterior &&
      parseInt(mes) - 1 === mesAnterior
    ) {
      pontosAnterior += pontos;
      diasAnterior++;
    }
  });

  // Conta erros
  historico.forEach((item) => {
    if (!item.date) return;
    const [dia, mes, ano] = item.date.split("/");
    if (parseInt(ano) === anoAtual && parseInt(mes) - 1 === mesAtual) {
      if (item.obs && item.obs.match(/erros?\s*\((\d+)\)/i)) {
        const match = item.obs.match(/erros?\s*\((\d+)\)/i);
        errosAtual += parseInt(match[1]);
      }
    } else if (
      parseInt(ano) === anoAnterior &&
      parseInt(mes) - 1 === mesAnterior
    ) {
      if (item.obs && item.obs.match(/erros?\s*\((\d+)\)/i)) {
        const match = item.obs.match(/erros?\s*\((\d+)\)/i);
        errosAnterior += parseInt(match[1]);
      }
    }
  });

  const mediaAtual = diasAtual > 0 ? pontosAtual / diasAtual : 0;
  const mediaAnterior = diasAnterior > 0 ? pontosAnterior / diasAnterior : 0;

  // Calcula variações
  const variacaoPontos =
    pontosAnterior > 0
      ? ((pontosAtual - pontosAnterior) / pontosAnterior) * 100
      : 0;
  const variacaoMedia =
    mediaAnterior > 0
      ? ((mediaAtual - mediaAnterior) / mediaAnterior) * 100
      : 0;
  const variacaoErros =
    errosAnterior > 0
      ? ((errosAtual - errosAnterior) / errosAnterior) * 100
      : 0;

  const nomesMeses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const comparacoes = [
    {
      label: `Total ${nomesMeses[mesAtual]}`,
      value: pontosAtual.toLocaleString("pt-BR"),
      change: variacaoPontos,
      icon:
        variacaoPontos > 0
          ? "bi-arrow-up"
          : variacaoPontos < 0
          ? "bi-arrow-down"
          : "bi-dash",
    },
    {
      label: "Média Diária",
      value: mediaAtual.toFixed(0),
      change: variacaoMedia,
      icon:
        variacaoMedia > 0
          ? "bi-arrow-up"
          : variacaoMedia < 0
          ? "bi-arrow-down"
          : "bi-dash",
    },
    {
      label: "Dias Trabalhados",
      value: diasAtual,
      change:
        diasAnterior > 0
          ? ((diasAtual - diasAnterior) / diasAnterior) * 100
          : 0,
      icon:
        diasAtual > diasAnterior
          ? "bi-arrow-up"
          : diasAtual < diasAnterior
          ? "bi-arrow-down"
          : "bi-dash",
    },
    {
      label: "Erros",
      value: errosAtual,
      change: variacaoErros,
      icon:
        variacaoErros > 0
          ? "bi-arrow-up"
          : variacaoErros < 0
          ? "bi-arrow-down"
          : "bi-dash",
      invertColor: true, // Para erros, vermelho = ruim
    },
  ];

  comparisonContainer.innerHTML = comparacoes
    .map((comp) => {
      const changeClass =
        comp.change > 0
          ? comp.invertColor
            ? "negative"
            : "positive"
          : comp.change < 0
          ? comp.invertColor
            ? "positive"
            : "negative"
          : "neutral";

      const changeText =
        comp.change === 0
          ? "Sem alteração"
          : `${comp.change > 0 ? "+" : ""}${comp.change.toFixed(1)}% vs ${
              nomesMeses[mesAnterior]
            }`;

      return `
      <div class="comparison-card">
        <div class="comparison-label">${comp.label}</div>
        <div class="comparison-value">${comp.value}</div>
        <div class="comparison-change ${changeClass}">
          <i class="bi ${comp.icon}"></i>
          ${changeText}
        </div>
      </div>
    `;
    })
    .join("");
}

// ========================================
// DADOS FICTÍCIOS PARA DEMONSTRAÇÃO
// ========================================
function gerarDadosFicticios() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const historico = [];
  const realizadoDiario = {};
  const observacoesDiarias = {};

  // Gera 20 dias de dados do mês atual
  for (let i = 1; i <= 20; i++) {
    const data = new Date(ano, mes, i);
    const diaSemana = data.getDay();

    // Pula finais de semana
    if (diaSemana === 0 || diaSemana === 6) continue;

    const dataKey = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(
      i
    ).padStart(2, "0")}`;
    const dataBR = `${String(i).padStart(2, "0")}/${String(mes + 1).padStart(
      2,
      "0"
    )}/${ano}`;

    // Varia pontos entre 15 e 25
    const pontos = Math.floor(Math.random() * 11) + 15;
    realizadoDiario[dataKey] = pontos;

    // Adiciona alguns erros aleatoriamente
    let obs = "";
    if (Math.random() > 0.7) {
      const erros = Math.floor(Math.random() * 2) + 1;
      obs = `Erros (${erros})`;
      observacoesDiarias[dataKey] = obs;
    }

    historico.push({
      data: dataBR,
      valor: pontos,
      obs: obs,
    });
  }

  // Adiciona dados do mês anterior para comparação
  for (let i = 1; i <= 22; i++) {
    const data = new Date(ano, mes - 1, i);
    const diaSemana = data.getDay();

    if (diaSemana === 0 || diaSemana === 6) continue;

    const dataBR = `${String(i).padStart(2, "0")}/${String(mes).padStart(
      2,
      "0"
    )}/${ano}`;
    const pontos = Math.floor(Math.random() * 10) + 13;

    let obs = "";
    if (Math.random() > 0.65) {
      const erros = Math.floor(Math.random() * 3) + 1;
      obs = `Erros (${erros})`;
    }

    historico.push({
      data: dataBR,
      valor: pontos,
      obs: obs,
    });
  }

  const totalPontos = Object.values(realizadoDiario).reduce((a, b) => a + b, 0);

  return {
    nome: "Usuário Demo",
    metaMensal: 300,
    realizadoTotal: totalPontos,
    totalCaixas: Math.floor(totalPontos * 8.5),
    totalErros: Math.floor(Math.random() * 15) + 8,
    historico: historico,
    realizadoDiario: realizadoDiario,
    observacoesDiarias: observacoesDiarias,
    diasOffAgendados: [],
  };
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se há parâmetro ?demo na URL
  const urlParams = new URLSearchParams(window.location.search);
  const modoDemo = urlParams.get("demo") === "true";

  let dados;
  if (modoDemo) {
    dados = gerarDadosFicticios();
    console.log("📊 Modo demonstração ativado com dados fictícios");
  } else {
    dados = safeGetDadosUsuario();
  }

  renderReport();
  if (dados) {
    generateInsights(dados);
    generateRanking(dados);
    generateComparison(dados);
  }
  setupActions();
  setupSignatures();
  setupEmailFallback();
});

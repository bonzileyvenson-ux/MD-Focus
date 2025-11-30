// ============================================================================
// CHARTS.JS - Sistema de Gráficos com Chart.js
// ============================================================================
// 📊 Propósito: Visualizar progresso mensal com gráficos de linhas
// 🎯 Contexto: Dados alimentados manualmente pelo usuário
// ============================================================================

import { getDadosUsuario } from "./data.js";

/**
 * Gerenciador de Gráficos
 */
class ChartManager {
  constructor() {
    this.chartInstance = null;
    this.chartColors = {
      primary: "rgba(0, 123, 255, 1)", // Azul vibrante
      primaryLight: "rgba(0, 123, 255, 0.15)",
      primaryGlow: "rgba(0, 123, 255, 0.4)",
      success: "rgba(40, 200, 100, 1)", // Verde mais vibrante
      successLight: "rgba(40, 200, 100, 0.15)",
      danger: "rgba(255, 70, 70, 1)", // Vermelho para falhas
      dangerLight: "rgba(255, 70, 70, 0.2)",
      warning: "rgba(255, 193, 7, 1)",
      gold: "rgba(255, 215, 0, 1)", // Ouro para destaques
      grid: "rgba(255, 255, 255, 0.08)",
      gridStrong: "rgba(255, 255, 255, 0.15)",
    };
    this.maxDaysToShow = 14; // Mostrar apenas últimos 14 dias
  }

  /**
   * Cria gráfico de linha do progresso mensal
   */
  createProgressLineChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} não encontrado`);
      return;
    }

    const ctx = canvas.getContext("2d");
    const dados = getDadosUsuario();

    // Prepara dados do gráfico
    const chartData = this.prepareChartData(dados);

    // Destrói gráfico anterior se existir
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Cria novo gráfico
    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "📊 Pontos Diários",
            data: chartData.pontosRealizados,
            borderColor: this.chartColors.primary,
            backgroundColor: this.chartColors.primaryLight,
            borderWidth: 3,
            fill: true,
            tension: 0.3, // Curva suave
            pointRadius: 7,
            pointHoverRadius: 10,
            pointBackgroundColor: chartData.backgroundColors, // Cores dinâmicas
            pointBorderColor: "#fff",
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4,
            segment: {
              // Destaca segmentos acima da meta com cor diferente
              borderColor: (ctx) => {
                const metaDiaria = dados.metaMensal / 22;
                const value = ctx.p1.parsed.y;
                return value >= metaDiaria
                  ? this.chartColors.success
                  : this.chartColors.primary;
              },
            },
          },
          {
            label: "🎯 Meta Diária",
            data: chartData.metaDiaria,
            borderColor: this.chartColors.successLight,
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [10, 5], // Linha tracejada
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: "📈 Média Móvel (3 dias)",
            data: chartData.mediaMovel,
            borderColor: this.chartColors.warning,
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [5, 3],
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.chartColors.warning,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 35, // Espaço para labels dos pontos
            bottom: 15,
            left: 15,
            right: 15,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom", // Legenda embaixo para economizar espaço
            align: "center",
            labels: {
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 12,
                family: "Poppins, sans-serif",
                weight: "500",
              },
              padding: 10,
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 10,
              boxHeight: 10,
              generateLabels: (chart) => {
                // Labels customizados com emojis
                const original =
                  Chart.defaults.plugins.legend.labels.generateLabels(chart);
                return original;
              },
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            titleColor: "#fff",
            bodyColor: "#fff",
            titleFont: {
              size: 14,
              weight: "bold",
              family: "Poppins, sans-serif",
            },
            bodyFont: {
              size: 13,
              family: "Poppins, sans-serif",
            },
            borderColor: this.chartColors.primaryGlow,
            borderWidth: 2,
            padding: 14,
            displayColors: true,
            boxWidth: 12,
            boxHeight: 12,
            boxPadding: 6,
            callbacks: {
              title: (tooltipItems) => {
                return `📅 ${tooltipItems[0].label}`;
              },
              label: (context) => {
                const label = context.dataset.label || "";
                const value = context.parsed.y;

                if (value === null || value === undefined) {
                  return `  ${label}: --`;
                }

                return `  ${label}: ${value} pts`;
              },
              afterLabel: (context) => {
                // Mostra análise se for pontos realizados
                if (context.datasetIndex === 0) {
                  const dados = getDadosUsuario();
                  const metaDiaria = dados.metaMensal / 22;
                  const valor = context.parsed.y;
                  const percentual = Math.round((valor / metaDiaria) * 100);

                  let emoji = "";
                  let status = "";

                  if (percentual >= 100) {
                    emoji = "🔥";
                    status = "Meta batida!";
                  } else if (percentual >= 80) {
                    emoji = "👍";
                    status = "Quase lá!";
                  } else if (percentual >= 50) {
                    emoji = "⚡";
                    status = "No caminho";
                  } else {
                    emoji = "⚠️";
                    status = "Abaixo da meta";
                  }

                  return `  ${emoji} ${percentual}% - ${status}`;
                }
                return "";
              },
            },
          },
          // Plugin customizado para mostrar valores nos pontos
          datalabels: false, // Desativa plugin padrão (usamos customizado)
        },
        scales: {
          x: {
            grid: {
              color: this.chartColors.grid,
              drawBorder: false,
              lineWidth: 1,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.85)",
              font: {
                size: 10,
                family: "Poppins, sans-serif",
                weight: "500",
              },
              maxRotation: 45, // Permite rotação se necessário
              minRotation: 0,
              padding: 6,
              autoSkip: true, // Pula labels se muito cheio
              maxTicksLimit: 10, // Máximo de 10 labels
            },
            title: {
              display: true,
              text: "📅 Período",
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 11,
                weight: "bold",
                family: "Poppins, sans-serif",
              },
              padding: 8,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: (context) => {
                // Grid mais forte na linha da meta
                const metaDiaria = dados.metaMensal / 22;
                if (context.tick.value === Math.round(metaDiaria)) {
                  return this.chartColors.gridStrong;
                }
                return this.chartColors.grid;
              },
              drawBorder: false,
              lineWidth: 1,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.85)",
              font: {
                size: 11,
                family: "Poppins, sans-serif",
                weight: "500",
              },
              padding: 8,
              maxTicksLimit: 8, // Limita a 8 marcações no eixo Y
              callback: (value) => `${value}`,
            },
            title: {
              display: true,
              text: "📊 Pontos",
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 11,
                weight: "bold",
                family: "Poppins, sans-serif",
              },
              padding: 8,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        animation: {
          duration: 1200,
          easing: "easeInOutCubic",
          onProgress: (animation) => {
            // Animação suave
          },
        },
        hover: {
          mode: "index",
          intersect: false,
        },
      },
      // Plugins customizados
      plugins: [
        {
          id: "pointLabels",
          afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const dataset = chart.data.datasets[0]; // Pontos diários
            const meta = chart.getDatasetMeta(0);
            const metaDiaria = dados.metaMensal / 22;

            meta.data.forEach((point, index) => {
              const value = dataset.data[index];
              if (value === 0 || value === null || value === undefined) return;

              ctx.save();
              ctx.font = "bold 12px Poppins, sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";

              const x = point.x;
              const y = point.y - 10;

              // Cor do fundo baseada no desempenho
              let bgColor = "rgba(0, 0, 0, 0.75)";
              let borderColor = this.chartColors.primary;

              if (value >= metaDiaria) {
                bgColor = "rgba(40, 200, 100, 0.8)";
                borderColor = this.chartColors.success;
              } else if (value >= metaDiaria * 0.8) {
                bgColor = "rgba(255, 193, 7, 0.8)";
                borderColor = this.chartColors.warning;
              } else {
                bgColor = "rgba(255, 70, 70, 0.8)";
                borderColor = this.chartColors.danger;
              }

              // Fundo colorido com borda
              const textWidth = ctx.measureText(value).width;
              const padding = 6;
              const rectWidth = textWidth + padding * 2;
              const rectHeight = 18;
              const rectX = x - rectWidth / 2;
              const rectY = y - rectHeight;

              // Sombra
              ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetY = 2;

              // Retângulo com cantos arredondados
              ctx.fillStyle = bgColor;
              ctx.beginPath();
              ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 4);
              ctx.fill();

              // Borda
              ctx.strokeStyle = borderColor;
              ctx.lineWidth = 2;
              ctx.stroke();

              // Remove sombra para o texto
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;

              // Texto branco
              ctx.fillStyle = "#fff";
              ctx.fillText(value, x, y - 3);
              ctx.restore();
            });
          },
        },
        {
          id: "metaLine",
          afterDatasetsDraw: (chart) => {
            // Linha horizontal destacando a meta
            const ctx = chart.ctx;
            const yScale = chart.scales.y;
            const metaDiaria = dados.metaMensal / 22;
            const y = yScale.getPixelForValue(metaDiaria);

            ctx.save();
            ctx.strokeStyle = this.chartColors.gridStrong;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, y);
            ctx.lineTo(chart.chartArea.right, y);
            ctx.stroke();
            ctx.restore();
          },
        },
      ],
    });

    return this.chartInstance;
  }

  /**
   * Prepara dados do histórico para o gráfico
   */
  prepareChartData(dados) {
    const labels = [];
    const pontosRealizados = [];
    const backgroundColors = [];
    const metaDiaria = dados.metaMensal / 22;
    const metaDiariaArray = [];

    // Ordena as datas
    const datasOrdenadas = Object.keys(dados.realizadoDiario).sort();

    // Pega apenas últimos X dias
    const datasRecentes = datasOrdenadas.slice(-this.maxDaysToShow);

    // Se não tiver dados, mostra últimos 7 dias
    if (datasRecentes.length === 0) {
      for (let i = 6; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(dia.getDate() - i);
        const dataFormatada = this.formatDate(dia);
        labels.push(dataFormatada);
        pontosRealizados.push(0);
        metaDiariaArray.push(metaDiaria);
        backgroundColors.push(this.chartColors.danger);
      }
    } else {
      // Usa dados reais (últimos X dias)
      datasRecentes.forEach((data) => {
        const [ano, mes, dia] = data.split("-");
        const dataObj = new Date(ano, mes - 1, dia);
        const dataFormatada = this.formatDate(dataObj, true); // Com dia da semana

        const pontos = dados.realizadoDiario[data];

        labels.push(dataFormatada);
        pontosRealizados.push(pontos);
        metaDiariaArray.push(metaDiaria);

        // Cor baseada no desempenho
        if (pontos >= metaDiaria) {
          backgroundColors.push(this.chartColors.success); // Verde se bateu meta
        } else if (pontos >= metaDiaria * 0.8) {
          backgroundColors.push(this.chartColors.warning); // Amarelo se 80%+
        } else {
          backgroundColors.push(this.chartColors.danger); // Vermelho se abaixo
        }
      });
    }

    // Calcula média móvel (últimos 3 dias)
    const mediaMovel = this.calcularMediaMovel(pontosRealizados, 3);

    return {
      labels,
      pontosRealizados,
      metaDiaria: metaDiariaArray,
      backgroundColors,
      mediaMovel,
    };
  }

  /**
   * Calcula média móvel
   */
  calcularMediaMovel(dados, janela) {
    const resultado = [];
    for (let i = 0; i < dados.length; i++) {
      if (i < janela - 1) {
        resultado.push(null); // Não há dados suficientes
      } else {
        const soma = dados
          .slice(i - janela + 1, i + 1)
          .reduce((acc, val) => acc + val, 0);
        resultado.push(Math.round(soma / janela));
      }
    }
    return resultado;
  }

  /**
   * Formata data para exibição no gráfico
   */
  formatDate(date, comDiaSemana = false) {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");

    if (comDiaSemana) {
      const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const dataSemanal = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const diaSemana = diasSemana[dataSemanal.getDay()];
      return `${diaSemana} ${dia}/${mes}`;
    }

    return `${dia}/${mes}`;
  }

  /**
   * Atualiza o gráfico com novos dados
   */
  updateChart() {
    if (!this.chartInstance) return;

    const dados = getDadosUsuario();
    const chartData = this.prepareChartData(dados);

    this.chartInstance.data.labels = chartData.labels;
    this.chartInstance.data.datasets[0].data = chartData.pontosRealizados;
    this.chartInstance.data.datasets[1].data = chartData.metaDiaria;

    this.chartInstance.update("active");
  }

  /**
   * Cria gráfico de progresso acumulado (linha crescente)
   */
  createCumulativeChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dados = getDadosUsuario();
    const chartData = this.prepareCumulativeData(dados);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Progresso Acumulado",
            data: chartData.acumulado,
            borderColor: this.chartColors.success,
            backgroundColor: this.chartColors.successLight,
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.chartColors.success,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Meta Mensal",
            data: chartData.metaMensal,
            borderColor: this.chartColors.warning,
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [10, 5],
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#fff",
              font: { size: 14, family: "Poppins, sans-serif" },
              padding: 15,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: this.chartColors.success,
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (context.datasetIndex === 0) {
                  const percentual = Math.round(
                    (value / dados.metaMensal) * 100
                  );
                  return `Acumulado: ${value} pts (${percentual}%)`;
                }
                return `Meta: ${value} pts`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: this.chartColors.grid, drawBorder: false },
            ticks: { color: "#fff", font: { size: 11 }, maxRotation: 45 },
          },
          y: {
            beginAtZero: true,
            grid: { color: this.chartColors.grid, drawBorder: false },
            ticks: {
              color: "#fff",
              font: { size: 12 },
              callback: (value) => `${value} pts`,
            },
          },
        },
        animation: {
          duration: 1200,
          easing: "easeInOutCubic",
        },
      },
    });

    return this.chartInstance;
  }

  /**
   * Prepara dados acumulados
   */
  prepareCumulativeData(dados) {
    const labels = [];
    const acumulado = [];
    const metaMensalArray = [];

    const datasOrdenadas = Object.keys(dados.realizadoDiario).sort();

    let soma = 0;
    datasOrdenadas.forEach((data) => {
      const [ano, mes, dia] = data.split("-");
      const dataObj = new Date(ano, mes - 1, dia);
      const dataFormatada = this.formatDate(dataObj);

      soma += dados.realizadoDiario[data];

      labels.push(dataFormatada);
      acumulado.push(soma);
      metaMensalArray.push(dados.metaMensal);
    });

    // Se não tiver dados, mostra linha zerada
    if (datasOrdenadas.length === 0) {
      for (let i = 6; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(dia.getDate() - i);
        labels.push(this.formatDate(dia));
        acumulado.push(0);
        metaMensalArray.push(dados.metaMensal);
      }
    }

    return {
      labels,
      acumulado,
      metaMensal: metaMensalArray,
    };
  }

  /**
   * Destrói o gráfico atual
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}

// Instância global
const chartManager = new ChartManager();

// Exporta para uso global
window.chartManager = chartManager;

export default chartManager;

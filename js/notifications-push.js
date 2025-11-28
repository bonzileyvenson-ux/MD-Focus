// ============================================================================
// NOTIFICATIONS-PUSH.JS - Sistema de Notificações Push
// ============================================================================
// 📱 Propósito: Enviar notificações inteligentes baseadas no progresso
// 🎯 Contexto: Usuário alimenta dados manualmente (sem integração em tempo real)
// ============================================================================

import { getDadosUsuario } from "./data.js";

/**
 * Gerenciador de Notificações Push
 */
class PushNotificationManager {
  constructor() {
    this.permission = "default";
    this.isSupported = "Notification" in window;
    this.scheduledNotifications = [];
  }

  /**
   * Verifica se notificações são suportadas e solicita permissão
   */
  async init() {
    if (!this.isSupported) {
      console.log("❌ Notificações não suportadas neste navegador");
      return false;
    }

    // Verifica se já tem permissão salva
    const savedPermission = localStorage.getItem("notification-permission");
    if (savedPermission === "granted") {
      this.permission = Notification.permission;
      if (this.permission === "granted") {
        this.scheduleSmartNotifications();
        return true;
      }
    }

    return false;
  }

  /**
   * Solicita permissão do usuário para enviar notificações
   */
  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      localStorage.setItem("notification-permission", this.permission);

      if (this.permission === "granted") {
        this.sendNotification(
          "🎉 Notificações Ativadas!",
          "Você receberá lembretes e parabenizações baseadas no seu progresso.",
          "/favicon.png"
        );
        this.scheduleSmartNotifications();
        return true;
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
    }

    return false;
  }

  /**
   * Envia uma notificação
   */
  sendNotification(title, body, icon = "/favicon.png", tag = null) {
    if (this.permission !== "granted") return;

    const options = {
      body,
      icon,
      badge: "/favicon.png",
      tag: tag || `notif-${Date.now()}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };

    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-fecha após 5 segundos
    setTimeout(() => notification.close(), 5000);

    return notification;
  }

  /**
   * Agenda notificações inteligentes baseadas no contexto do usuário
   */
  scheduleSmartNotifications() {
    // Limpa agendamentos anteriores
    this.scheduledNotifications.forEach((id) => clearTimeout(id));
    this.scheduledNotifications = [];

    const dados = getDadosUsuario();
    if (!dados) return;

    // 1. LEMBRETE DE FIM DO DIA (17h30) - "Já registrou seus pontos?"
    this.scheduleEndOfDayReminder();

    // 2. MOTIVACIONAL DE INÍCIO (8h30) - "Bom dia! Vamos conquistar a meta!"
    this.scheduleMorningMotivation();

    // 3. CHECK-IN DE MEIO DO DIA (12h30) - "Como está o progresso?"
    this.scheduleMidDayCheckIn();

    // 4. PARABENIZAÇÃO (quando bate meta)
    this.scheduleCongratulations();

    // 5. ALERTA DE ATRASO (baseado em dias sem registro)
    this.scheduleDelayAlert();
  }

  /**
   * Lembrete de fim do dia (17h30)
   */
  scheduleEndOfDayReminder() {
    const now = new Date();
    const reminder = new Date();
    reminder.setHours(17, 30, 0, 0);

    // Se já passou das 17h30, agenda para amanhã
    if (now > reminder) {
      reminder.setDate(reminder.getDate() + 1);
    }

    const delay = reminder.getTime() - now.getTime();

    const id = setTimeout(() => {
      const dados = getDadosUsuario();
      const hoje = new Date().toISOString().split("T")[0];
      const registrouHoje = dados.realizadoDiario[hoje] !== undefined;

      if (!registrouHoje) {
        this.sendNotification(
          "⏰ Lembrete MD Focus",
          "Não esqueça de registrar seus pontos de hoje! 📝",
          "/favicon.png",
          "end-of-day"
        );
      } else {
        const percentual = Math.round(
          (dados.realizadoTotal / dados.metaMensal) * 100
        );
        this.sendNotification(
          "✅ Registro Feito!",
          `Você está em ${percentual}% da meta mensal. Continue assim! 🚀`,
          "/favicon.png",
          "progress-update"
        );
      }

      // Reagenda para amanhã
      this.scheduleEndOfDayReminder();
    }, delay);

    this.scheduledNotifications.push(id);
  }

  /**
   * Motivacional de manhã (8h30)
   */
  scheduleMorningMotivation() {
    const now = new Date();
    const morning = new Date();
    morning.setHours(8, 30, 0, 0);

    if (now > morning) {
      morning.setDate(morning.getDate() + 1);
    }

    const delay = morning.getTime() - now.getTime();

    const id = setTimeout(() => {
      const frases = [
        "Bom dia! Vamos conquistar mais um dia produtivo! 💪",
        "Novo dia, nova oportunidade de bater a meta! 🎯",
        "Foco e determinação! Você consegue! 🌟",
        "Mais um dia para brilhar! Vamos lá! ⭐",
        "A vitória pertence aos persistentes! 🏆",
      ];

      const frase = frases[Math.floor(Math.random() * frases.length)];

      this.sendNotification(
        "☀️ Bom Dia!",
        frase,
        "/favicon.png",
        "morning-motivation"
      );

      // Reagenda para amanhã
      this.scheduleMorningMotivation();
    }, delay);

    this.scheduledNotifications.push(id);
  }

  /**
   * Check-in de meio do dia (12h30)
   */
  scheduleMidDayCheckIn() {
    const now = new Date();
    const midDay = new Date();
    midDay.setHours(12, 30, 0, 0);

    if (now > midDay) {
      midDay.setDate(midDay.getDate() + 1);
    }

    const delay = midDay.getTime() - now.getTime();

    const id = setTimeout(() => {
      const dados = getDadosUsuario();
      const percentual = Math.round(
        (dados.realizadoTotal / dados.metaMensal) * 100
      );

      let mensagem = "";
      let emoji = "";

      if (percentual >= 90) {
        emoji = "🔥";
        mensagem = `Incrível! Você está em ${percentual}% da meta. Quase lá!`;
      } else if (percentual >= 70) {
        emoji = "💪";
        mensagem = `Bom ritmo! ${percentual}% da meta já conquistados.`;
      } else if (percentual >= 50) {
        emoji = "⚡";
        mensagem = `Continue firme! Você está em ${percentual}% da meta.`;
      } else {
        emoji = "🎯";
        mensagem = `Foco! ${percentual}% da meta. Você consegue acelerar!`;
      }

      this.sendNotification(
        `${emoji} Check-in do Meio do Dia`,
        mensagem,
        "/favicon.png",
        "mid-day-checkin"
      );

      // Reagenda para amanhã
      this.scheduleMidDayCheckIn();
    }, delay);

    this.scheduledNotifications.push(id);
  }

  /**
   * Parabenização quando bate meta
   */
  scheduleCongratulations() {
    // Verifica a cada hora se bateu a meta
    const checkInterval = setInterval(() => {
      const dados = getDadosUsuario();
      const percentual = (dados.realizadoTotal / dados.metaMensal) * 100;

      // Verifica se bateu 100% e ainda não parabenizou hoje
      const lastCongrats = localStorage.getItem("last-congrats-date");
      const hoje = new Date().toISOString().split("T")[0];

      if (percentual >= 100 && lastCongrats !== hoje) {
        this.sendNotification(
          "🎉🎊 PARABÉNS! 🎊🎉",
          "Você atingiu 100% da meta mensal! Incrível! 🏆",
          "/favicon.png",
          "congratulations"
        );
        localStorage.setItem("last-congrats-date", hoje);
      }
    }, 3600000); // A cada 1 hora

    this.scheduledNotifications.push(checkInterval);
  }

  /**
   * Alerta de atraso (se 2+ dias sem registro)
   */
  scheduleDelayAlert() {
    // Verifica diariamente às 20h
    const now = new Date();
    const check = new Date();
    check.setHours(20, 0, 0, 0);

    if (now > check) {
      check.setDate(check.getDate() + 1);
    }

    const delay = check.getTime() - now.getTime();

    const id = setTimeout(() => {
      const dados = getDadosUsuario();
      const hoje = new Date();
      const diasSemRegistro = [];

      // Verifica últimos 5 dias úteis
      for (let i = 1; i <= 5; i++) {
        const dia = new Date(hoje);
        dia.setDate(dia.getDate() - i);

        // Pula finais de semana
        if (dia.getDay() === 0 || dia.getDay() === 6) continue;

        const dataKey = dia.toISOString().split("T")[0];
        if (!dados.realizadoDiario[dataKey]) {
          diasSemRegistro.push(dataKey);
        }
      }

      if (diasSemRegistro.length >= 2) {
        this.sendNotification(
          "⚠️ Atenção!",
          `Você tem ${diasSemRegistro.length} dias sem registro. Não se esqueça de atualizar! 📝`,
          "/favicon.png",
          "delay-alert"
        );
      }

      // Reagenda para amanhã
      this.scheduleDelayAlert();
    }, delay);

    this.scheduledNotifications.push(id);
  }

  /**
   * Cancela todas as notificações agendadas
   */
  cancelAll() {
    this.scheduledNotifications.forEach((id) => {
      if (typeof id === "number") {
        clearTimeout(id);
      } else {
        clearInterval(id);
      }
    });
    this.scheduledNotifications = [];
  }

  /**
   * Desativa notificações
   */
  disable() {
    this.cancelAll();
    localStorage.removeItem("notification-permission");
    console.log("✅ Notificações desativadas");
  }
}

// Instância global
const pushManager = new PushNotificationManager();

// Auto-inicializa se já tiver permissão
pushManager.init();

// Exporta para uso global
window.pushManager = pushManager;

export default pushManager;

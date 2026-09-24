import { NotificationSettings, ActiveMealReminder, MealType, Meal } from '../types';
import { playNotificationSound } from '../utils/notificationAudio';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  smartSkipIfLogged: true,
  browserNotifications: true,
  reminders: {
    breakfast: {
      id: 'breakfast',
      mealType: 'breakfast',
      label: 'Café da Manhã',
      time: '08:00',
      enabled: true,
      message: 'Bom dia! Hora de abastecer com seu café da manhã. Já registrou seus alimentos no NutriMacro?',
    },
    lunch: {
      id: 'lunch',
      mealType: 'lunch',
      label: 'Almoço',
      time: '12:30',
      enabled: true,
      message: 'Hora do almoço! Lembre-se de fotografar ou registrar seus pratos para manter os macros no alvo.',
    },
    snack: {
      id: 'snack',
      mealType: 'snack',
      label: 'Lanche da Tarde',
      time: '16:00',
      enabled: true,
      message: 'Pausa para o lanche! Registre suas calorias e proteínas para manter a energia alta.',
    },
    dinner: {
      id: 'dinner',
      mealType: 'dinner',
      label: 'Jantar',
      time: '19:30',
      enabled: true,
      message: 'Hora do jantar! Registre sua última refeição principal para fechar o dia com chave de ouro.',
    },
  },
};

const STORAGE_KEY = 'nutrimacro_notification_settings';
const LOGGED_NOTIFICATIONS_KEY = 'nutrimacro_last_notified_map';

let activeSwRegistration: ServiceWorkerRegistration | null = null;
let isSwRegistered = false;

export class LocalNotificationService {
  /**
   * Initializes the Service Worker for background Push notifications
   */
  static async initServiceWorker(
    onNotificationClickCallback?: (action: string, mealType?: MealType) => void
  ): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.info('[LocalNotificationService] Service Workers not supported in this browser.');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      activeSwRegistration = registration;
      isSwRegistered = true;
      console.log('[LocalNotificationService] Service Worker registered successfully:', registration.scope);

      // Listen for notification interaction messages sent back from Service Worker
      navigator.serviceWorker.onmessage = (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          console.log('[LocalNotificationService] Notification clicked in background:', event.data);
          if (onNotificationClickCallback) {
            onNotificationClickCallback(event.data.action, event.data.mealType);
          }
        }
      };

      return registration;
    } catch (err) {
      console.warn('[LocalNotificationService] Failed to register Service Worker:', err);
      return null;
    }
  }

  static getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
    return activeSwRegistration;
  }

  static isServiceWorkerActive(): boolean {
    return isSwRegistered && Boolean(activeSwRegistration);
  }

  static getSettings(): NotificationSettings {
    if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...parsed,
          reminders: {
            ...DEFAULT_NOTIFICATION_SETTINGS.reminders,
            ...(parsed.reminders || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Error reading notification settings from storage:', e);
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  static saveSettings(settings: NotificationSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      this.syncRemindersWithServiceWorker(settings);
    } catch (e) {
      console.warn('Error saving notification settings:', e);
    }
  }

  static syncRemindersWithServiceWorker(settings: NotificationSettings): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDERS',
        reminders: Object.values(settings.reminders).filter((r) => r.enabled),
        settings,
      });
    }
  }

  static getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  static async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Ensure Service Worker is registered when permission is granted
        await this.initServiceWorker();
        const settings = this.getSettings();
        this.syncRemindersWithServiceWorker(settings);
      }
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  static isAlreadyNotified(dateStr: string, reminderId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(LOGGED_NOTIFICATIONS_KEY);
      if (stored) {
        const map: Record<string, boolean> = JSON.parse(stored);
        return !!map[`${dateStr}_${reminderId}`];
      }
    } catch {}
    return false;
  }

  static markAsNotified(dateStr: string, reminderId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LOGGED_NOTIFICATIONS_KEY);
      const map: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      map[`${dateStr}_${reminderId}`] = true;
      localStorage.setItem(LOGGED_NOTIFICATIONS_KEY, JSON.stringify(map));
    } catch {}
    return;
  }

  /**
   * Dispatches a system/push notification.
   * Prioritizes ServiceWorker showNotification to guarantee notifications show
   * even when the browser/tab is in background, minimized, or out of focus.
   */
  static async sendSystemNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      icon?: string;
      mealType?: MealType;
      onClick?: () => void;
    }
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const iconPath = options.icon || '/icon-192.svg';
    const tag = options.tag || `nutrimacro_${Date.now()}`;
    const mealType = options.mealType || 'lunch';

    // 1. Preferred method: Service Worker showNotification (works out of focus & background)
    if ('serviceWorker' in navigator) {
      try {
        let registration: ServiceWorkerRegistration | null | undefined = activeSwRegistration;
        if (!registration) {
          registration = await navigator.serviceWorker.getRegistration();
          activeSwRegistration = registration ?? null;
        }

        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body: options.body,
            icon: iconPath,
            badge: iconPath,
            tag,
            renotify: true,
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: {
              url: `/?action=log_meal&type=${mealType}`,
              mealType,
              timestamp: Date.now(),
            },
            actions: [
              { action: 'log_meal', title: '🍽️ Registrar' },
              { action: 'view_diary', title: '📅 Diário' },
            ],
          } as any);
          return true;
        }
      } catch (swErr) {
        console.warn('[LocalNotificationService] ServiceWorker showNotification failed, using fallback:', swErr);
      }
    }

    // 2. Fallback: Standard window Notification constructor
    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: iconPath,
        tag,
        requireInteraction: false,
      });

      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      return true;
    } catch (err) {
      console.debug('Failed to construct Notification:', err);
      return false;
    }
  }

  /**
   * Checks current time against configured meal reminder times.
   * If matched and not already notified today, triggers the notification.
   */
  static checkReminders(
    settings: NotificationSettings,
    todayMeals: Meal[],
    onTriggerReminder: (reminder: ActiveMealReminder) => void
  ): void {
    if (!settings.enabled) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const reminderList = Object.values(settings.reminders);

    for (const reminder of reminderList) {
      if (!reminder.enabled) continue;

      // Check time match (within the exact minute)
      if (reminder.time === currentTimeStr) {
        // If already notified today, skip
        if (this.isAlreadyNotified(todayStr, reminder.id)) {
          continue;
        }

        // Smart skip: if user already has a logged meal of this type today
        if (settings.smartSkipIfLogged) {
          const alreadyLogged = todayMeals.some((m) => m.type === reminder.mealType);
          if (alreadyLogged) {
            this.markAsNotified(todayStr, reminder.id);
            continue;
          }
        }

        // Mark as dispatched
        this.markAsNotified(todayStr, reminder.id);

        // Play audio if enabled
        if (settings.sound) {
          playNotificationSound();
        }

        const activeRemItem: ActiveMealReminder = {
          id: `${reminder.id}_${Date.now()}`,
          mealType: reminder.mealType,
          title: `Lembrete: ${reminder.label}`,
          message: reminder.message,
          time: currentTimeStr,
          scheduledTime: reminder.time,
        };

        // Send browser push notification (triggers even if app is out of focus/minimized)
        if (settings.browserNotifications && this.getPermissionStatus() === 'granted') {
          this.sendSystemNotification(`🔔 ${reminder.label} — NutriMacro`, {
            body: reminder.message,
            tag: `meal_reminder_${reminder.id}`,
            mealType: reminder.mealType,
            onClick: () => {
              onTriggerReminder(activeRemItem);
            },
          });
        }

        // Trigger in-app interactive overlay/toast
        onTriggerReminder(activeRemItem);
      }
    }
  }

  /**
   * Dispatches an immediate test notification with sound and system alert
   */
  static triggerTestNotification(
    settings: NotificationSettings,
    onTriggerReminder: (reminder: ActiveMealReminder) => void
  ): void {
    if (settings.sound) {
      playNotificationSound();
    }

    const testItem: ActiveMealReminder = {
      id: `test_${Date.now()}`,
      mealType: 'lunch',
      title: '🔔 Teste de Notificação Push — Almoço',
      message: 'Notificação do NutriMacro configurada! Você receberá alertas nos horários programados mesmo com a aba fora de foco.',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      scheduledTime: '12:30',
    };

    if (this.getPermissionStatus() === 'granted') {
      this.sendSystemNotification('🔔 NutriMacro: Lembrete de Refeição', {
        body: 'Hora de registrar seu prato e acompanhar seus macros diários!',
        tag: 'test_notification',
        mealType: 'lunch',
        onClick: () => onTriggerReminder(testItem),
      });
    }

    onTriggerReminder(testItem);
  }

  /**
   * Dispatches a delayed test notification (e.g. in 4 seconds) so the user can minimize
   * or switch tabs and verify that the notification fires even when out of focus.
   */
  static triggerDelayedBackgroundTest(
    delaySeconds: number,
    settings: NotificationSettings,
    onTriggerReminder: (reminder: ActiveMealReminder) => void
  ): void {
    setTimeout(() => {
      if (settings.sound) {
        playNotificationSound();
      }

      const testItem: ActiveMealReminder = {
        id: `test_bg_${Date.now()}`,
        mealType: 'dinner',
        title: '🔔 Alerta de Refeição em Segundo Plano — NutriMacro',
        message: 'Excelente! A notificação funcionou mesmo com o app fora de foco.',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        scheduledTime: '19:30',
      };

      if (this.getPermissionStatus() === 'granted') {
        this.sendSystemNotification('🔔 NutriMacro: Lembrete em Segundo Plano', {
          body: 'Seu lembrete de refeição foi entregue pelo Service Worker com sucesso!',
          tag: `test_bg_${Date.now()}`,
          mealType: 'dinner',
          onClick: () => onTriggerReminder(testItem),
        });
      }

      onTriggerReminder(testItem);
    }, delaySeconds * 1000);
  }
}

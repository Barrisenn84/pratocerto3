import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Radio,
  ExternalLink,
  Timer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MealReminderConfig, MealType } from '../../types';
import { LocalNotificationService } from '../../services/LocalNotificationService';

export const NotificationSettingsCard: React.FC = () => {
  const {
    notificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
    testNotification,
    testDelayedBackgroundNotification,
    isServiceWorkerActive,
    showToast,
  } = useApp();

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [delayedCountdown, setDelayedCountdown] = useState<number | null>(null);

  useEffect(() => {
    setPermission(LocalNotificationService.getPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    const res = await requestNotificationPermission();
    setPermission(res);
    setIsRequestingPermission(false);
    if (res === 'granted') {
      showToast('Push API autorizada! Você receberá alertas mesmo com o app fora de foco.');
    } else if (res === 'denied') {
      showToast('Notificações bloqueadas no navegador. Os alertas serão exibidos no app.');
    }
  };

  const handleDelayedBackgroundTest = () => {
    if (permission !== 'granted') {
      handleRequestPermission();
      return;
    }

    setDelayedCountdown(4);
    testDelayedBackgroundNotification(4);

    let count = 4;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setDelayedCountdown(null);
      } else {
        setDelayedCountdown(count);
      }
    }, 1000);
  };

  const handleToggleGlobal = (enabled: boolean) => {
    updateNotificationSettings({ enabled });
    showToast(enabled ? 'Lembretes de refeição ativados!' : 'Lembretes de refeição desativados.');
  };

  const handleToggleSound = (sound: boolean) => {
    updateNotificationSettings({ sound });
    showToast(sound ? 'Som de lembretes ativado!' : 'Som de lembretes silenciado.');
  };

  const handleToggleSmartSkip = (smartSkipIfLogged: boolean) => {
    updateNotificationSettings({ smartSkipIfLogged });
    showToast(
      smartSkipIfLogged
        ? 'Modo inteligente ativo: refeições já registradas não serão cobradas.'
        : 'Lembretes serão enviados mesmo se já registrado.'
    );
  };

  const handleUpdateReminder = (
    key: 'breakfast' | 'lunch' | 'snack' | 'dinner',
    updates: Partial<MealReminderConfig>
  ) => {
    const current = notificationSettings.reminders[key];
    updateNotificationSettings({
      reminders: {
        ...notificationSettings.reminders,
        [key]: {
          ...current,
          ...updates,
        },
      },
    });
  };

  const mealCards: Array<{
    key: 'breakfast' | 'lunch' | 'snack' | 'dinner';
    label: string;
    icon: React.ReactNode;
    colorClasses: {
      bg: string;
      text: string;
      border: string;
      badge: string;
    };
    description: string;
  }> = [
    {
      key: 'breakfast',
      label: 'Café da Manhã',
      icon: <Coffee className="w-5 h-5 text-amber-500" />,
      colorClasses: {
        bg: 'bg-amber-50/60',
        text: 'text-amber-950',
        border: 'border-amber-200/80',
        badge: 'bg-amber-100 text-amber-800',
      },
      description: 'Lembrete matinal para abrir o dia abastecendo calorias e nutrientes.',
    },
    {
      key: 'lunch',
      label: 'Almoço',
      icon: <Sun className="w-5 h-5 text-emerald-500" />,
      colorClasses: {
        bg: 'bg-emerald-50/60',
        text: 'text-emerald-950',
        border: 'border-emerald-200/80',
        badge: 'bg-emerald-100 text-emerald-800',
      },
      description: 'Lembrete principal para fotografar ou lançar o prato de almoço.',
    },
    {
      key: 'snack',
      label: 'Lanche da Tarde',
      icon: <Cookie className="w-5 h-5 text-orange-500" />,
      colorClasses: {
        bg: 'bg-orange-50/60',
        text: 'text-orange-950',
        border: 'border-orange-200/80',
        badge: 'bg-orange-100 text-orange-800',
      },
      description: 'Lembrete intermediário para manter a ingestão proteica equilibrada.',
    },
    {
      key: 'dinner',
      label: 'Jantar',
      icon: <Moon className="w-5 h-5 text-indigo-500" />,
      colorClasses: {
        bg: 'bg-indigo-50/60',
        text: 'text-indigo-950',
        border: 'border-indigo-200/80',
        badge: 'bg-indigo-100 text-indigo-800',
      },
      description: 'Lembrete noturno para completar suas metas antes de encerrar o dia.',
    },
  ];

  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
      {/* Header with Title and Global Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Notificações Push & Lembretes de Refeições
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                Push API Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Receba alertas nos horários programados mesmo com o navegador em segundo plano ou em outra aba.
            </p>
          </div>
        </div>

        {/* Global Master Switch */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            {notificationSettings.enabled ? 'Ativo' : 'Desativado'}
          </span>
          <button
            type="button"
            id="btn-toggle-global-notifications"
            onClick={() => handleToggleGlobal(!notificationSettings.enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              notificationSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                notificationSettings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Push API & Browser Permission Status Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {permission === 'granted' ? (
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          ) : permission === 'denied' ? (
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800">
                Push API / Segundo Plano:
              </span>
              {permission === 'granted' && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Autorizado via Service Worker
                </span>
              )}
              {permission === 'denied' && (
                <span className="text-xs font-semibold text-rose-700">
                  Bloqueado pelo Navegador (Usando alertas em tela)
                </span>
              )}
              {permission === 'default' && (
                <span className="text-xs font-semibold text-amber-700">
                  Permissão Pendente
                </span>
              )}
              {permission === 'unsupported' && (
                <span className="text-xs font-semibold text-slate-600">
                  Alertas em tela ativos
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {permission === 'granted'
                ? 'Os alertas de refeição disparam notificações nativas do sistema com botão de ação rápida "Registrar Agora" mesmo quando o NutriMacro não estiver em foco.'
                : 'Autorize as notificações do navegador para receber avisos nativos mesmo fora de foco ou com a janela minimizada.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {permission !== 'granted' && permission !== 'unsupported' && (
            <button
              type="button"
              id="btn-request-notification-permission"
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isRequestingPermission ? 'Solicitando...' : 'Ativar Notificações Push'}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-test-notification"
            onClick={testNotification}
            className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Disparar lembrete de teste imediato"
          >
            <Play className="w-3.5 h-3.5 text-emerald-700" />
            <span>Teste Imediato</span>
          </button>

          <button
            type="button"
            id="btn-test-delayed-bg-notification"
            onClick={handleDelayedBackgroundTest}
            disabled={delayedCountdown !== null}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-75"
            title="Agenda teste para daqui a 4 segundos para você mudar de aba e verificar o alerta em segundo plano"
          >
            <Timer className={`w-3.5 h-3.5 text-emerald-700 ${delayedCountdown ? 'animate-spin' : ''}`} />
            <span>
              {delayedCountdown !== null
                ? `Minimize a aba! (${delayedCountdown}s)`
                : 'Testar Fora de Foco (4s)'}
            </span>
          </button>
        </div>
      </div>

      {/* Auxiliary Preferences: Sound & Smart Skip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Sound toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-2xs">
              {notificationSettings.sound ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Sons de Alerta</span>
              <span className="text-[11px] text-slate-500">
                {notificationSettings.sound ? 'Chime suave ativado' : 'Silenciado'}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-toggle-notification-sound"
            onClick={() => handleToggleSound(!notificationSettings.sound)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              notificationSettings.sound ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                notificationSettings.sound ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Smart Skip toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Modo Inteligente</span>
              <span className="text-[11px] text-slate-500">
                Pular se a refeição já foi registrada hoje
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-toggle-smart-skip"
            onClick={() => handleToggleSmartSkip(!notificationSettings.smartSkipIfLogged)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              notificationSettings.smartSkipIfLogged ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                notificationSettings.smartSkipIfLogged ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Scheduled Meal Reminder Cards List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Horários das Refeições Programadas (Push Automático)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {mealCards.map((meal) => {
            const config = notificationSettings.reminders[meal.key];
            return (
              <div
                key={meal.key}
                className={`p-4 rounded-2xl border transition-all ${meal.colorClasses.bg} ${meal.colorClasses.border} flex flex-col justify-between gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-200/60">
                      {meal.icon}
                    </div>
                    <div>
                      <h5 className={`text-xs font-bold ${meal.colorClasses.text}`}>
                        {meal.label}
                      </h5>
                      <span className="text-[10px] text-slate-500 block">
                        {meal.description}
                      </span>
                    </div>
                  </div>

                  {/* Individual Reminder Switch */}
                  <button
                    type="button"
                    id={`btn-toggle-reminder-${meal.key}`}
                    onClick={() =>
                      handleUpdateReminder(meal.key, { enabled: !config.enabled })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      config.enabled && notificationSettings.enabled
                        ? 'bg-emerald-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        config.enabled && notificationSettings.enabled
                          ? 'translate-x-4'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Time Picker and status */}
                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Horário do push:
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={config.time}
                      onChange={(e) =>
                        handleUpdateReminder(meal.key, { time: e.target.value })
                      }
                      disabled={!config.enabled || !notificationSettings.enabled}
                      className="px-2.5 py-1 bg-white rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 shadow-2xs focus:border-emerald-500 outline-hidden disabled:opacity-50 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

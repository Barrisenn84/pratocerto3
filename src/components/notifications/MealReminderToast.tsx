import React from 'react';
import {
  Bell,
  Utensils,
  Camera,
  Mic,
  X,
  Clock,
  Coffee,
  Sun,
  Moon,
  Cookie,
  CheckCircle2,
} from 'lucide-react';
import { ActiveMealReminder, MealType } from '../../types';

interface MealReminderToastProps {
  reminder: ActiveMealReminder | null;
  onClose: () => void;
  onSnooze: () => void;
  onOpenLogMeal: (mealType: MealType) => void;
  onOpenPhotoVision: (mealType: MealType) => void;
  onOpenVoiceAssistant: () => void;
}

export const MealReminderToast: React.FC<MealReminderToastProps> = ({
  reminder,
  onClose,
  onSnooze,
  onOpenLogMeal,
  onOpenPhotoVision,
  onOpenVoiceAssistant,
}) => {
  if (!reminder) return null;

  const getMealIcon = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'lunch':
        return <Sun className="w-5 h-5 text-emerald-500" />;
      case 'dinner':
        return <Moon className="w-5 h-5 text-indigo-500" />;
      case 'snack':
      case 'supper':
        return <Cookie className="w-5 h-5 text-orange-500" />;
      default:
        return <Utensils className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getMealTheme = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return {
          bg: 'bg-amber-50/95 border-amber-300',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          btnPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
          glow: 'shadow-amber-500/10 ring-amber-400/30',
        };
      case 'lunch':
        return {
          bg: 'bg-emerald-50/95 border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          glow: 'shadow-emerald-500/10 ring-emerald-400/30',
        };
      case 'dinner':
        return {
          bg: 'bg-indigo-50/95 border-indigo-300',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          glow: 'shadow-indigo-500/10 ring-indigo-400/30',
        };
      default:
        return {
          bg: 'bg-slate-50/95 border-slate-300',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          glow: 'shadow-slate-500/10 ring-slate-400/30',
        };
    }
  };

  const theme = getMealTheme(reminder.mealType);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl animate-in slide-in-from-top-6 duration-300">
      <div
        className={`p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-md border-2 shadow-2xl ${theme.bg} ${theme.glow} ring-4 transition-all`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-sm border border-slate-200/80 shrink-0">
              {getMealIcon(reminder.mealType)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs flex items-center gap-1 bg-white">
                  <Bell className="w-3 h-3 text-emerald-600 animate-bounce" />
                  Lembrete de Refeição
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {reminder.time}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {reminder.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pr-2">
                {reminder.message}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
            title="Dispensar lembrete"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              onOpenLogMeal(reminder.mealType);
              onClose();
            }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer ${theme.btnPrimary}`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Registrar Agora</span>
          </button>

          <button
            onClick={() => {
              onOpenPhotoVision(reminder.mealType);
              onClose();
            }}
            className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            title="Tirar foto do prato para estimativa com IA"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Foto IA</span>
          </button>

          <button
            onClick={() => {
              onOpenVoiceAssistant();
              onClose();
            }}
            className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            title="Registrar por voz"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voz</span>
          </button>

          <button
            onClick={() => {
              onSnooze();
              onClose();
            }}
            className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Lembrar novamente em 15 minutos"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>+15 min</span>
          </button>
        </div>
      </div>
    </div>
  );
};

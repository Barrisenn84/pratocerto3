import React from 'react';
import {
  Plus,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Scale,
  Droplets,
  Sparkles,
  Utensils,
  Copy,
  Info,
  CheckCircle2,
  Bell,
  Clock,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MacroOverview } from '../nutrition/MacroOverview';
import { MealCard } from '../meals/MealCard';
import { calculateDailyTotals, getDayAdherenceStatus } from '../../domain/nutrition/calculations';

export const HomeView: React.FC = () => {
  const {
    user,
    targets,
    selectedDate,
    setSelectedDate,
    dailyMeals,
    waterIntakeMl,
    addWaterIntake,
    setWaterIntake,
    setQuickLogModalOpen,
    setFoodVisionModalOpen,
    setAddMeasurementModalOpen,
    allMeals,
    duplicateMeal,
    notificationSettings,
    setCurrentPage,
    setActiveMealTypeForLog,
    setAddMealModalOpen,
  } = useApp();

  const dailyTotals = calculateDailyTotals(dailyMeals);
  const status = targets ? getDayAdherenceStatus(dailyTotals, targets) : 'within_target';

  const waterTarget = targets?.waterMl || 2660;
  const waterPercent = Math.min(100, Math.round((waterIntakeMl / waterTarget) * 100));
  const waterRemaining = Math.max(0, waterTarget - waterIntakeMl);

  // Format date header
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Feedback message based on adherence
  const remainingCalories = (targets?.calories || 2500) - dailyTotals.calories;
  const remainingProtein = (targets?.protein || 160) - dailyTotals.protein;

  let adviceMessage = '';
  if (remainingCalories > 600) {
    adviceMessage = `Você ainda tem ${remainingCalories} kcal disponíveis. Que tal priorizar fontes magras de proteína no seu próximo prato?`;
  } else if (remainingCalories > 0) {
    adviceMessage = `Excelente ritmo! Faltam apenas ${remainingCalories} kcal e ${Math.max(0, Math.round(remainingProtein))}g de proteína para fechar a meta do dia com precisão.`;
  } else if (Math.abs(remainingCalories) <= 150) {
    adviceMessage = `Meta calórica praticamente cravada no alvo planejado! Ótima consistência energética.`;
  } else {
    adviceMessage = `Você ultrapassou a meta em ${Math.abs(remainingCalories)} kcal hoje. Mantenha a hidratação alta e ajuste com equilíbrio nas próximas refeições.`;
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation & Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Olá, {user?.name.split(' ')[0] || 'Atleta'} 👋
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              {user?.goal === 'hypertrophy' || user?.goal === 'bulking'
                ? 'Foco: Hipertrofia'
                : user?.goal === 'weight_loss' || user?.goal === 'cutting'
                ? 'Foco: Definição'
                : 'Foco: Manutenção'}
            </span>
          </div>
          <p className="text-xs text-slate-500 capitalize mt-0.5">{formattedDate}</p>
        </div>

        {/* Date Stepper */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Ir para Hoje
            </button>
          )}

          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Intelligent Daily Feedback Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-sm flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400">
                Feedback Nutricional Inteligente
              </span>
              {status === 'within_target' && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-semibold">
                  No Alvo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{adviceMessage}</p>
          </div>
        </div>

        {/* Quick Log Action on the banner */}
        <button
          onClick={() => setQuickLogModalOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Registrar</span>
        </button>
      </div>

      {/* Macro Overview Component (TELA 02) */}
      <MacroOverview />

      {/* Hydration & Water Tracking Card */}
      <div id="hydration-card" className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Hidratação do Dia</h3>
                {waterPercent >= 100 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Meta Batida! 💧
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                    {waterPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {waterIntakeMl} ml de {waterTarget} ml recomendados
                {waterRemaining > 0 ? ` (faltam ${waterRemaining} ml)` : ' (parabéns!)'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">{waterIntakeMl}</span>
            <span className="text-xs text-slate-400 font-medium ml-1">ml</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, waterPercent)}%` }}
          />
        </div>

        {/* Quick Add Water Buttons */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => addWaterIntake(150)}
            className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-semibold border border-cyan-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="Adicionar 150ml (copo pequeno)"
          >
            <span>+150 ml</span>
          </button>
          <button
            onClick={() => addWaterIntake(250)}
            className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-semibold border border-cyan-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="Adicionar 250ml (copo padrão)"
          >
            <span>+250 ml</span>
          </button>
          <button
            onClick={() => addWaterIntake(500)}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
            title="Adicionar 500ml (garrafa)"
          >
            <span>+500 ml</span>
          </button>
          <button
            onClick={() => addWaterIntake(1000)}
            className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-semibold border border-cyan-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="Adicionar 1000ml (garrafa grande)"
          >
            <span>+1 Litro</span>
          </button>
          {waterIntakeMl > 0 && (
            <button
              onClick={() => setWaterIntake(Math.max(0, waterIntakeMl - 250))}
              className="ml-auto px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Diminuir 250ml se registrou errado"
            >
              -250 ml
            </button>
          )}
        </div>
      </div>

      {/* Daily Meals & Scheduled Reminders Tracker Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Lembretes & Horários das Refeições
                </h3>
                {notificationSettings.enabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Ativo 🔔
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Acompanhe o status do café da manhã, almoço e jantar no seu dia
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('settings')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configurar Lembretes</span>
          </button>
        </div>

        {/* 3 Main Meals Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Breakfast */}
          {(() => {
            const meal = dailyMeals.find((m) => m.type === 'breakfast');
            const config = notificationSettings.reminders.breakfast;
            const calories = meal ? meal.items.reduce((s, i) => s + i.calories, 0) : 0;
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  meal
                    ? 'bg-amber-50/40 border-amber-200/70'
                    : 'bg-slate-50 border-slate-200/70 hover:border-amber-300'
                } flex flex-col justify-between gap-2.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-white text-amber-600 shadow-2xs border border-amber-100">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Café da Manhã</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {config?.time || '08:00'}
                      </span>
                    </div>
                  </div>

                  {meal ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Registrado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 border border-amber-200/60">
                      Pendente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  {meal ? (
                    <span className="text-xs font-bold text-slate-700">
                      {Math.round(calories)} kcal ({meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'})
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveMealTypeForLog('breakfast');
                        setAddMealModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Registrar Café</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Lunch */}
          {(() => {
            const meal = dailyMeals.find((m) => m.type === 'lunch');
            const config = notificationSettings.reminders.lunch;
            const calories = meal ? meal.items.reduce((s, i) => s + i.calories, 0) : 0;
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  meal
                    ? 'bg-emerald-50/40 border-emerald-200/70'
                    : 'bg-slate-50 border-slate-200/70 hover:border-emerald-300'
                } flex flex-col justify-between gap-2.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-white text-emerald-600 shadow-2xs border border-emerald-100">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Almoço</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {config?.time || '12:30'}
                      </span>
                    </div>
                  </div>

                  {meal ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Registrado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
                      Pendente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  {meal ? (
                    <span className="text-xs font-bold text-slate-700">
                      {Math.round(calories)} kcal ({meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'})
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveMealTypeForLog('lunch');
                        setAddMealModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Registrar Almoço</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Dinner */}
          {(() => {
            const meal = dailyMeals.find((m) => m.type === 'dinner');
            const config = notificationSettings.reminders.dinner;
            const calories = meal ? meal.items.reduce((s, i) => s + i.calories, 0) : 0;
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  meal
                    ? 'bg-indigo-50/40 border-indigo-200/70'
                    : 'bg-slate-50 border-slate-200/70 hover:border-indigo-300'
                } flex flex-col justify-between gap-2.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-white text-indigo-600 shadow-2xs border border-indigo-100">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Jantar</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {config?.time || '19:30'}
                      </span>
                    </div>
                  </div>

                  {meal ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Registrado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-800 border border-indigo-200/60">
                      Pendente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  {meal ? (
                    <span className="text-xs font-bold text-slate-700">
                      {Math.round(calories)} kcal ({meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'})
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveMealTypeForLog('dinner');
                        setAddMealModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Registrar Jantar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Quick Action Shortcuts Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          id="btn-shortcut-quicklog"
          onClick={() => setQuickLogModalOpen(true)}
          className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-left transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
              Registrar Refeição
            </span>
            <Plus className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-slate-500 block">Manual ou rápida</span>
        </button>

        <button
          id="btn-shortcut-vision"
          onClick={() => setFoodVisionModalOpen(true)}
          className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 hover:border-purple-500 hover:bg-purple-100/60 text-left transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-purple-950 group-hover:text-purple-800">
              Foto com IA Vision
            </span>
            <Camera className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-[11px] text-purple-700 block">Estimativa automática</span>
        </button>

        <button
          id="btn-shortcut-water"
          onClick={() => addWaterIntake(250)}
          className="p-3 bg-cyan-50/50 rounded-2xl border border-cyan-200 hover:border-cyan-500 hover:bg-cyan-100/50 text-left transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-950 group-hover:text-cyan-800">
              +250 ml de Água
            </span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-[11px] text-cyan-700 block">{waterIntakeMl} ml hoje</span>
        </button>

        <button
          id="btn-shortcut-weight"
          onClick={() => setAddMeasurementModalOpen(true)}
          className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900">Registrar Peso</span>
            <Scale className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-[11px] text-slate-500 block">Medição corporal</span>
        </button>
      </div>

      {/* Meals Section (TELA 01 — Seção "Refeições de Hoje") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              <span>Refeições Registradas</span>
            </h2>
            <p className="text-xs text-slate-500">
              {dailyMeals.length === 0
                ? 'Nenhuma refeição registrada nesta data'
                : `${dailyMeals.length} ${dailyMeals.length === 1 ? 'refeição' : 'refeições'} adicionadas hoje`}
            </p>
          </div>

          <button
            id="btn-add-meal-primary"
            onClick={() => setQuickLogModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Refeição</span>
          </button>
        </div>

        {/* Meals Cards List */}
        {dailyMeals.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Utensils className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nenhuma refeição registrada para este dia
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Comece seu registro diário tirando uma foto com a IA ou adicionando seus alimentos manualmente.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setQuickLogModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Primeira Refeição</span>
              </button>

              <button
                onClick={() => setFoodVisionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Analisar Foto com IA</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {dailyMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

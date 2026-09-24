import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  Copy,
  Trash2,
  PieChart as PieIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateMealTotals } from '../../domain/nutrition/calculations';
import { MealItemRow } from './MealItemRow';

interface MealDetailModalProps {
  mealId: string | null;
  onClose: () => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  mealId,
  onClose,
}) => {
  const {
    allMeals,
    deleteMeal,
    duplicateMeal,
    setTargetMealIdForFood,
    setAddFoodModalOpen,
  } = useApp();

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!mealId) return null;

  const meal = allMeals.find((m) => m.id === mealId);
  if (!meal) return null;

  const totals = calculateMealTotals(meal);

  const typeLabels: Record<string, string> = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    snack: 'Lanche da Tarde',
    dinner: 'Jantar',
    supper: 'Ceia',
    other: 'Refeição Extra',
  };

  const handleDelete = async () => {
    await deleteMeal(meal.id);
    onClose();
  };

  const handleDuplicate = async () => {
    await duplicateMeal(meal.id);
    onClose();
  };

  const handleAddFood = () => {
    setTargetMealIdForFood(meal.id);
    setAddFoodModalOpen(true);
  };

  // Macro calorie contributions (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g)
  const proteinCals = totals.protein * 4;
  const carbsCals = totals.carbs * 4;
  const fatCals = totals.fat * 9;
  const totalMacroCals = Math.max(1, proteinCals + carbsCals + fatCals);

  const proteinRatio = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsRatio = Math.round((carbsCals / totalMacroCals) * 100);
  const fatRatio = Math.max(0, 100 - (proteinRatio + carbsRatio));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header with Photo Banner if available */}
        <div className="relative bg-slate-900 text-white">
          {meal.photo ? (
            <div className="relative h-44 sm:h-52 w-full overflow-hidden">
              <img
                src={meal.photo}
                alt={meal.name || 'Refeição'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </div>
          ) : (
            <div className="h-20 bg-gradient-to-r from-emerald-800 to-slate-900" />
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-5 relative z-10 -mt-14 sm:-mt-16">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                {typeLabels[meal.type] || 'Refeição'}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5" />
                {meal.date}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5" />
                {meal.time}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {meal.name || typeLabels[meal.type]}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Running Totals Cards */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-700 font-sans font-bold block">Calorias</span>
              <span className="text-lg font-extrabold text-slate-900">{totals.calories}</span>
              <span className="text-[10px] text-slate-400 font-sans block">kcal</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-sans font-bold block">Proteína</span>
              <span className="text-lg font-extrabold text-emerald-800">{totals.protein}g</span>
              <span className="text-[10px] text-slate-400 font-sans block">{proteinRatio}% cals</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-700 font-sans font-bold block">Carboidratos</span>
              <span className="text-lg font-extrabold text-blue-800">{totals.carbs}g</span>
              <span className="text-[10px] text-slate-400 font-sans block">{carbsRatio}% cals</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] text-purple-700 font-sans font-bold block">Gorduras</span>
              <span className="text-lg font-extrabold text-purple-800">{totals.fat}g</span>
              <span className="text-[10px] text-slate-400 font-sans block">{fatRatio}% cals</span>
            </div>
          </div>

          {/* Macro Proportion Bar */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-slate-400" />
                Distribuição Calórica dos Macros
              </span>
              <span className="text-[11px] font-mono text-slate-500">100% total</span>
            </div>

            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200">
              <div
                style={{ width: `${proteinRatio}%` }}
                className="bg-emerald-500 h-full"
                title={`Proteína: ${proteinRatio}%`}
              />
              <div
                style={{ width: `${carbsRatio}%` }}
                className="bg-blue-500 h-full"
                title={`Carboidratos: ${carbsRatio}%`}
              />
              <div
                style={{ width: `${fatRatio}%` }}
                className="bg-purple-500 h-full"
                title={`Gorduras: ${fatRatio}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-emerald-700 font-semibold">● {proteinRatio}% Proteína</span>
              <span className="text-blue-700 font-semibold">● {carbsRatio}% Carboidrato</span>
              <span className="text-purple-700 font-semibold">● {fatRatio}% Gordura</span>
            </div>
          </div>

          {/* Food Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Alimentos ({meal.items.length})
              </span>
              <button
                onClick={handleAddFood}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar alimento
              </button>
            </div>

            {meal.items.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Nenhum item nesta refeição.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {meal.items.map((item) => (
                  <MealItemRow key={item.id} mealId={meal.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <>
                <button
                  onClick={handleDuplicate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicar Refeição</span>
                </button>

                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-medium">Excluir refeição?</span>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Sim, Excluir
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

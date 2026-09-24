import React, { useState } from 'react';
import {
  Coffee,
  Utensils,
  Sandwich,
  Moon,
  Milk,
  Clock,
  Plus,
  Camera,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Meal, MealType } from '../../types';
import { calculateMealTotals } from '../../domain/nutrition/calculations';
import { useApp } from '../../context/AppContext';
import { MealItemRow } from './MealItemRow';

interface MealCardProps {
  meal: Meal;
}

export const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const {
    duplicateMeal,
    deleteMeal,
    setTargetMealIdForFood,
    setAddFoodModalOpen,
    setActiveMealTypeForLog,
    setFoodVisionModalOpen,
    setMealDetailId,
  } = useApp();

  const [expanded, setExpanded] = useState(true);

  // Derive totals dynamically
  const totals = calculateMealTotals(meal);

  const mealConfigs: Record<
    MealType,
    {
      label: string;
      icon: React.FC<{ className?: string }>;
      colorClass: string;
      borderClass: string;
    }
  > = {
    breakfast: {
      label: 'Café da Manhã',
      icon: Coffee,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
      borderClass: 'border-amber-100',
    },
    lunch: {
      label: 'Almoço',
      icon: Utensils,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      borderClass: 'border-emerald-100',
    },
    snack: {
      label: 'Lanche da Tarde',
      icon: Sandwich,
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      borderClass: 'border-orange-100',
    },
    dinner: {
      label: 'Jantar',
      icon: Moon,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      borderClass: 'border-indigo-100',
    },
    supper: {
      label: 'Ceia',
      icon: Milk,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
      borderClass: 'border-teal-100',
    },
    other: {
      label: 'Refeição Extra',
      icon: Utensils,
      colorClass: 'bg-slate-50 text-slate-700 border-slate-200',
      borderClass: 'border-slate-100',
    },
  };

  const config = mealConfigs[meal.type] || mealConfigs.other;
  const Icon = config.icon;
  const hasAIEstimate = meal.items.some((i) => i.aiEstimate);

  const handleAddFood = () => {
    setTargetMealIdForFood(meal.id);
    setAddFoodModalOpen(true);
  };

  const handleAIVision = () => {
    setActiveMealTypeForLog(meal.type);
    setFoodVisionModalOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`Deseja realmente excluir "${meal.name || config.label}"?`)) {
      await deleteMeal(meal.id);
    }
  };

  return (
    <div
      id={`meal-card-${meal.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
    >
      {/* Meal Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Meal Thumbnail or Icon */}
          {meal.photo ? (
            <div
              onClick={() => setMealDetailId(meal.id)}
              className="relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer group shrink-0 border border-slate-200"
              title="Clique para ver foto e detalhes"
            >
              <img
                src={meal.photo}
                alt={meal.name || config.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          ) : (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${config.colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {meal.name || config.label}
              </h3>
              {hasAIEstimate && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  <Sparkles className="w-3 h-3" />
                  IA Multimodal
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meal.time}
              </span>
              <span>•</span>
              <span>{meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
          </div>
        </div>

        {/* Totals Summary pill & toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs font-mono">
            <span className="font-extrabold text-slate-900 text-sm">
              {totals.calories} <span className="text-[10px] font-sans font-normal text-slate-500">kcal</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">{totals.protein}g <span className="text-[10px] font-sans text-slate-400">P</span></span>
            <span className="text-blue-700 font-bold">{totals.carbs}g <span className="text-[10px] font-sans text-slate-400">C</span></span>
            <span className="text-purple-700 font-bold">{totals.fat}g <span className="text-[10px] font-sans text-slate-400">G</span></span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMealDetailId(meal.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Ver detalhes da refeição"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title={expanded ? 'Recolher itens' : 'Expandir itens'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Items List */}
      {expanded && (
        <div className="p-4 sm:p-5 bg-slate-50/40 space-y-2">
          {meal.items.length === 0 ? (
            <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500">Nenhum alimento cadastrado nesta refeição.</p>
              <button
                onClick={handleAddFood}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar primeiro alimento
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 p-1">
              {meal.items.map((item) => (
                <MealItemRow key={item.id} mealId={meal.id} item={item} />
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                id={`btn-add-food-meal-${meal.id}`}
                onClick={handleAddFood}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Alimento
              </button>

              <button
                id={`btn-ai-meal-${meal.id}`}
                onClick={handleAIVision}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Foto com IA
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id={`btn-duplicate-meal-${meal.id}`}
                onClick={() => duplicateMeal(meal.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 text-xs transition-colors cursor-pointer"
                title="Duplicar esta refeição para hoje"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>

              <button
                id={`btn-delete-meal-${meal.id}`}
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                title="Excluir refeição"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

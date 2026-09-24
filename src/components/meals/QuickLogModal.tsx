import React, { useState } from 'react';
import {
  X,
  Camera,
  PlusCircle,
  Clock,
  Copy,
  Sparkles,
  ArrowRight,
  Utensils,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MealType } from '../../types';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMeal: (mealType: MealType) => void;
  onOpenFoodVision: (mealType: MealType) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onOpenAddMeal,
  onOpenFoodVision,
}) => {
  const { allMeals, duplicateMeal, setTargetMealIdForFood, setAddFoodModalOpen, dailyMeals } = useApp();
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [showRecentDuplication, setShowRecentDuplication] = useState(false);

  if (!isOpen) return null;

  const mealTypes: Array<{ type: MealType; label: string; icon: string }> = [
    { type: 'breakfast', label: 'Café da Manhã', icon: '☀️' },
    { type: 'lunch', label: 'Almoço', icon: '🍽️' },
    { type: 'snack', label: 'Lanche da Tarde', icon: '🥪' },
    { type: 'dinner', label: 'Jantar', icon: '🌙' },
    { type: 'supper', label: 'Ceia', icon: '🥛' },
    { type: 'other', label: 'Outro', icon: '⚡' },
  ];

  const handleActionClick = (action: 'manual' | 'photo' | 'recent') => {
    onClose();
    if (action === 'photo') {
      onOpenFoodVision(selectedMealType);
    } else if (action === 'manual') {
      onOpenAddMeal(selectedMealType);
    } else if (action === 'recent') {
      // If there's an existing meal today of this type, add food to it; otherwise create meal
      const existing = dailyMeals.find((m) => m.type === selectedMealType);
      if (existing) {
        setTargetMealIdForFood(existing.id);
        setAddFoodModalOpen(true);
      } else {
        onOpenAddMeal(selectedMealType);
      }
    }
  };

  const handleDuplicatePreviousMeal = async (mealId: string) => {
    await duplicateMeal(mealId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registrar Refeição</h2>
            <p className="text-xs text-slate-500">Escolha o tipo e a forma mais rápida de registro</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: Select Meal Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              1. Selecione a Refeição
            </label>
            <div className="grid grid-cols-3 gap-2">
              {mealTypes.map((item) => {
                const isSelected = selectedMealType === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => setSelectedMealType(item.type)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Choose Method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              2. Como deseja registrar?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: AI Food Vision */}
              <button
                id="btn-quicklog-photo"
                onClick={() => handleActionClick('photo')}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white text-left shadow-md hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 text-purple-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Analisar Foto com IA</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                  Tire foto ou envie imagem. A IA estima porções e macros automaticamente.
                </p>
              </button>

              {/* Option B: Manual */}
              <button
                id="btn-quicklog-manual"
                onClick={() => handleActionClick('manual')}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>Adicionar Manualmente</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Digite os alimentos, gramas e personalize os macros em tempo real.
                </p>
              </button>

              {/* Option C: Recent / Favorites */}
              <button
                id="btn-quicklog-recent"
                onClick={() => handleActionClick('recent')}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>Alimentos Recentes</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Insira rapidamente itens habituais como frango, ovos, whey e arroz.
                </p>
              </button>

              {/* Option D: Duplicate Meal */}
              <button
                id="btn-quicklog-duplicate"
                onClick={() => setShowRecentDuplication(!showRecentDuplication)}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:border-amber-500 hover:bg-amber-50/20 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Copy className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>Duplicar Refeição</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-amber-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Copie uma refeição inteira de ontem ou de dias anteriores em 1 clique.
                </p>
              </button>
            </div>
          </div>

          {/* Duplication Picker if toggled */}
          {showRecentDuplication && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-slate-700 block">
                Selecione uma refeição anterior para copiar para hoje:
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {allMeals.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleDuplicatePreviousMeal(m.id)}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 flex items-center justify-between cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-800">{m.name || m.type}</p>
                        <p className="text-[10px] text-slate-500">{m.date} às {m.time} • {m.items.length} itens</p>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-bold text-xs">Copiar →</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

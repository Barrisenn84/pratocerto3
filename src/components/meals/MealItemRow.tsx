import React, { useState } from 'react';
import { Sparkles, Trash2, Edit3, Check, X } from 'lucide-react';
import { MealItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface MealItemRowProps {
  mealId: string;
  item: MealItem;
}

export const MealItemRow: React.FC<MealItemRowProps> = ({ mealId, item }) => {
  const { updateMealItem, deleteMealItem } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit fields
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [calories, setCalories] = useState(item.calories);
  const [protein, setProtein] = useState(item.protein);
  const [carbs, setCarbs] = useState(item.carbs);
  const [fat, setFat] = useState(item.fat);

  const handleSave = async () => {
    await updateMealItem(mealId, item.id, {
      name,
      quantity: Number(quantity) || 0,
      unit,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setCalories(item.calories);
    setProtein(item.protein);
    setCarbs(item.carbs);
    setFat(item.fat);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-slate-800">Editar Alimento</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              title="Salvar alterações"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do alimento"
            className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
          />
          <div className="flex gap-1">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="Qtd"
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unidade"
              className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <div>
            <label className="text-[10px] text-slate-500 block">Kcal</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block">Prot (g)</label>
            <input
              type="number"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block">Carb (g)</label>
            <input
              type="number"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block">Gord (g)</label>
            <input
              type="number"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`meal-item-${item.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors gap-2 text-xs"
    >
      <div className="flex items-start gap-2 min-w-0">
        <div className="mt-0.5">
          {item.aiEstimate ? (
            <span
              title="Estimativa identificada por IA multimodal"
              className="inline-flex p-1 rounded-md bg-purple-50 text-purple-600 border border-purple-200"
            >
              <Sparkles className="w-3 h-3" />
            </span>
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mt-1" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-900 truncate">{item.name}</span>
            <span className="text-slate-500 font-medium">
              ({item.quantity} {item.unit})
            </span>
            {item.aiEstimate && (
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded">
                IA {item.confidence === 'high' ? 'Alta precisão' : 'Estimado'}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
          )}
        </div>
      </div>

      {/* Macros & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="font-bold text-slate-900">{Math.round(item.calories)} kcal</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-semibold">{item.protein}g P</span>
          <span className="text-blue-700 font-semibold">{item.carbs}g C</span>
          <span className="text-purple-700 font-semibold">{item.fat}g G</span>
        </div>

        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {!confirmDelete ? (
            <>
              <button
                id={`btn-edit-item-${item.id}`}
                onClick={() => setIsEditing(true)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                title="Editar alimento"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                id={`btn-delete-item-${item.id}`}
                onClick={() => setConfirmDelete(true)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                title="Excluir alimento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-700 font-semibold">Excluir?</span>
              <button
                onClick={() => deleteMealItem(mealId, item.id)}
                className="p-0.5 text-rose-700 hover:text-rose-900 cursor-pointer font-bold"
                title="Confirmar exclusão"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Cancelar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

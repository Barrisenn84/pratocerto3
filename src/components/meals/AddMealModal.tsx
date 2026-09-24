import React, { useState } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { MealType, MealItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMealType?: MealType;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  initialMealType = 'lunch',
}) => {
  const { createMeal, selectedDate, user } = useApp();

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );

  // Staged items list
  const [items, setItems] = useState<Array<Omit<MealItem, 'id' | 'mealId' | 'createdAt' | 'updatedAt'>>>([
    {
      name: 'Peito de Frango Grelhado',
      quantity: 150,
      unit: 'g',
      calories: 247,
      protein: 46.5,
      carbs: 0,
      fat: 5.4,
      source: 'manual',
      aiEstimate: false,
    },
    {
      name: 'Arroz Branco Cozido',
      quantity: 150,
      unit: 'g',
      calories: 195,
      protein: 4.0,
      carbs: 42.3,
      fat: 0.4,
      source: 'manual',
      aiEstimate: false,
    },
  ]);

  // Form for adding a new line item in this meal
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(100);
  const [newItemUnit, setNewItemUnit] = useState('g');
  const [newItemCalories, setNewItemCalories] = useState(130);
  const [newItemProtein, setNewItemProtein] = useState(10);
  const [newItemCarbs, setNewItemCarbs] = useState(15);
  const [newItemFat, setNewItemFat] = useState(3);
  const [isAddingItem, setIsAddingItem] = useState(false);

  if (!isOpen) return null;

  // Running totals derived dynamically
  const runningTotals = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein: Math.round((acc.protein + (Number(it.protein) || 0)) * 10) / 10,
      carbs: Math.round((acc.carbs + (Number(it.carbs) || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (Number(it.fat) || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddItemToStage = () => {
    if (!newItemName.trim()) return;

    setItems([
      ...items,
      {
        name: newItemName.trim(),
        quantity: Number(newItemQuantity) || 100,
        unit: newItemUnit || 'g',
        calories: Number(newItemCalories) || 0,
        protein: Number(newItemProtein) || 0,
        carbs: Number(newItemCarbs) || 0,
        fat: Number(newItemFat) || 0,
        source: 'manual',
        aiEstimate: false,
      },
    ]);

    setNewItemName('');
    setIsAddingItem(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveMeal = async () => {
    const mealLabels: Record<MealType, string> = {
      breakfast: 'Café da Manhã',
      lunch: 'Almoço',
      snack: 'Lanche da Tarde',
      dinner: 'Jantar',
      supper: 'Ceia',
      other: 'Refeição Extra',
    };

    const formattedItems: MealItem[] = items.map((it, idx) => ({
      ...it,
      id: 'item_' + Date.now() + '_' + idx,
      mealId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await createMeal({
      userId: user?.id || 'demo_user_01',
      date: selectedDate,
      time: mealTime,
      type: mealType,
      name: mealName.trim() || mealLabels[mealType],
      items: formattedItems,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nova Refeição</h2>
            <p className="text-xs text-slate-500">Configure os alimentos e visualize os macros continuamente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Top metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Refeição</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-emerald-500"
              >
                <option value="breakfast">Café da Manhã</option>
                <option value="lunch">Almoço</option>
                <option value="snack">Lanche da Tarde</option>
                <option value="dinner">Jantar</option>
                <option value="supper">Ceia</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Personalizado (opcional)</label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="Ex: Pós-Treino Pesado"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Horário</label>
              <div className="relative">
                <input
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-emerald-500"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Running Totals Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400">
                Totais desta Refeição
              </span>
              <span>{items.length} {items.length === 1 ? 'alimento' : 'alimentos'}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
              <div className="p-2 rounded-xl bg-slate-800/80">
                <span className="text-[10px] text-amber-400 uppercase block font-sans font-bold">Calorias</span>
                <span className="text-lg font-black text-white">{runningTotals.calories}</span>
                <span className="text-[10px] text-slate-400 block font-sans">kcal</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80">
                <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold">Proteína</span>
                <span className="text-lg font-black text-emerald-300">{runningTotals.protein}g</span>
                <span className="text-[10px] text-slate-400 block font-sans">P</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80">
                <span className="text-[10px] text-blue-400 uppercase block font-sans font-bold">Carbo</span>
                <span className="text-lg font-black text-blue-300">{runningTotals.carbs}g</span>
                <span className="text-[10px] text-slate-400 block font-sans">C</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80">
                <span className="text-[10px] text-purple-400 uppercase block font-sans font-bold">Gordura</span>
                <span className="text-lg font-black text-purple-300">{runningTotals.fat}g</span>
                <span className="text-[10px] text-slate-400 block font-sans">G</span>
              </div>
            </div>
          </div>

          {/* Staged Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Alimentos Inclusos
              </label>
              {!isAddingItem && (
                <button
                  type="button"
                  onClick={() => setIsAddingItem(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar outro alimento
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Nenhum alimento na lista ainda.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{it.name}</p>
                      <p className="text-slate-500">{it.quantity} {it.unit}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-mono text-right text-[11px]">
                        <span className="font-bold text-slate-800 block">{it.calories} kcal</span>
                        <span className="text-slate-400 text-[10px]">
                          {it.protein}P • {it.carbs}C • {it.fat}G
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Remover alimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inline Add Item Form */}
          {isAddingItem && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3 animate-in fade-in">
              <span className="text-xs font-bold text-emerald-950 block">Novo Alimento para esta refeição</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome do alimento (Ex: Batata Doce)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Qtd"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Un (g/ml)"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600 block">Kcal</label>
                  <input
                    type="number"
                    value={newItemCalories}
                    onChange={(e) => setNewItemCalories(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Proteína (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemProtein}
                    onChange={(e) => setNewItemProtein(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Carbo (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemCarbs}
                    onChange={(e) => setNewItemCarbs(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Gordura (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemFat}
                    onChange={(e) => setNewItemFat(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddItemToStage}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Adicionar à Lista
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="btn-save-new-meal"
            type="button"
            onClick={handleSaveMeal}
            disabled={items.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            Confirmar e Salvar Refeição
          </button>
        </div>
      </div>
    </div>
  );
};

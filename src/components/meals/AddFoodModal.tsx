import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Star,
  Clock,
  Plus,
  Bookmark,
  Check,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodDatabaseItem } from '../../types';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealId: string | null;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  mealId,
}) => {
  const { foodRepo, addItemToMeal, dailyMeals, allMeals } = useApp();

  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'favorites' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<FoodDatabaseItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodDatabaseItem | null>(null);

  // Portion input
  const [portion, setPortion] = useState<number>(100);
  const [unit, setUnit] = useState<string>('g');

  // Custom food fields
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customQuantity, setCustomQuantity] = useState(100);
  const [customUnit, setCustomUnit] = useState('g');
  const [customCalories, setCustomCalories] = useState(150);
  const [customProtein, setCustomProtein] = useState(15);
  const [customCarbs, setCustomCarbs] = useState(10);
  const [customFat, setCustomFat] = useState(4);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  // Target meal: if mealId passed, use it; otherwise fallback to first meal of the day
  const effectiveMealId = mealId || (dailyMeals[0]?.id || allMeals[0]?.id);

  useEffect(() => {
    if (!isOpen) return;

    const loadTabFoods = async () => {
      if (activeTab === 'recent') {
        const recent = await foodRepo.getRecentFoods();
        setFoods(recent);
      } else if (activeTab === 'favorites') {
        const favs = await foodRepo.getFavoriteFoods();
        setFoods(favs);
      } else {
        const results = await foodRepo.searchFoods(searchQuery);
        setFoods(results);
      }
    };

    loadTabFoods();
  }, [isOpen, activeTab, searchQuery, foodRepo]);

  if (!isOpen) return null;

  const handleSelectFoodItem = (food: FoodDatabaseItem) => {
    setSelectedFood(food);
    setPortion(food.defaultQuantity || 100);
    setUnit(food.unit || 'g');
  };

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: string) => {
    e.stopPropagation();
    await foodRepo.toggleFavorite(foodId);
    // update in-memory
    setFoods((prev) =>
      prev.map((f) => (f.id === foodId ? { ...f, isFavorite: !f.isFavorite } : f))
    );
  };

  // Calculate live macros based on portion
  const calcNutrient = (per100: number) => {
    return Math.round(((per100 * portion) / 100) * 10) / 10;
  };

  const handleAddSelectedFoodToMeal = async () => {
    if (!effectiveMealId || !selectedFood) return;

    const calculatedCalories = Math.round((selectedFood.caloriesPer100g * portion) / 100);
    const calculatedProtein = calcNutrient(selectedFood.proteinPer100g);
    const calculatedCarbs = calcNutrient(selectedFood.carbsPer100g);
    const calculatedFat = calcNutrient(selectedFood.fatPer100g);

    await addItemToMeal(effectiveMealId, {
      name: selectedFood.name,
      description: selectedFood.category,
      quantity: Number(portion) || 100,
      unit,
      calories: calculatedCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fat: calculatedFat,
      source: 'database',
      aiEstimate: false,
    });

    onClose();
  };

  const handleSaveCustomFood = async () => {
    if (!effectiveMealId || !customName.trim()) return;

    // Optional: save to mock database for future reuse
    if (saveAsFavorite) {
      const per100Multiplier = 100 / (customQuantity || 100);
      await foodRepo.addCustomFood({
        name: customName.trim(),
        category: 'Personalizados',
        defaultQuantity: customQuantity,
        unit: customUnit,
        caloriesPer100g: Math.round(customCalories * per100Multiplier),
        proteinPer100g: Math.round(customProtein * per100Multiplier * 10) / 10,
        carbsPer100g: Math.round(customCarbs * per100Multiplier * 10) / 10,
        fatPer100g: Math.round(customFat * per100Multiplier * 10) / 10,
        isFavorite: true,
        isRecent: true,
      });
    }

    await addItemToMeal(effectiveMealId, {
      name: customName.trim(),
      description: customDescription.trim() || undefined,
      quantity: Number(customQuantity) || 100,
      unit: customUnit,
      calories: Number(customCalories) || 0,
      protein: Number(customProtein) || 0,
      carbs: Number(customCarbs) || 0,
      fat: Number(customFat) || 0,
      source: 'manual',
      aiEstimate: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Adicionar Alimento</h2>
            <p className="text-xs text-slate-500">Busque na base nutricional, escolha favoritos ou crie manualmente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            id="tab-food-search"
            onClick={() => {
              setActiveTab('search');
              setSelectedFood(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'search'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Banco de Alimentos</span>
          </button>

          <button
            id="tab-food-recent"
            onClick={() => {
              setActiveTab('recent');
              setSelectedFood(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'recent'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recentes</span>
          </button>

          <button
            id="tab-food-favs"
            onClick={() => {
              setActiveTab('favorites');
              setSelectedFood(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'favorites'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favoritos</span>
          </button>

          <button
            id="tab-food-custom"
            onClick={() => {
              setActiveTab('custom');
              setSelectedFood(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Manualmente</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab !== 'custom' ? (
            <>
              {/* Search input */}
              {activeTab === 'search' && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar alimento (ex: Frango, Arroz, Ovo, Whey...)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              )}

              {/* Food List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {foods.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Nenhum alimento encontrado para o filtro.
                  </p>
                ) : (
                  foods.map((food) => {
                    const isSelected = selectedFood?.id === food.id;
                    return (
                      <div
                        key={food.id}
                        onClick={() => handleSelectFoodItem(food)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(e, food.id)}
                            className={`p-1 rounded-md transition-colors ${
                              food.isFavorite
                                ? 'text-amber-500 hover:text-amber-600'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title="Favoritar alimento"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>

                          <div>
                            <p className="font-semibold text-slate-900">{food.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {food.category} • Base por 100g
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          <span className="font-bold text-slate-800 block">
                            {food.caloriesPer100g} kcal
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {food.proteinPer100g}P • {food.carbsPer100g}C • {food.fatPer100g}G
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Food Portion Configurator */}
              {selectedFood && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold block">Alimento Selecionado</span>
                      <h4 className="text-sm font-bold text-white">{selectedFood.name}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Porção:</label>
                      <input
                        type="number"
                        value={portion}
                        onChange={(e) => setPortion(Math.max(1, Number(e.target.value)))}
                        className="w-20 px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-center"
                      />
                      <span className="text-xs text-slate-400 font-mono">{unit}</span>
                    </div>
                  </div>

                  {/* Dynamic recalculation */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-1 border-t border-slate-800">
                    <div className="p-2 rounded-lg bg-slate-800/80">
                      <span className="text-[10px] text-amber-400 font-sans block">Calorias</span>
                      <span className="font-extrabold text-white text-sm">
                        {Math.round((selectedFood.caloriesPer100g * portion) / 100)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80">
                      <span className="text-[10px] text-emerald-400 font-sans block">Proteína</span>
                      <span className="font-bold text-emerald-300">
                        {calcNutrient(selectedFood.proteinPer100g)}g
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80">
                      <span className="text-[10px] text-blue-400 font-sans block">Carbo</span>
                      <span className="font-bold text-blue-300">
                        {calcNutrient(selectedFood.carbsPer100g)}g
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80">
                      <span className="text-[10px] text-purple-400 font-sans block">Gordura</span>
                      <span className="font-bold text-purple-300">
                        {calcNutrient(selectedFood.fatPer100g)}g
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Custom Food Form */
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nome do Alimento *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Iogurte Grego Caseiro"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Descrição / Marca (opcional)</label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Ex: Desnatado com mel"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantidade Consumida</label>
                  <input
                    type="number"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unidade</label>
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="g, ml, un, fatia"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Macronutrientes da porção</span>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans block">Calorias (kcal)</label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans block">Proteína (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans block">Carbo (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-sans block">Gordura (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveAsFavorite}
                  onChange={(e) => setSaveAsFavorite(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Salvar nos meus Favoritos para utilizar rapidamente depois</span>
              </label>
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

          {activeTab !== 'custom' ? (
            <button
              id="btn-confirm-add-food-item"
              type="button"
              onClick={handleAddSelectedFoodToMeal}
              disabled={!selectedFood}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Adicionar à Refeição
            </button>
          ) : (
            <button
              id="btn-confirm-add-custom-food"
              type="button"
              onClick={handleSaveCustomFood}
              disabled={!customName.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Salvar Alimento
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

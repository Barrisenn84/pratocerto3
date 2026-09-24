import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { calculateMealTotals, calculateDailyTotals } from '../../domain/nutrition/calculations';
import { MacroTotals } from '../../types';

export type HistoryMode = 'day' | 'week' | 'month';

export const HistoryCharts: React.FC = () => {
  const { allMeals, targets, selectedDate, setSelectedDate } = useApp();
  const [mode, setMode] = useState<HistoryMode>('week');

  // Helper to group meals by date
  const mealsByDate = useMemo(() => {
    const map = new Map<string, typeof allMeals>();
    allMeals.forEach((meal) => {
      const existing = map.get(meal.date) || [];
      map.set(meal.date, [...existing, meal]);
    });
    return map;
  }, [allMeals]);

  // Generate list of dates based on mode
  const periodData = useMemo(() => {
    const result: Array<{
      date: string;
      label: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      targetCalories: number;
      targetProtein: number;
    }> = [];

    const numDays = mode === 'day' ? 1 : mode === 'week' ? 7 : 30;

    // Use current selectedDate as anchor
    const anchor = new Date(selectedDate);

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];

      const dayMeals = mealsByDate.get(iso) || [];
      const totals: MacroTotals = calculateDailyTotals(dayMeals);

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const label =
        mode === 'day'
          ? iso
          : mode === 'week'
          ? `${dayNames[d.getDay()]} (${d.getDate()})`
          : `${d.getDate()}/${d.getMonth() + 1}`;

      result.push({
        date: iso,
        label,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        targetCalories: targets?.calories || 2500,
        targetProtein: targets?.protein || 160,
      });
    }

    return result;
  }, [mode, selectedDate, mealsByDate, targets]);

  // Summary statistics for period
  const stats = useMemo(() => {
    const activeDays = periodData.filter((d) => d.calories > 0);
    const divisor = Math.max(1, activeDays.length);

    const totalCals = periodData.reduce((acc, d) => acc + d.calories, 0);
    const totalProt = periodData.reduce((acc, d) => acc + d.protein, 0);
    const totalCarb = periodData.reduce((acc, d) => acc + d.carbs, 0);
    const totalFat = periodData.reduce((acc, d) => acc + d.fat, 0);

    const avgCals = Math.round(totalCals / divisor);
    const avgProt = Math.round((totalProt / divisor) * 10) / 10;
    const avgCarb = Math.round((totalCarb / divisor) * 10) / 10;
    const avgFat = Math.round((totalFat / divisor) * 10) / 10;

    const targetCals = targets?.calories || 2500;
    const adherenceRate = Math.round(
      (activeDays.filter((d) => Math.abs(d.calories - targetCals) <= 250).length / divisor) * 100
    );

    return {
      avgCals,
      avgProt,
      avgCarb,
      avgFat,
      daysLogged: activeDays.length,
      totalDays: periodData.length,
      adherenceRate,
      calorieDiffVsTarget: avgCals - targetCals,
    };
  }, [periodData, targets]);

  // Macro pie breakdown
  const pieData = [
    { name: 'Proteínas (4kcal/g)', value: Math.round(stats.avgProt * 4), color: '#10b981' },
    { name: 'Carboidratos (4kcal/g)', value: Math.round(stats.avgCarb * 4), color: '#3b82f6' },
    { name: 'Gorduras (9kcal/g)', value: Math.round(stats.avgFat * 9), color: '#a855f7' },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Selector & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Análise e Histórico Nutricional
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhe a consistência calórica e distribuição de macronutrientes
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {(['day', 'week', 'month'] as HistoryMode[]).map((m) => (
            <button
              key={m}
              id={`btn-mode-${m}`}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === m
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {m === 'day' ? 'Dia' : m === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytical KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Média Calórica</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-slate-900">{stats.avgCals}</span>
            <span className="text-xs text-slate-400 font-sans">kcal/dia</span>
          </div>
          <span className={`text-[11px] font-semibold mt-1 block ${
            stats.calorieDiffVsTarget > 0 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {stats.calorieDiffVsTarget > 0 ? `+${stats.calorieDiffVsTarget}` : stats.calorieDiffVsTarget} kcal vs meta
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Média de Proteína</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-emerald-700">{stats.avgProt}</span>
            <span className="text-xs text-slate-400 font-sans">g/dia</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Meta: {targets?.protein || 160}g
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Dias com Registro</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-blue-700">{stats.daysLogged}</span>
            <span className="text-xs text-slate-400 font-sans">/ {stats.totalDays} dias</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {Math.round((stats.daysLogged / stats.totalDays) * 100)}% consistência
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Adesão à Meta</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-purple-700">{stats.adherenceRate}%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dentro da faixa de tolerância
          </span>
        </div>
      </div>

      {/* Main Bar Chart: Calories vs Target */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Consumo Calórico Diário vs Meta ({targets?.calories || 2500} kcal)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Valores em kcal</span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={periodData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800 font-mono">
                        <p className="font-sans font-bold text-slate-200 mb-1">{data.date}</p>
                        <p className="font-bold text-amber-400">Calorias: {data.calories} kcal</p>
                        <p className="text-emerald-400">Proteína: {data.protein}g</p>
                        <p className="text-blue-400">Carboidratos: {data.carbs}g</p>
                        <p className="text-purple-400">Gordura: {data.fat}g</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {targets?.calories && (
                <ReferenceLine
                  y={targets.calories}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Meta: ${targets.calories} kcal`,
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
              )}
              <Bar dataKey="calories" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Chart: Macronutrient Distribution & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Protein bar chart */}
        <div className="lg:col-span-2 p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Evolução Diária de Proteína (g)
            </h3>
            <span className="text-xs text-emerald-700 font-bold font-mono">
              Meta: {targets?.protein || 160}g
            </span>
          </div>

          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                {targets?.protein && (
                  <ReferenceLine
                    y={targets.protein}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: `Meta: ${targets.protein}g`,
                      position: 'insideTopRight',
                      fill: '#10b981',
                      fontSize: 10,
                    }}
                  />
                )}
                <Bar dataKey="protein" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie distribution */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Distribuição Média de Calorias
          </h3>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} kcal`, 'Calorias']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-emerald-700 font-semibold">
              <span>● Proteína</span>
              <span className="font-mono">{stats.avgProt}g ({Math.round((stats.avgProt * 4 / Math.max(1, stats.avgCals)) * 100)}%)</span>
            </div>
            <div className="flex items-center justify-between text-blue-700 font-semibold">
              <span>● Carboidrato</span>
              <span className="font-mono">{stats.avgCarb}g ({Math.round((stats.avgCarb * 4 / Math.max(1, stats.avgCals)) * 100)}%)</span>
            </div>
            <div className="flex items-center justify-between text-purple-700 font-semibold">
              <span>● Gordura</span>
              <span className="font-mono">{stats.avgFat}g ({Math.round((stats.avgFat * 9 / Math.max(1, stats.avgCals)) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

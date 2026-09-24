import React, { useState } from 'react';
import {
  Scale,
  Camera,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Activity,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WeightChart } from './WeightChart';
import { EvolutionTimeline } from './EvolutionTimeline';

export const ProgressView: React.FC = () => {
  const {
    user,
    measurements,
    evolutionPhotos,
    deleteMeasurement,
    setAddMeasurementModalOpen,
    setAddPhotoModalOpen,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'weight' | 'photos'>('weight');

  // Stats calculation
  const initialWeight = measurements.length > 0 ? measurements[0].weight : (user?.currentWeight || 82.0);
  const currentWeight = user?.currentWeight || (measurements.length > 0 ? measurements[measurements.length - 1].weight : 78.5);
  const targetWeight = user?.targetWeight || 74.0;
  const totalChange = Math.round((currentWeight - initialWeight) * 10) / 10;
  const remainingToGoal = Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10;

  // BMI
  const heightM = (user?.height || 178) / 100;
  const bmi = Math.round((currentWeight / (heightM * heightM)) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Header KPI Cards (TELA 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso Inicial</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl sm:text-2xl font-black text-slate-800">{initialWeight}</span>
            <span className="text-xs text-slate-400 font-sans">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Início da jornada</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs ring-1 ring-emerald-500/20">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Peso Atual</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">{currentWeight}</span>
            <span className="text-xs text-slate-400 font-sans">kg</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Última pesagem</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso Meta</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl sm:text-2xl font-black text-slate-800">{targetWeight}</span>
            <span className="text-xs text-slate-400 font-sans">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Faltam {remainingToGoal} kg</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Variação Total</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span
              className={`text-xl sm:text-2xl font-black ${
                totalChange < 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {totalChange > 0 ? `+${totalChange}` : totalChange}
            </span>
            <span className="text-xs text-slate-400 font-sans">kg</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
            {totalChange < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>Diferença acumulada</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">IMC Atual</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl sm:text-2xl font-black text-slate-800">{bmi}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Eutrofia (Normal)</span>
        </div>
      </div>

      {/* Action Bar & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="tab-progress-weight"
            onClick={() => setActiveSubTab('weight')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'weight'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Peso & Medidas ({measurements.length})
          </button>
          <button
            id="tab-progress-photos"
            onClick={() => setActiveSubTab('photos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'photos'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fotos de Evolução ({evolutionPhotos.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-add-measurement"
            onClick={() => setAddMeasurementModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>+ Registrar Medição</span>
          </button>

          <button
            id="btn-open-add-photo"
            onClick={() => setAddPhotoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>+ Nova Foto</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Weight & Anthropometric Measurements */}
      {activeSubTab === 'weight' && (
        <div className="space-y-6">
          {/* Main Chart */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Curva de Evolução do Peso</h3>
                <p className="text-xs text-slate-500">Histórico de pesagens com linha de meta de referência</p>
              </div>
              <span className="text-xs text-emerald-600 font-mono font-bold">
                Meta: {targetWeight} kg
              </span>
            </div>

            <WeightChart measurements={measurements} user={user} />
          </div>

          {/* Table of Measurements */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Histórico de Medições Antropométricas</h3>
                <p className="text-xs text-slate-500">Registros detalhados de pesagem e circunferências</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {measurements.length} {measurements.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Peso (kg)</th>
                    <th className="py-3 px-4">Cintura</th>
                    <th className="py-3 px-4">Braço</th>
                    <th className="py-3 px-4">Tórax</th>
                    <th className="py-3 px-4">Coxa</th>
                    <th className="py-3 px-4">Observações</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {measurements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900">{m.date}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{m.weight} kg</td>
                      <td className="py-3 px-4 text-slate-600">{m.waist ? `${m.waist} cm` : '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{m.arm ? `${m.arm} cm` : '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{m.chest ? `${m.chest} cm` : '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{m.thigh ? `${m.thigh} cm` : '-'}</td>
                      <td className="py-3 px-4 font-sans text-slate-500 max-w-xs truncate">
                        {m.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja excluir a medição de ${m.date}?`)) {
                              deleteMeasurement(m.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir medição"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Visual Evolution Photos (TELA 12) */}
      {activeSubTab === 'photos' && (
        <div className="space-y-6">
          <EvolutionTimeline photos={evolutionPhotos} />
        </div>
      )}
    </div>
  );
};

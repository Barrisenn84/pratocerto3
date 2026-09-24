import React, { useState } from 'react';
import { X, Scale, Calendar, FileText, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addMeasurement, user, selectedDate } = useApp();

  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState<number>(user?.currentWeight || 78.5);
  const [waist, setWaist] = useState<number | ''>(85);
  const [arm, setArm] = useState<number | ''>(38.8);
  const [chest, setChest] = useState<number | ''>(105);
  const [thigh, setThigh] = useState<number | ''>(58.5);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    await addMeasurement({
      userId: user?.id || 'demo_user_01',
      date,
      weight: Number(weight),
      waist: waist ? Number(waist) : undefined,
      arm: arm ? Number(arm) : undefined,
      chest: chest ? Number(chest) : undefined,
      thigh: thigh ? Number(thigh) : undefined,
      notes: notes.trim() || undefined,
      photo: photoUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Registrar Medição Corporal</h2>
              <p className="text-xs text-slate-500">Acompanhe seu peso e medidas antropométricas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Data da Pesagem</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Peso Atual (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-sm"
                required
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">
              Circunferências Corporais (opcional, em cm)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div>
                <label className="text-[10px] text-slate-500 font-sans block">Cintura</label>
                <input
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value ? Number(e.target.value) : '')}
                  placeholder="cm"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-sans block">Braço</label>
                <input
                  type="number"
                  step="0.1"
                  value={arm}
                  onChange={(e) => setArm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="cm"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-sans block">Tórax</label>
                <input
                  type="number"
                  step="0.1"
                  value={chest}
                  onChange={(e) => setChest(e.target.value ? Number(e.target.value) : '')}
                  placeholder="cm"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-sans block">Coxa</label>
                <input
                  type="number"
                  step="0.1"
                  value={thigh}
                  onChange={(e) => setThigh(e.target.value ? Number(e.target.value) : '')}
                  placeholder="cm"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pesagem em jejum após treino de perna, sensação de boa recuperação."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 h-20 resize-none"
            />
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between -mx-5 -mb-5 bg-slate-50 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-measurement"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Salvar Medição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

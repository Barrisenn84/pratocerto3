import React, { useState } from 'react';
import { X, Camera, Upload, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addEvolutionPhoto, user, selectedDate } = useApp();

  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [weight, setWeight] = useState<number>(user?.currentWeight || 78.5);
  const [weekLabel, setWeekLabel] = useState('Semana Atual');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;

    await addEvolutionPhoto({
      userId: user?.id || 'demo_user_01',
      date,
      photoUrl,
      weight: Number(weight),
      weekLabel: weekLabel.trim() || 'Semana Registrada',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Nova Foto de Evolução</h2>
              <p className="text-xs text-slate-500">Adicione à sua linha do tempo corporal</p>
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
          {/* Photo preview or uploader */}
          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden h-48 bg-slate-900 border border-slate-200">
              <img
                src={photoUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-medium"
              >
                Trocar foto
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 space-y-2">
              <Upload className="w-6 h-6 text-purple-600 mx-auto" />
              <p className="font-semibold text-slate-800">Escolha uma foto de progresso</p>
              <p className="text-slate-400 text-[11px]">Suporta upload de foto ou câmera</p>
              <label className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload de Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Data da Foto</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Peso na época (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Rótulo da Fase (ex: Semana 8)</label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="Ex: Semana 10 (Fim do Bulking)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notas da Evolução</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Definição muscular mantida, ombros mais cheios."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 h-16 resize-none"
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
              id="btn-save-evolution-photo"
              type="submit"
              disabled={!photoUrl}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              Salvar Foto de Evolução
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

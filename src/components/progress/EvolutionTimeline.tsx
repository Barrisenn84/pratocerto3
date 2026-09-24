import React, { useState } from 'react';
import { Camera, Calendar, Scale, Trash2, Plus, ExternalLink, X } from 'lucide-react';
import { EvolutionPhoto } from '../../types';
import { useApp } from '../../context/AppContext';

interface EvolutionTimelineProps {
  photos: EvolutionPhoto[];
}

export const EvolutionTimeline: React.FC<EvolutionTimelineProps> = ({ photos }) => {
  const { deleteEvolutionPhoto, setAddPhotoModalOpen } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<EvolutionPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
          <Camera className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">Nenhuma foto de evolução ainda</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Adicione fotos semanais para acompanhar sua transformação corporal e densidade muscular ao longo do tempo.
        </p>
        <button
          onClick={() => setAddPhotoModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Primeira Foto</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Linha do Tempo Visual ({photos.length} registros)
        </span>
        <button
          onClick={() => setAddPhotoModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Foto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {photos.map((item, idx) => (
          <div
            key={item.id}
            className="group relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
          >
            {/* Image Container */}
            <div
              onClick={() => setSelectedPhoto(item)}
              className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900 cursor-pointer"
            >
              <img
                src={item.photoUrl}
                alt={item.weekLabel}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3.5">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white font-bold text-xs border border-white/20">
                    {item.weekLabel}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Excluir esta foto da linha do tempo?')) {
                        deleteEvolutionPhoto(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-black/50 text-white/70 hover:text-rose-400 hover:bg-black transition-colors"
                    title="Excluir foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-white space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                    <Scale className="w-3.5 h-3.5" />
                    <span>{item.weight} kg</span>
                    <span className="text-slate-400 font-sans font-normal text-[10px]">• {item.date}</span>
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Size Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-96 w-full overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.weekLabel}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-5 text-white space-y-1 bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">{selectedPhoto.weekLabel}</h3>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {selectedPhoto.weight} kg
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{selectedPhoto.date}</p>
              {selectedPhoto.notes && (
                <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                  {selectedPhoto.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { CalendarDays, BarChart3, TrendingUp, Settings, Plus, Sparkles } from 'lucide-react';
import { useApp, ActivePage } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentPage, setCurrentPage, setQuickLogModalOpen } = useApp();

  const navButtons: Array<{ id: ActivePage; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: 'Hoje', icon: CalendarDays },
    { id: 'history', label: 'Histórico', icon: BarChart3 },
    { id: 'assistant', label: 'IA Coach', icon: Sparkles },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg safe-area-inset-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Left 2 items */}
        {navButtons.slice(0, 2).map((btn) => {
          const Icon = btn.icon;
          const isActive = currentPage === btn.id;
          return (
            <button
              key={btn.id}
              id={`mobile-nav-${btn.id}`}
              onClick={() => setCurrentPage(btn.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 transition-colors cursor-pointer ${
                isActive ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[10px] mt-0.5">{btn.label}</span>
            </button>
          );
        })}

        {/* Center Prominent "+" Quick Action */}
        <div className="flex flex-col items-center -mt-5">
          <button
            id="mobile-nav-central-add"
            onClick={() => setQuickLogModalOpen(true)}
            className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-4 border-white transition-all cursor-pointer"
            aria-label="Registrar Refeição"
          >
            <Plus className="w-6 h-6 stroke-[2.5px]" />
          </button>
          <span className="text-[10px] font-semibold text-emerald-700 mt-1">Registrar</span>
        </div>

        {/* Right 2 items */}
        {navButtons.slice(2, 4).map((btn) => {
          const Icon = btn.icon;
          const isActive = currentPage === btn.id;
          return (
            <button
              key={btn.id}
              id={`mobile-nav-${btn.id}`}
              onClick={() => setCurrentPage(btn.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 transition-colors cursor-pointer ${
                isActive ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[10px] mt-0.5">{btn.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

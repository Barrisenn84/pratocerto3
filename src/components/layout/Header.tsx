import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Flame,
  User,
  LogIn,
  ShieldCheck,
  Mic,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    user,
    isAuthenticated,
    selectedDate,
    setSelectedDate,
    changeDateByDays,
    goToToday,
    setQuickLogModalOpen,
    setCurrentPage,
    currentPage,
    setAuthModalOpen,
    setVoiceAssistantOpen,
  } = useApp();

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDisplayDate = (isoDate: string) => {
    try {
      const [year, month, day] = isoDate.split('-').map((v) => parseInt(v, 10));
      const dateObj = new Date(year, month - 1, day);

      const todayStr = new Date().toISOString().split('T')[0];
      const yestDate = new Date();
      yestDate.setDate(yestDate.getDate() - 1);
      const yestStr = yestDate.toISOString().split('T')[0];

      if (isoDate === todayStr) {
        return 'Hoje, ' + dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      }
      if (isoDate === yestStr) {
        return 'Ontem, ' + dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      }

      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand logo for mobile & greeting */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1">
                Nutri<span className="text-emerald-600">Macro</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block leading-none">
                Nutrição & Evolução
              </span>
            </div>
          </div>

          {/* User greeting */}
          {user && (
            <div className="hidden xl:flex items-center pl-4 border-l border-slate-200">
              <span className="text-xs text-slate-600 font-medium">
                Olá, <strong className="text-slate-900 font-semibold">{user.name.split(' ')[0]}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Center: Interactive Date Navigator */}
        {currentPage === 'home' && (
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-xs">
            <button
              id="btn-date-prev"
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Dia anterior"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 py-0.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800 capitalize min-w-[110px] text-center">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>

            <button
              id="btn-date-next"
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Próximo dia"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                id="btn-date-today"
                onClick={goToToday}
                className="hidden sm:inline-flex text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80 px-2 py-1 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                Hoje
              </button>
            )}

            {/* Hidden native date input for explicit date selection */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="opacity-0 absolute w-0 h-0 pointer-events-none"
              id="header-hidden-datepicker"
            />
            <label
              htmlFor="header-hidden-datepicker"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer hidden md:flex items-center"
              title="Escolher data específica"
            >
              <span className="text-xs font-mono">📅</span>
            </label>
          </div>
        )}

        {/* Right: Quick actions & profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {!isAuthenticated && (
            <button
              id="btn-header-login"
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar / Login</span>
            </button>
          )}

          <button
            id="btn-header-voice-assistant"
            type="button"
            onClick={() => setVoiceAssistantOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-750 border border-slate-200/80 text-xs font-semibold transition-all cursor-pointer group"
            title="Falar com o app por áudio em linguagem natural"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-bold">Voz AI</span>
          </button>

          <button
            id="btn-header-quick-log"
            onClick={() => setQuickLogModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Registrar</span>
            <span className="xs:hidden">+</span>
          </button>

          {/* User Avatar button */}
          <button
            id="btn-header-user-profile"
            onClick={() => setCurrentPage('settings')}
            className="p-1 rounded-full border border-slate-200 hover:border-emerald-500 transition-colors cursor-pointer relative group"
            title="Configurações e Perfil"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                isAuthenticated ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            ></span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import {
  CalendarDays,
  BarChart3,
  TrendingUp,
  Settings,
  Plus,
  Camera,
  Sparkles,
  LogOut,
  LogIn,
  Target,
  ShieldCheck,
  Mic,
  Radio,
} from 'lucide-react';
import { useApp, ActivePage } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    user,
    isAuthenticated,
    setQuickLogModalOpen,
    setFoodVisionModalOpen,
    setVoiceAssistantOpen,
    logoutUser,
    loginWithGoogle,
    setAuthModalOpen,
  } = useApp();

  const navItems: Array<{ id: ActivePage; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: 'Diário & Hoje', icon: CalendarDays },
    { id: 'history', label: 'Histórico & Metas', icon: BarChart3 },
    { id: 'progress', label: 'Evolução Corporal', icon: TrendingUp },
    { id: 'assistant', label: 'Assistente IA Coach', icon: Sparkles },
    { id: 'settings', label: 'Configurações & Perfil', icon: Settings },
  ];

  const goalLabels: Record<string, { label: string; color: string }> = {
    cutting: { label: 'Cutting (Secar)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    weight_loss: { label: 'Definição (Secar)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    bulking: { label: 'Bulking (Massa)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    hypertrophy: { label: 'Hipertrofia (Massa)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    maintenance: { label: 'Manutenção', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  };

  const currentGoal = (user?.goal && goalLabels[user.goal]) || goalLabels.bulking || {
    label: 'Meta Ativa',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200/80 p-5 shrink-0 min-h-[calc(100vh-45px)] justify-between select-none">
      <div className="space-y-6">
        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            id="sidebar-btn-quick-log"
            onClick={() => setQuickLogModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Refeição</span>
          </button>

          <button
            id="sidebar-btn-ai-vision"
            onClick={() => setFoodVisionModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-medium text-xs border border-slate-800 shadow-sm transition-all cursor-pointer group"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Fotografar Refeição</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
              IA Câmera
            </span>
          </button>

          <button
            id="sidebar-btn-voice-assistant"
            onClick={() => setVoiceAssistantOpen(true)}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 hover:from-emerald-900 hover:to-slate-800 text-emerald-300 font-medium text-xs border border-emerald-800/60 shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span>Gemini 3.8 Live</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/25 text-emerald-300 rounded-md font-mono font-bold uppercase tracking-wider">
              Voz Real-Time
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
            Navegação Principal
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Goal Indicator Card */}
        {user && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                Objetivo Atual
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${currentGoal?.color || 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                {currentGoal?.label || 'Objetivo'}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs text-slate-700 pt-1">
              <span>Peso Atual:</span>
              <span className="font-bold text-slate-900 text-sm">{user.currentWeight} kg</span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-500">
              <span>Meta Final:</span>
              <span className="font-semibold text-slate-700">{user.targetWeight} kg</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer User Profile & Auth */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        {isAuthenticated && user ? (
          <>
            <div
              onClick={() => setCurrentPage('settings')}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>{user.name}</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user.email || 'Conta Conectada'}</p>
              </div>
            </div>

            <button
              id="sidebar-btn-logout"
              onClick={logoutUser}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta (Logout)</span>
            </button>
          </>
        ) : (
          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-800">Sincronize Seus Dados</p>
            <p className="text-[11px] text-slate-500">Conecte-se para salvar suas refeições no banco real</p>
            <button
              id="sidebar-btn-login-google"
              onClick={loginWithGoogle}
              className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>
            <button
              id="sidebar-btn-login-email"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Cadastrar</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

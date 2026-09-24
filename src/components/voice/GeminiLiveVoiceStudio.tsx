import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  RotateCcw,
  User,
  Bot,
  Flame,
  Droplets,
  Zap,
  Info,
  Send,
  CheckCircle2,
  AlertTriangle,
  Utensils,
  ExternalLink,
} from 'lucide-react';
import { useGeminiLiveSession, LIVE_VOICES } from '../../hooks/useGeminiLiveSession';
import { useApp } from '../../context/AppContext';
import { FormattedMarkdown } from '../common/FormattedMarkdown';
import { MealItem, MealType, Meal } from '../../types';

interface GeminiLiveVoiceStudioProps {
  onClose?: () => void;
  onSwitchToCommandMode?: () => void;
}

export const GeminiLiveVoiceStudio: React.FC<GeminiLiveVoiceStudioProps> = ({
  onClose,
  onSwitchToCommandMode,
}) => {
  const {
    user,
    targets,
    dailyTotals,
    dailyMeals,
    waterIntakeMl,
    selectedDate,
    createMeal,
    addWaterIntake,
    setCurrentPage,
    setFoodVisionModalOpen,
  } = useApp();

  const [typedInput, setTypedInput] = useState('');
  const [lastLiveMeal, setLastLiveMeal] = useState<Meal | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const userContext = {
    userName: user?.name || 'Atleta',
    goal: user?.goal || 'hipertrofia',
    currentWeight: user?.currentWeight,
    targetWeight: user?.targetWeight,
    targets,
    dailyTotals,
    dailyMealsCount: dailyMeals.length,
    waterIntakeMl,
    selectedDate,
  };

  const handleLiveToolCall = useCallback(
    async (functionCall: { name: string; args: any; id?: string }) => {
      console.log('[GeminiLiveVoiceStudio] Executing live tool:', functionCall.name, functionCall.args);
      const { name, args } = functionCall;

      if (name === 'register_meal' && args) {
        const mealType: MealType =
          ['breakfast', 'lunch', 'snack', 'dinner', 'supper', 'other'].includes(args.mealType)
            ? args.mealType
            : 'lunch';

        const rawItems = Array.isArray(args.items) ? args.items : [];
        const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const todayIso = new Date().toISOString().split('T')[0];
        const dateToUse = selectedDate || todayIso;

        const mealItems: MealItem[] =
          rawItems.length > 0
            ? rawItems.map((item: any, idx: number) => ({
                id: `live_voice_item_${Date.now()}_${idx}`,
                mealId: '',
                name: item.name || 'Alimento',
                quantity: Number(item.quantity) || 1,
                unit: item.unit || 'porção',
                calories: Math.round(Number(item.calories) || 0),
                protein: Number((Number(item.protein) || 0).toFixed(1)),
                carbs: Number((Number(item.carbs) || 0).toFixed(1)),
                fat: Number((Number(item.fat) || 0).toFixed(1)),
                source: 'voice',
                aiEstimate: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }))
            : [
                {
                  id: `live_voice_item_${Date.now()}_0`,
                  mealId: '',
                  name: args.mealName || 'Refeição Registrada por Voz',
                  quantity: 1,
                  unit: 'porção',
                  calories: 300,
                  protein: 20,
                  carbs: 30,
                  fat: 8,
                  source: 'voice',
                  aiEstimate: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ];

        const mealName = args.mealName || (
          mealType === 'breakfast' ? 'Café da Manhã' :
          mealType === 'dinner' ? 'Jantar' :
          mealType === 'snack' ? 'Lanche' :
          mealType === 'supper' ? 'Ceia' : 'Almoço'
        );

        try {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('nutrimacro_data_cleared');
            } catch {}
          }

          const savedMeal = await createMeal({
            userId: user?.id || 'user',
            date: dateToUse,
            time: currentTime,
            type: mealType,
            name: `${mealName} (Voz Live)`,
            items: mealItems,
          });

          setLastLiveMeal(savedMeal);
          console.log('[GeminiLiveVoiceStudio] Meal saved to Firestore/Local successfully:', savedMeal.id);
        } catch (err) {
          console.error('[GeminiLiveVoiceStudio] Error saving meal from tool call:', err);
        }
      } else if (name === 'register_water' && args) {
        const amount = Number(args.amountMl) || 250;
        addWaterIntake(amount, selectedDate);
      } else if (name === 'navigate_screen' && args) {
        const target = args.screen;
        if (target === 'camera') {
          onClose?.();
          setFoodVisionModalOpen(true);
        } else if (['home', 'history', 'progress', 'assistant', 'settings'].includes(target)) {
          setCurrentPage(target as any);
        }
      }
    },
    [createMeal, addWaterIntake, setCurrentPage, setFoodVisionModalOpen, onClose, selectedDate, user]
  );

  const {
    status,
    errorMessage,
    selectedVoice,
    setSelectedVoice,
    userVolume,
    geminiVolume,
    liveTranscript,
    conversationLogs,
    startSession,
    endSession,
    sendTextMessage,
    stopAllPlayback,
  } = useGeminiLiveSession({
    userContext,
    defaultVoice: 'Zephyr',
    onToolCall: handleLiveToolCall,
  });

  const isLiveActive = status === 'connected' || status === 'listening' || status === 'speaking' || status === 'interrupted';
  const isConnecting = status === 'connecting';

  // Auto-scroll chat to latest messages
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationLogs, liveTranscript]);

  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    sendTextMessage(typedInput);
    setTypedInput('');
  };

  const quickLivePrompts = [
    'Como estão minhas calorias e proteínas hoje?',
    'Sugira uma opção rica em proteína para o jantar.',
    'Comi 2 ovos e 1 fatia de pão integral, quantos macros tem?',
    'Qual a importância da hidratação para o meu objetivo de hipertrofia?',
    'Ainda faltam 50g de proteína, o que posso comer?',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Voice Configuration & Real-Time Status Bar */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            {isLiveActive && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-300">
            {isLiveActive ? 'Sessão de Voz Ativa' : 'Pronto para Conectar'}
          </span>
        </div>

        {/* Voice Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Voz:</span>
          <select
            value={selectedVoice}
            disabled={isLiveActive || isConnecting}
            onChange={(e) => setSelectedVoice(e.target.value as any)}
            className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            {LIVE_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                🎙️ {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="p-6 bg-radial from-slate-850 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden border-b border-slate-800">
        {/* Glow ambient effects */}
        {isLiveActive && (
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl -z-0 pointer-events-none transition-all duration-300"
            style={{
              background:
                status === 'speaking'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)'
                  : 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 70%)',
              transform: `scale(${1 + (status === 'speaking' ? geminiVolume * 1.5 : userVolume * 1.5)})`,
            }}
          />
        )}

        {/* Status Pill Badge */}
        <div className="mb-4 z-10">
          {status === 'disconnected' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Pronto para iniciar a chamada
            </span>
          )}
          {status === 'connecting' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Conectando com Gemini Live...
            </span>
          )}
          {status === 'listening' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Ouvindo sua voz em tempo real... Fale à vontade
            </span>
          )}
          {status === 'speaking' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              Gemini Live falando... (Você pode interromper a qualquer momento)
            </span>
          )}
          {status === 'interrupted' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Interrompido • Ouvindo você...
            </span>
          )}
          {status === 'error' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Erro de Conexão
            </span>
          )}
        </div>

        {/* Central Live Button / Call Action */}
        <div className="relative z-10 my-3">
          {isLiveActive && (
            <>
              <div
                className="absolute -inset-6 rounded-full bg-emerald-500/20 animate-ping opacity-60"
                style={{ animationDuration: '2s' }}
              />
              <div
                className="absolute -inset-10 rounded-full bg-emerald-500/10 animate-pulse"
                style={{
                  transform: `scale(${1 + (status === 'speaking' ? geminiVolume : userVolume)})`,
                }}
              />
            </>
          )}

          {isLiveActive ? (
            <button
              onClick={endSession}
              className="relative z-10 w-22 h-22 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border-2 border-rose-400"
              title="Encerrar Conversa ao Vivo"
            >
              <PhoneOff className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Encerrar</span>
            </button>
          ) : (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="relative z-10 w-22 h-22 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-xl shadow-emerald-500/35 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-60 border-2 border-emerald-300"
              title="Iniciar Conversa com Gemini 3.8 Live"
            >
              <PhoneCall className="w-8 h-8 text-slate-950" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-950">
                {isConnecting ? 'Conectando' : 'Iniciar'}
              </span>
            </button>
          )}
        </div>

        {/* Real-time Dynamic Equalizer Bars */}
        <div className="flex items-center justify-center gap-1.5 h-10 mt-3 z-10">
          {[20, 45, 80, 50, 95, 30, 90, 60, 100, 40, 70, 25, 85, 55, 30].map((baseHeight, i) => {
            const activeVol = status === 'speaking' ? geminiVolume : isLiveActive ? userVolume : 0;
            const currentHeight = Math.max(8, Math.min(100, baseHeight * (activeVol > 0.05 ? activeVol * 2.2 : 0.2)));
            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  status === 'speaking'
                    ? 'bg-gradient-to-t from-emerald-600 to-teal-300'
                    : isLiveActive
                    ? 'bg-gradient-to-t from-cyan-600 to-sky-300'
                    : 'bg-slate-800'
                }`}
                style={{
                  height: `${currentHeight}%`,
                }}
              />
            );
          })}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-3 max-w-md px-3.5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center z-10 space-y-1.5">
            <p>{errorMessage}</p>
            {onSwitchToCommandMode && (
              <button
                onClick={onSwitchToCommandMode}
                className="inline-block mt-1 px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
              >
                Alternar para Modo Comandos (Voz Instantânea)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Stream Transcript and Dialogue Area */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-slate-950/60 max-h-60 sm:max-h-72">
        {conversationLogs.length === 0 && !liveTranscript && (
          <div className="text-center py-6 text-slate-400 space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 text-emerald-400 mb-1">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-300">
              {isLiveActive
                ? 'Fale com o Gemini 3.8 Live para começar a conversa...'
                : 'Toque no botão verde acima para iniciar a conversa por voz em tempo real.'}
            </p>
            <p className="text-[11px] text-slate-500">
              O modelo processa áudio nativo em ultra-baixa latência com síntese vocal contínua.
            </p>
          </div>
        )}

        {/* Stored Dialogues */}
        {conversationLogs.map((log, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              log.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {log.sender === 'gemini' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm ${
                log.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-slate-800/90 border border-slate-700 text-slate-200 rounded-tl-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5 text-[10px] opacity-70">
                <span className="font-bold">{log.sender === 'user' ? 'Você' : 'Gemini Live'}</span>
                <span>{log.time}</span>
              </div>
              {log.sender === 'gemini' ? (
                <FormattedMarkdown content={log.text} className="text-slate-200" />
              ) : (
                <p className="leading-relaxed whitespace-pre-wrap">{log.text}</p>
              )}
            </div>
          </div>
        ))}

        {/* Live streaming text chunk from Gemini */}
        {liveTranscript && (
          <div className="flex items-start gap-2.5 justify-start animate-in fade-in">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs sm:text-sm bg-slate-800/90 border border-emerald-500/40 text-emerald-200">
              <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">
                Gemini Live (Falando agora...)
              </span>
              <p className="leading-relaxed">{liveTranscript}</p>
            </div>
          </div>
        )}

        {/* Verified Meal Confirmation Card */}
        {lastLiveMeal && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-900/60 border border-emerald-500/60 shadow-lg space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Refeição Confirmada no Diário!
                  </h4>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    {lastLiveMeal.name} • {lastLiveMeal.time}
                  </span>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                ✅ Gravado no Firestore
              </span>
            </div>

            {/* Micro items list */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-900/50 space-y-1">
              {lastLiveMeal.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>• {it.name} ({it.quantity} {it.unit})</span>
                  <span className="font-mono text-emerald-400 font-semibold">{it.calories} kcal | {it.protein}g P</span>
                </div>
              ))}
              <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-white">
                <span>Total:</span>
                <span className="font-mono text-emerald-300">
                  {lastLiveMeal.items.reduce((acc, it) => acc + (it.calories || 0), 0)} kcal • {Math.round(lastLiveMeal.items.reduce((acc, it) => acc + (it.protein || 0), 0))}g Proteína
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose?.();
                setCurrentPage('home');
              }}
              className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <span>Ver no Diário de Hoje</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div ref={logsEndRef} />
      </div>

      {/* Quick Questions Suggestions */}
      <div className="p-3 bg-slate-900 border-t border-slate-800/80 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
          Dicas de perguntas por voz:
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickLivePrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isLiveActive) {
                  startSession();
                }
                sendTextMessage(q);
              }}
              className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-emerald-950/40 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-colors cursor-pointer shrink-0"
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Text Fallback / Direct Prompt Input */}
      {isLiveActive && (
        <form
          onSubmit={handleSendTyped}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Envie uma mensagem de texto para o Gemini Live..."
            className="flex-1 bg-slate-900 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-hidden focus:border-emerald-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!typedInput.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

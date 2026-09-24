import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  Target,
  Flame,
  CheckCircle2,
  RefreshCw,
  Info,
  Mic,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateDailyTotals } from '../../domain/nutrition/calculations';
import { FormattedMarkdown } from '../common/FormattedMarkdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
}

export const AIAssistantView: React.FC = () => {
  const { user, targets, dailyMeals, selectedDate, waterIntakeMl, allMeals, setVoiceAssistantOpen } = useApp();

  const dailyTotals = calculateDailyTotals(dailyMeals);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initial welcome message with current context
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá, ${user?.name ? user.name.split(' ')[0] : 'Atleta'}! Sou seu **NutriMacro AI Coach**, alimentado pelo Gemini.\n\nEstou conectado aos seus dados reais de hoje (${selectedDate}). Você já registrou **${dailyTotals.calories} kcal** e **${Math.round(dailyTotals.protein)}g de proteína** da sua meta de **${targets?.calories || 2400} kcal**.\n\nComo posso ajudar na sua nutrição agora?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      toolsUsed: ['getUserGoals', 'getDailyTotals'],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Quanto de proteína ainda falta para minha meta hoje?',
    'Como está meu balanço calórico para o restante do dia?',
    'Quais foram os alimentos que consumi hoje?',
    'Sugira opções para bater a meta de proteínas no jantar.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build updated conversation context
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          userContext: {
            user,
            targets,
            dailyTotals,
            todayMeals: dailyMeals,
            selectedDate,
            waterIntakeMl,
            totalLoggedMealsCount: allMeals.length,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: json.reply || 'Desculpe, não consegui obter uma resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: ['calculateDailyTotals', 'getUserGoals'],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error contacting AI Assistant:', err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content:
          'Houve uma instabilidade ao conectar com o serviço de IA. Mas não se preocupe: todos os seus registros de refeições e gráficos continuam salvos e funcionando normalmente no aplicativo.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const remainingCals = (targets?.calories || 2400) - dailyTotals.calories;
  const remainingProt = (targets?.protein || 160) - dailyTotals.protein;

  return (
    <div className="space-y-5">
      {/* Top Banner & Context Telemetry */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Assistente Nutricional AI Coach
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
                  Gemini 3.8 Flash
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Respostas orientadas com fundamentação estrita nos seus dados de hoje ({selectedDate})
              </p>
            </div>
          </div>
        </div>

        {/* Live Macro Telemetry Snapshot */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 self-start md:self-auto text-xs">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Calorias</span>
            <span className="font-bold text-slate-900">{dailyTotals.calories} / {targets?.calories || 2400}</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Proteína</span>
            <span className="font-bold text-emerald-600">{Math.round(dailyTotals.protein)}g / {targets?.protein || 160}g</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Refeições</span>
            <span className="font-bold text-slate-700">{dailyMeals.length} hoje</span>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[580px] overflow-hidden">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isAI
                      ? 'bg-purple-600 text-white shadow-purple-600/20'
                      : 'bg-emerald-600 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1 max-w-[85%] sm:max-w-[75%]">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAI
                        ? 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-sm'
                        : 'bg-emerald-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {/* Render message formatting */}
                    {isAI ? (
                      <FormattedMarkdown content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}

                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">Dados consultados:</span>
                        {msg.toolsUsed.map((tool) => (
                          <span
                            key={tool}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono"
                          >
                            {tool}()
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[10px] text-slate-400 block px-1 ${
                      isAI ? 'text-left' : 'text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-3xl">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 rounded-tl-sm text-xs text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                <span>Consultando regras de negócio e calculando dados reais...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 pl-1">
            Sugestões:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 px-3 py-1.5 rounded-full border border-slate-200 shrink-0 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            id="btn-assistant-voice-input"
            onClick={() => setVoiceAssistantOpen(true)}
            className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200/90 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Conversar por áudio em linguagem natural"
          >
            <Mic className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Voz AI</span>
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Pergunte ao AI Coach sobre suas calorias, metas ou evolução..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            disabled={isLoading}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-600/30 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>

      {/* Medical/Clinical Guardrail Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-[11px] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Aviso de Uso Responsável:</strong> O NutriMacro AI Coach é uma ferramenta de apoio ao acompanhamento de metas pessoais de bem-estar. Suas estimativas e orientações não substituem diagnósticos clínicos, prescrições médicas ou planos alimentares elaborados por nutricionistas certificados.
        </p>
      </div>
    </div>
  );
};

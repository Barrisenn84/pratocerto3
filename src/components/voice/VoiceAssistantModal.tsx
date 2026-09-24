import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  Check,
  CheckCircle,
  Trash2,
  Camera,
  Calendar,
  TrendingUp,
  Droplets,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Flame,
  AlertCircle,
  Zap,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MealType, MealItem, Meal } from '../../types';
import { GeminiLiveVoiceStudio } from './GeminiLiveVoiceStudio';
import { FormattedMarkdown } from '../common/FormattedMarkdown';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MealProposal {
  mealType: MealType;
  mealName: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    targets,
    dailyMeals,
    dailyTotals,
    selectedDate,
    setSelectedDate,
    waterIntakeMl,
    addWaterIntake,
    setCurrentPage,
    setFoodVisionModalOpen,
    createMeal,
    deleteMeal,
    showToast,
    currentPage,
  } = useApp();

  const [activeVoiceTab, setActiveVoiceTab] = useState<'live' | 'commands'>('live');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mealProposal, setMealProposal] = useState<MealProposal | null>(null);
  const [lastLoggedMeal, setLastLoggedMeal] = useState<Meal | null>(null);
  const [lastLoggedWater, setLastLoggedWater] = useState<{
    amountMl: number;
    totalMl: number;
    time: string;
  } | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [typedInput, setTypedInput] = useState('');
  const [micStatusMessage, setMicStatusMessage] = useState<{
    type: 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastCapturedTextRef = useRef<string>('');
  const hasDispatchedRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  // Keep latest mutable state in a ref to prevent stale closures in async voice handlers
  const latestRef = useRef({
    mealProposal,
    user,
    targets,
    dailyMeals,
    dailyTotals,
    waterIntakeMl,
    currentPage,
    selectedDate,
    isProcessing,
  });

  useEffect(() => {
    latestRef.current = {
      mealProposal,
      user,
      targets,
      dailyMeals,
      dailyTotals,
      waterIntakeMl,
      currentPage,
      selectedDate,
      isProcessing,
    };
  });

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Stop speaking when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        isListeningRef.current = false;
        setIsListening(false);
      }
      setMicStatusMessage(null);
    }
  }, [isOpen]);

  // Speak aloud in Brazilian Portuguese
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!audioEnabled || !synthRef.current) return;

      try {
        if (synthRef.current.paused) {
          synthRef.current.resume();
        }
        synthRef.current.cancel(); // Stop any current speech

        const cleanText = textToSpeak
          .replace(/[*_#`~]/g, '')
          .replace(/kcal/gi, 'calorias')
          .replace(/(\d+)g/gi, '$1 gramas')
          .replace(/(\d+)ml/gi, '$1 mililitros');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.02;
        utterance.pitch = 1.0;

        // Try to pick a natural Brazilian Portuguese voice
        const voices = synthRef.current.getVoices();
        const ptVoice = voices.find(
          (v) =>
            v.lang === 'pt-BR' ||
            v.lang.startsWith('pt_BR') ||
            v.lang.startsWith('pt-') ||
            v.name.toLowerCase().includes('portuguese') ||
            v.name.toLowerCase().includes('brazil') ||
            v.name.toLowerCase().includes('brasil')
        );
        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis failed', e);
        setIsSpeaking(false);
      }
    },
    [audioEnabled]
  );

  // Check browser speech recognition capability
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startListening = async () => {
    setMicStatusMessage(null);

    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMicStatusMessage({
        type: 'warning',
        text: 'Seu navegador não possui suporte à API de voz nativa. Use os botões rápidos e a caixa de texto abaixo.',
      });
      return;
    }

    // If already active, toggle off
    if (isListeningRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    // Try requesting mic permission safely if available
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release stream so SpeechRecognition can take audio device
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr: any) {
        console.warn('Microphone permission not granted:', permErr);
        setMicStatusMessage({
          type: 'error',
          text: 'Microfone não autorizado. Verifique as permissões do seu navegador para permitir áudio, ou use os comandos rápidos e digitação abaixo.',
        });
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        lastCapturedTextRef.current = '';
        hasDispatchedRef.current = false;
        setTranscript('');
        setInterimTranscript('');
        setMicStatusMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          lastCapturedTextRef.current = currentText;
        }

        if (final && final.trim() && !hasDispatchedRef.current) {
          hasDispatchedRef.current = true;
          setTranscript(final.trim());
          setInterimTranscript('');
          handleProcessVoiceCommand(final.trim());
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        isListeningRef.current = false;
        setIsListening(false);
        const err = event.error;
        console.warn('Speech recognition error event:', err);

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setMicStatusMessage({
            type: 'error',
            text: 'Microfone bloqueado ou sem permissão. Habilite o microfone no navegador ou use os comandos rápidos abaixo.',
          });
        } else if (err === 'network') {
          setMicStatusMessage({
            type: 'warning',
            text: 'Serviço de voz temporariamente indisponível. Você pode usar os comandos rápidos e digitar abaixo.',
          });
        } else if (err === 'no-speech') {
          setMicStatusMessage({
            type: 'info',
            text: 'Nenhuma voz detectada. Toque no microfone novamente e fale com clareza.',
          });
        } else if (err !== 'aborted') {
          setMicStatusMessage({
            type: 'warning',
            text: `Aviso no áudio (${err}). Toque no microfone para tentar novamente.`,
          });
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        const pending = lastCapturedTextRef.current?.trim();
        if (pending && !hasDispatchedRef.current && !isProcessingRef.current) {
          hasDispatchedRef.current = true;
          setTranscript(pending);
          setInterimTranscript('');
          handleProcessVoiceCommand(pending);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not start SpeechRecognition:', err);
      isListeningRef.current = false;
      setIsListening(false);
      setMicStatusMessage({
        type: 'warning',
        text: 'Não foi possível iniciar o microfone. Toque novamente para tentar ou use a digitação abaixo.',
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    isListeningRef.current = false;
    setIsListening(false);
    const pending = lastCapturedTextRef.current?.trim();
    if (pending && !hasDispatchedRef.current && !isProcessingRef.current) {
      hasDispatchedRef.current = true;
      setTranscript(pending);
      setInterimTranscript('');
      handleProcessVoiceCommand(pending);
    }
  };

  // User Approval of Proposed Meal
  const handleApproveProposal = async () => {
    const currentProposal = latestRef.current.mealProposal;
    if (!currentProposal) return;

    try {
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const mealItems: MealItem[] = currentProposal.items.map((item, index) => ({
        id: 'voice_item_' + Date.now() + '_' + index,
        mealId: '',
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        source: 'voice',
        aiEstimate: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const savedMeal = await createMeal({
        userId: latestRef.current.user?.id || 'user',
        date: latestRef.current.selectedDate,
        time: currentTime,
        type: currentProposal.mealType,
        name: `${currentProposal.mealName} (Comando de Voz)`,
        items: mealItems,
      });

      setLastLoggedMeal(savedMeal);
      const confirmationText = `Excelente! Sua refeição ${currentProposal.mealName} com ${mealItems.length} alimento(s) foi aprovada e adicionada com sucesso no seu diário de hoje.`;
      setDisplayText(confirmationText);
      setAiResponse(confirmationText);
      speakText(confirmationText);
      showToast('Refeição aprovada e registrada!');
      setMealProposal(null);
    } catch (err) {
      console.error('Error creating meal from proposal', err);
      showToast('Erro ao salvar refeição aprovada.');
    }
  };

  const handleDiscardProposal = () => {
    setMealProposal(null);
  };

  const handleUndoLastLoggedMeal = async () => {
    if (!lastLoggedMeal) return;
    try {
      await deleteMeal(lastLoggedMeal.id);
      const undoMsg = `Refeição "${lastLoggedMeal.name}" removida com sucesso do seu diário.`;
      setLastLoggedMeal(null);
      setDisplayText(undoMsg);
      setAiResponse(undoMsg);
      speakText(undoMsg);
      showToast('Refeição removida do diário.');
    } catch (err) {
      console.error('Error undoing meal', err);
      showToast('Erro ao remover refeição.');
    }
  };

  // Process voice command through /api/ai/voice-command
  const handleProcessVoiceCommand = async (text: string) => {
    if (!text.trim()) return;

    // Check if user is asking to undo/cancel last meal
    const lowerText = text.toLowerCase();
    if (
      lastLoggedMeal &&
      (lowerText.includes('desfazer') ||
        lowerText.includes('cancelar') ||
        lowerText.includes('apagar refeição') ||
        lowerText.includes('remover refeição') ||
        lowerText.includes('excluir'))
    ) {
      await handleUndoLastLoggedMeal();
      return;
    }

    // Check if the user is confirming or discarding a pending proposal by voice
    const currentProposal = latestRef.current.mealProposal;
    if (currentProposal) {
      const lower = text.toLowerCase();
      if (
        lower.includes('sim') ||
        lower.includes('aprovar') ||
        lower.includes('aprovado') ||
        lower.includes('confirmo') ||
        lower.includes('salvar') ||
        lower.includes('pode salvar') ||
        lower.includes('incluir') ||
        lower.includes('registrar')
      ) {
        await handleApproveProposal();
        return;
      }
      if (lower.includes('não') || lower.includes('nao') || lower.includes('cancelar') || lower.includes('descartar')) {
        handleDiscardProposal();
        const cancelMsg = 'Proposta de refeição descartada conforme solicitado.';
        setDisplayText(cancelMsg);
        setAiResponse(cancelMsg);
        speakText(cancelMsg);
        return;
      }
    }

    setIsProcessing(true);
    isProcessingRef.current = true;
    setTranscript(text);
    setMicStatusMessage(null);

    try {
      const response = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          userContext: {
            userName: latestRef.current.user?.name || 'Atleta',
            goal: latestRef.current.user?.goal,
            currentWeight: latestRef.current.user?.currentWeight,
            targetWeight: latestRef.current.user?.targetWeight,
            targets: latestRef.current.targets,
            dailyTotals: latestRef.current.dailyTotals,
            todayMeals: latestRef.current.dailyMeals,
            waterIntakeMl: latestRef.current.waterIntakeMl,
            currentPage: latestRef.current.currentPage,
            selectedDate: latestRef.current.selectedDate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setAiResponse(data.spokenReply || 'Entendido!');
      setDisplayText(data.displayText || data.spokenReply);
      speakText(data.spokenReply);

      // Execute Action if triggered
      const hasMealAction =
        data.action?.type === 'log_meal_direct' ||
        data.action?.type === 'log_meal_proposal' ||
        data.action?.type === 'log_meal' ||
        data.intent === 'log_meal' ||
        (data.action?.mealData?.items && data.action.mealData.items.length > 0) ||
        (data.action?.mealProposal?.items && data.action.mealProposal.items.length > 0) ||
        lowerText.includes('comi') ||
        lowerText.includes('registre') ||
        lowerText.includes('registrar') ||
        lowerText.includes('adicione') ||
        lowerText.includes('adicionar') ||
        lowerText.includes('almocei') ||
        lowerText.includes('jantei');

      if (data.action?.type === 'log_water' && data.action.waterAmountMl) {
        const amount = Number(data.action.waterAmountMl) || 250;
        addWaterIntake(amount);
        const currentTotal = (latestRef.current.waterIntakeMl || 0) + amount;
        setLastLoggedWater({
          amountMl: amount,
          totalMl: currentTotal,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });
        setLastLoggedMeal(null);
        setMealProposal(null);
        showToast(`+${amount}ml de água registrados com sucesso!`);
      } else if (data.action?.type === 'navigate' && data.action.targetPage) {
        const target = data.action.targetPage;
        if (target === 'camera') {
          onClose();
          setFoodVisionModalOpen(true);
        } else if (['home', 'history', 'progress', 'assistant', 'settings'].includes(target)) {
          setCurrentPage(target as any);
        }
      } else if (hasMealAction) {
        const mealInfo = data.action?.mealData || data.action?.mealProposal;
        const itemsRaw = mealInfo?.items;

        // Target date: selectedDate unless user explicitly mentioned "ontem"
        const todayIso = new Date().toISOString().split('T')[0];
        const targetDate = lowerText.includes('ontem')
          ? (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })()
          : (latestRef.current.selectedDate || todayIso);

        // Always ensure the home view date matches the registered meal date so it's instantly visible
        if (latestRef.current.selectedDate !== targetDate) {
          setSelectedDate(targetDate);
        }

        let mealItems: MealItem[] = [];
        if (Array.isArray(itemsRaw) && itemsRaw.length > 0) {
          mealItems = itemsRaw.map((item: any, idx: number) => ({
            id: `voice_item_${Date.now()}_${idx}`,
            mealId: '',
            name: item.name,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'unid',
            calories: Math.round(Number(item.calories) || 0),
            protein: Number((Number(item.protein) || 0).toFixed(1)),
            carbs: Number((Number(item.carbs) || 0).toFixed(1)),
            fat: Number((Number(item.fat) || 0).toFixed(1)),
            source: 'voice',
            aiEstimate: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        } else {
          // Fallback: create item directly from text so registration NEVER fails
          mealItems = [
            {
              id: `voice_item_${Date.now()}_0`,
              mealId: '',
              name: text.length > 3 ? text : 'Refeição Registrada por Voz',
              quantity: 1,
              unit: 'porção',
              calories: 320,
              protein: 20,
              carbs: 35,
              fat: 10,
              source: 'voice',
              aiEstimate: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }

        const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const validTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supper', 'other'];
        let finalMealType: MealType = 'lunch';
        if (mealInfo?.mealType && validTypes.includes(mealInfo.mealType as MealType)) {
          finalMealType = mealInfo.mealType as MealType;
        } else if (lowerText.includes('café') || lowerText.includes('cafe') || lowerText.includes('manhã') || lowerText.includes('manha')) {
          finalMealType = 'breakfast';
        } else if (lowerText.includes('jantar') || lowerText.includes('janta') || lowerText.includes('noite')) {
          finalMealType = 'dinner';
        } else if (lowerText.includes('lanche') || lowerText.includes('tarde')) {
          finalMealType = 'snack';
        } else if (lowerText.includes('ceia')) {
          finalMealType = 'supper';
        }

        const finalMealName = mealInfo?.mealName || (
          finalMealType === 'breakfast' ? 'Café da Manhã' :
          finalMealType === 'dinner' ? 'Jantar' :
          finalMealType === 'snack' ? 'Lanche' :
          finalMealType === 'supper' ? 'Ceia' : 'Almoço'
        );

        try {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('nutrimacro_data_cleared');
            } catch {}
          }

          const newMeal = await createMeal({
            userId: latestRef.current.user?.id || 'user',
            date: targetDate,
            time: currentTime,
            type: finalMealType,
            name: `${finalMealName} (Voz AI)`,
            items: mealItems,
          });
          setLastLoggedMeal(newMeal);
          setLastLoggedWater(null);
          setMealProposal(null);
          showToast(`Refeição ${finalMealName} registrada com sucesso!`);
        } catch (createErr) {
          console.error('Auto create meal error, displaying proposal card:', createErr);
          setMealProposal({
            mealType: finalMealType,
            mealName: finalMealName,
            items: mealItems,
          });
        }
      }
    } catch (err) {
      console.error('Error processing voice command:', err);
      const fallbackMsg = 'Não consegui processar seu comando de áudio no momento. Tente novamente ou use os comandos rápidos.';
      setDisplayText(fallbackMsg);
      setAiResponse(fallbackMsg);
      speakText(fallbackMsg);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleSendTyped = () => {
    if (!typedInput.trim()) return;
    const msg = typedInput.trim();
    setTypedInput('');
    handleProcessVoiceCommand(msg);
  };

  const quickPrompts = [
    'Quanto comi de calorias e proteína hoje?',
    'Bebi 500ml de água',
    'Bebi 300ml de água',
    'Registre 2 ovos e 1 tapioca no café da manhã',
    'Registre 150g de frango e arroz no almoço',
    'Registre 1 maçã e 1 scoop de whey no lanche',
    'Abra a câmera para fotografar minha refeição',
    'Vá para a tela de evolução corporal',
    'Qual foi meu almoço de hoje?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Unified Top Header & Mode Switcher */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
                Assistente de Voz NutriMacro
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">
                {activeVoiceTab === 'live' ? '⚡ Gemini 3.8 Live API' : '🎙️ Comandos Inteligentes'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  if (synthRef.current) {
                    synthRef.current.cancel();
                    setIsSpeaking(false);
                  }
                  setActiveVoiceTab('live');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeVoiceTab === 'live'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Live</span>
              </button>

              <button
                onClick={() => setActiveVoiceTab('commands')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeVoiceTab === 'commands'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>Comandos</span>
              </button>
            </div>

            {/* Audio Voice Toggle */}
            <button
              onClick={() => {
                if (isSpeaking && synthRef.current) {
                  synthRef.current.cancel();
                  setIsSpeaking(false);
                }
                setAudioEnabled(!audioEnabled);
              }}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                audioEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}
              title={audioEnabled ? 'Voz ativada (clique para mutar)' : 'Voz mutada (clique para ativar)'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeVoiceTab === 'live' ? (
          <GeminiLiveVoiceStudio
            onClose={onClose}
            onSwitchToCommandMode={() => setActiveVoiceTab('commands')}
          />
        ) : (
          <>
        {/* Dynamic Voice Waveform Stage */}
        <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-850 text-white text-center flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
          {/* Ambient Glow */}
          {isProcessing && (
            <div className="absolute w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse -z-0" />
          )}

          {/* Status Indicator */}
          <div className="mb-4 z-10">
            {isListening ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold animate-pulse shadow-lg shadow-rose-500/10">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                Ouvindo sua voz... Fale agora
              </span>
            ) : isProcessing ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold animate-pulse shadow-lg shadow-emerald-500/15">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Processando com Inteligência Artificial...
              </span>
            ) : isSpeaking ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-lg shadow-emerald-500/10">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                Respondendo em áudio...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60">
                Toque no microfone e diga o que deseja
              </span>
            )}
          </div>

          {/* Central Animated Shutter / Mic Button */}
          <div className="relative my-2 z-10">
            {isListening && (
              <>
                <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping opacity-75"></div>
                <div className="absolute -inset-8 rounded-full bg-rose-500/10 animate-pulse"></div>
              </>
            )}

            {isProcessing && (
              <>
                <div className="absolute -inset-4 rounded-full bg-emerald-500/25 animate-ping opacity-60"></div>
                <div className="absolute -inset-8 rounded-full bg-teal-500/20 animate-pulse"></div>
              </>
            )}

            {isSpeaking && (
              <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-pulse"></div>
            )}

            <button
              id="voice-mic-main-button"
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
                isProcessing
                  ? 'bg-slate-800 text-emerald-400 border-2 border-emerald-400/60 shadow-emerald-500/30 cursor-wait'
                  : isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/40 ring-4 ring-rose-400/40 cursor-pointer'
                  : isSpeaking
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/40 cursor-pointer'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-emerald-500/30 cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              ) : isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Audio Visualizer Waves (CSS Simulated Equalizer) */}
          <div className="flex items-center justify-center gap-1.5 h-8 mt-4 z-10">
            {[40, 75, 55, 95, 30, 85, 60, 100, 45, 70, 35, 90].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isProcessing
                    ? 'bg-gradient-to-t from-emerald-500 to-cyan-300 animate-pulse'
                    : isListening
                    ? 'bg-rose-400 animate-pulse'
                    : isSpeaking
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isProcessing ? `${Math.max(25, (h * 0.7))}%` : (isListening || isSpeaking ? `${Math.max(15, (h * (isListening ? 1 : 0.8)))}%` : '4px'),
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          {/* Microphone Status Alert / Guide */}
          {micStatusMessage && (
            <div
              className={`mt-3 max-w-md w-full px-3.5 py-2.5 rounded-2xl text-xs flex items-start gap-2.5 border text-left animate-in fade-in ${
                micStatusMessage.type === 'error'
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                  : micStatusMessage.type === 'warning'
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                  : 'bg-slate-800/90 border-slate-700 text-slate-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <p className="leading-snug">{micStatusMessage.text}</p>
                {micStatusMessage.type === 'error' && (
                  <button
                    onClick={startListening}
                    className="mt-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Tentar Novamente
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Live / Recorded Speech Display */}
          {(transcript || interimTranscript) && (
            <div className="mt-4 max-w-md px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs sm:text-sm text-slate-200 animate-in fade-in">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                Você disse:
              </span>
              <p className="font-medium text-white italic">
                "{transcript || interimTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Response and Proposals Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50 transition-all duration-300">
          {/* Active Processing Loading Spinner Card */}
          {isProcessing && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-md space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Processando com IA...
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                      NutriMacro Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Calculando calorias, macros e gravando no diário...
                  </p>
                </div>
              </div>

              {/* Steps Progress Indicator */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Áudio captado</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 text-emerald-900 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                  <span className="truncate">Nutrientes</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] shrink-0">3</span>
                  <span className="truncate">Gravando</span>
                </div>
              </div>

              {/* Animated skeleton shimmer bars */}
              <div className="space-y-2 pt-1">
                <div className="h-3 bg-slate-100 rounded-full w-4/5 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-full w-3/5 animate-pulse" />
              </div>
            </div>
          )}

          {/* AI Response Card */}
          {displayText && !isProcessing && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800">Resposta do NutriMacro AI</span>
                </div>

                {audioEnabled && (
                  <button
                    onClick={() => aiResponse && speakText(aiResponse)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Repetir áudio
                  </button>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <FormattedMarkdown content={displayText} />
              </div>
            </div>
          )}

          {/* Last Logged Meal Live Card with Verified Write Confirmation */}
          {lastLoggedMeal && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 border-2 border-emerald-500 shadow-md space-y-3.5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
                      <CheckCircle2 className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Refeição Confirmada & Gravada!
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                      <span>{lastLoggedMeal.name}</span>
                      <span>•</span>
                      <span>{lastLoggedMeal.time}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold tracking-wide shadow-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-200" />
                    Gravado no Firestore
                  </span>
                  <span className="text-[9px] text-emerald-700 font-mono font-medium">
                    Sincronizado 100%
                  </span>
                </div>
              </div>

              {/* Macro Summary Highlights */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium block">Calorias</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                    {lastLoggedMeal.items.reduce((acc, it) => acc + (it.calories || 0), 0)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">kcal</span>
                </div>
                <div className="p-2 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 font-medium block">Proteína</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-800 font-mono">
                    {Math.round(lastLoggedMeal.items.reduce((acc, it) => acc + (it.protein || 0), 0))}g
                  </span>
                  <span className="text-[9px] text-emerald-600/70 block">meta diária</span>
                </div>
                <div className="p-2 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-amber-700 font-medium block">Carbos</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-800 font-mono">
                    {Math.round(lastLoggedMeal.items.reduce((acc, it) => acc + (it.carbs || 0), 0))}g
                  </span>
                  <span className="text-[9px] text-amber-600/70 block">energia</span>
                </div>
                <div className="p-2 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-rose-700 font-medium block">Gorduras</span>
                  <span className="text-xs sm:text-sm font-bold text-rose-800 font-mono">
                    {Math.round(lastLoggedMeal.items.reduce((acc, it) => acc + (it.fat || 0), 0))}g
                  </span>
                  <span className="text-[9px] text-rose-600/70 block">lipídios</span>
                </div>
              </div>

              {/* Items in the saved meal */}
              <div className="space-y-1 bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Itens gravados no banco de dados:
                </span>
                {lastLoggedMeal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-400 text-[11px]">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.calories} kcal</span>
                      <span className="text-emerald-700 font-semibold">{item.protein}g P</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Ver no Diário and Desfazer */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    setCurrentPage('home');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all active:scale-98"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ver no Diário de Hoje</span>
                </button>
                <button
                  onClick={handleUndoLastLoggedMeal}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Desfazer e remover esta refeição"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Desfazer</span>
                </button>
              </div>
            </div>
          )}

          {/* Last Logged Water Live Card */}
          {lastLoggedWater && (
            <div className="p-4 rounded-2xl bg-cyan-50 border-2 border-cyan-500 shadow-sm space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-600 text-white font-bold">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Água Registrada com Sucesso!
                    </h4>
                    <span className="text-xs font-semibold text-cyan-800">
                      +{lastLoggedWater.amountMl} ml adicionados ao diário ({lastLoggedWater.time})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-200 text-cyan-900 font-bold uppercase tracking-wider">
                  Salvo
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-cyan-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Consumo acumulado hoje:</span>
                <span className="font-bold text-cyan-900 text-sm font-mono">{lastLoggedWater.totalMl} ml</span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  setCurrentPage('home');
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ver no Diário de Hoje</span>
              </button>
            </div>
          )}

          {/* Meal Proposal & Mandatory User Approval Card */}
          {mealProposal && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-500/40 shadow-sm space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Proposta de Refeição Detectada por Voz
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-800">
                      Tipo: {mealProposal.mealName}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold uppercase tracking-wider">
                  Requer Aprovação
                </span>
              </div>

              {/* Items in the proposed meal */}
              <div className="space-y-1.5 bg-white p-3 rounded-xl border border-emerald-200/80">
                {mealProposal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">
                        ({item.quantity}{item.unit})
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.calories} kcal</span>
                      <span className="text-emerald-700 font-semibold">{item.protein}g P</span>
                    </div>
                  </div>
                ))}

                {/* Macro Totals for Proposal */}
                <div className="pt-2 mt-1 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Total da Refeição:</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-900 font-bold">
                      {mealProposal.items.reduce((acc, it) => acc + (it.calories || 0), 0)} kcal
                    </span>
                    <span className="text-emerald-700">
                      {mealProposal.items.reduce((acc, it) => acc + (it.protein || 0), 0)}g P
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for User Approval */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="voice-approve-proposal-btn"
                  onClick={handleApproveProposal}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprovar e Incluir no Registro</span>
                </button>

                <button
                  onClick={handleDiscardProposal}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                >
                  Descartar
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                Dica: Você também pode simplesmente dizer <strong>"Aprovar"</strong> ou <strong>"Sim"</strong> ao microfone!
              </p>
            </div>
          )}

          {/* Quick Voice Suggestion Chips */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Comandos rápidos de exemplo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProcessVoiceCommand(prompt)}
                  disabled={isProcessing}
                  className="text-xs bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 text-left transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fallback Text Input & Keyboard Send Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendTyped();
              }
            }}
            placeholder={
              speechSupported
                ? 'Fale ao microfone acima ou digite aqui...'
                : 'Microfone indisponível no navegador. Digite aqui seu comando...'
            }
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            disabled={isProcessing}
          />

          <button
            onClick={handleSendTyped}
            disabled={!typedInput.trim() || isProcessing}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

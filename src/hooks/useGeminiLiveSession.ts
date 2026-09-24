import { useState, useEffect, useRef, useCallback } from 'react';
import {
  float32ToPcm16Base64,
  pcm16Base64ToFloat32,
  downsampleBuffer,
  calculateRmsVolume,
} from '../utils/liveAudioUtils';

export type LiveSessionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error';

export interface LiveVoiceChoice {
  id: 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir';
  name: string;
  gender: string;
  description: string;
}

export const LIVE_VOICES: LiveVoiceChoice[] = [
  { id: 'Zephyr', name: 'Zephyr (Feminina Suave)', gender: 'Feminina', description: 'Empatica, calma e instrutiva' },
  { id: 'Puck', name: 'Puck (Masculina Energica)', gender: 'Masculina', description: 'Dinamico, direto e motivador' },
  { id: 'Kore', name: 'Kore (Feminina Clara)', gender: 'Feminina', description: 'Profissional, focada e estruturada' },
  { id: 'Fenrir', name: 'Fenrir (Masculina Firme)', gender: 'Masculina', description: 'Firme, objetivo e atletico' },
];

export interface UseGeminiLiveOptions {
  userContext?: any;
  defaultVoice?: 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir';
  onTurnComplete?: () => void;
  onError?: (err: string) => void;
  onToolCall?: (functionCall: { name: string; args: any; id?: string }) => Promise<any> | void;
}

// VAD threshold - skip silence below this RMS to avoid loop/flooding
const VAD_SILENCE_THRESHOLD = 0.003;
// ScriptProcessor buffer size - 4096 samples @ 16kHz = ~256ms
const SCRIPT_PROCESSOR_BUFFER = 4096;
// Min ms between audio sends - rate limit to avoid flooding
const MAX_AUDIO_SEND_MS = 100;

export function useGeminiLiveSession(options: UseGeminiLiveOptions = {}) {
  const [status, setStatus] = useState<LiveSessionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<'Zephyr' | 'Puck' | 'Kore' | 'Fenrir'>(
    options.defaultVoice || 'Zephyr'
  );
  const [userVolume, setUserVolume] = useState<number>(0);
  const [geminiVolume, setGeminiVolume] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [conversationLogs, setConversationLogs] = useState<Array<{ sender: 'user' | 'gemini'; text: string; time: string }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const lastSendTimeRef = useRef<number>(0);
  const turnBufferRef = useRef<string>('');

  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); src.disconnect(); } catch (_) {}
    });
    activeSourcesRef.current = [];
    isSpeakingRef.current = false;
    setGeminiVolume(0);
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  const teardownAudio = useCallback(() => {
    stopAllPlayback();
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (_) {}
      processorRef.current = null;
    }
    if (micSourceRef.current) {
      try { micSourceRef.current.disconnect(); } catch (_) {}
      micSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try { inputAudioCtxRef.current.close(); } catch (_) {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try { outputAudioCtxRef.current.close(); } catch (_) {}
      outputAudioCtxRef.current = null;
    }
    setUserVolume(0);
    setGeminiVolume(0);
  }, [stopAllPlayback]);

  const playAudioChunk = useCallback((base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
        nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
      }
      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const float32Data = pcm16Base64ToFloat32(base64Audio);
      if (!float32Data || float32Data.length === 0) return;

      const vol = calculateRmsVolume(float32Data);
      setGeminiVolume(vol);

      const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;

      activeSourcesRef.current.push(source);
      isSpeakingRef.current = true;
      setStatus('speaking');

      source.onended = () => {
        const idx = activeSourcesRef.current.indexOf(source);
        if (idx !== -1) activeSourcesRef.current.splice(idx, 1);
        if (activeSourcesRef.current.length === 0) {
          isSpeakingRef.current = false;
          setGeminiVolume(0);
          setStatus((prev) => (prev === 'speaking' ? 'listening' : prev));
        }
      };
    } catch (err) {
      console.warn('[useGeminiLive] Error playing audio chunk:', err);
    }
  }, []);

  const startSession = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) return;

    setErrorMessage(null);
    setLiveTranscript('');
    turnBufferRef.current = '';
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === 'suspended') await inputCtx.resume();

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      console.log('[useGeminiLive] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let connTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        console.warn('[useGeminiLive] Timed out (15s)');
        setErrorMessage('Tempo limite esgotado. Verifique a conexao e tente novamente ou use Comandos de Voz.');
        setStatus('error');
        try { ws.close(); } catch (_) {}
      }, 15000);

      const clearConn = () => { if (connTimeout) { clearTimeout(connTimeout); connTimeout = null; } };

      ws.onopen = () => {
        console.log('[useGeminiLive] WS open - sending init');
        ws.send(JSON.stringify({ type: 'init', voice: selectedVoice, userContext: options.userContext }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          switch (msg.type) {
            case 'ready':
              clearConn();
              setStatus('listening');
              break;
            case 'audio':
              if (msg.audio) playAudioChunk(msg.audio);
              break;
            case 'text':
              if (msg.text) {
                turnBufferRef.current += msg.text;
                setLiveTranscript(turnBufferRef.current);
              }
              break;
            case 'interrupted':
              stopAllPlayback();
              setStatus('interrupted');
              setTimeout(() => setStatus('listening'), 400);
              break;
            case 'turnComplete': {
              options.onTurnComplete?.();
              const done = turnBufferRef.current.trim();
              turnBufferRef.current = '';
              setLiveTranscript('');
              if (done) {
                setConversationLogs((logs) => [
                  ...logs,
                  { sender: 'gemini', text: done, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
                ]);
              }
              setStatus((prev) => (prev === 'speaking' ? 'speaking' : 'listening'));
              break;
            }
            case 'toolCall':
              if (Array.isArray(msg.functionCalls)) {
                for (const fc of msg.functionCalls) {
                  options.onToolCall?.(fc);
                }
              }
              break;
            case 'session_closed':
              setStatus('disconnected');
              break;
            case 'error':
              clearConn();
              setErrorMessage(msg.error || 'Erro na sessao Live. Tente novamente.');
              setStatus('error');
              options.onError?.(msg.error);
              break;
            default:
              break;
          }
        } catch (e) {
          console.warn('[useGeminiLive] Parse error:', e);
        }
      };

      ws.onerror = () => {
        clearConn();
        setErrorMessage('Falha na conexao com o servidor de voz.');
        setStatus('error');
      };

      ws.onclose = (e) => {
        clearConn();
        setStatus((prev) => (prev === 'error' ? prev : 'disconnected'));
      };

      const micSource = inputCtx.createMediaStreamSource(stream);
      micSourceRef.current = micSource;
      const processor = inputCtx.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const buf = e.inputBuffer.getChannelData(0);
        const vol = calculateRmsVolume(buf);
        setUserVolume(vol);

        // VAD - skip silence
        if (vol < VAD_SILENCE_THRESHOLD) return;

        // Rate limit
        const now = Date.now();
        if (now - lastSendTimeRef.current < MAX_AUDIO_SEND_MS) return;
        lastSendTimeRef.current = now;

        let pcmData: Float32Array = buf;
        if (inputCtx.sampleRate !== 16000) {
          pcmData = downsampleBuffer(buf, inputCtx.sampleRate, 16000);
        }
        try {
          ws.send(JSON.stringify({ type: 'audio', audio: float32ToPcm16Base64(pcmData), mimeType: 'audio/pcm;rate=16000' }));
        } catch (_) {}
      };

      micSource.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (err: any) {
      teardownAudio();
      setStatus('error');
      const msg =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Permissao de microfone negada. Autorize o microfone nas configuracoes do navegador.'
          : err?.name === 'NotFoundError'
          ? 'Microfone nao encontrado. Conecte um microfone e tente novamente.'
          : err?.message || 'Erro ao inicializar sessao de voz.';
      setErrorMessage(msg);
      options.onError?.(msg);
    }
  }, [options, playAudioChunk, selectedVoice, stopAllPlayback, teardownAudio]);

  const endSession = useCallback(() => {
    teardownAudio();
    if (wsRef.current) {
      try { wsRef.current.close(1000, 'user_ended'); } catch (_) {}
      wsRef.current = null;
    }
    setStatus('disconnected');
    setLiveTranscript('');
    turnBufferRef.current = '';
  }, [teardownAudio]);

  const sendTextMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try {
      wsRef.current.send(JSON.stringify({ type: 'text', text: trimmed }));
    } catch (_) { return; }
    setConversationLogs((logs) => [
      ...logs,
      { sender: 'user', text: trimmed, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
    ]);
  }, []);

  useEffect(() => {
    return () => { endSession(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, errorMessage, selectedVoice, setSelectedVoice, userVolume, geminiVolume, liveTranscript, conversationLogs, startSession, endSession, sendTextMessage, stopAllPlayback };
}

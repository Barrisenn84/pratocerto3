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
  { id: 'Zephyr', name: 'Zephyr (Feminina Suave)', gender: 'Feminina', description: 'Empática, calma e instrutiva' },
  { id: 'Puck', name: 'Puck (Masculina Enérgica)', gender: 'Masculina', description: 'Dinâmico, direto e motivador' },
  { id: 'Kore', name: 'Kore (Feminina Clara)', gender: 'Feminina', description: 'Profissional, focada e estruturada' },
  { id: 'Fenrir', name: 'Fenrir (Masculina Firme)', gender: 'Masculina', description: 'Firme, objetivo e atlético' },
];

export interface UseGeminiLiveOptions {
  userContext?: any;
  defaultVoice?: 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir';
  onTurnComplete?: () => void;
  onError?: (err: string) => void;
  onToolCall?: (functionCall: { name: string; args: any; id?: string }) => Promise<any> | void;
}

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

  // Audio & WS Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // Stop all current and scheduled audio chunks (for interruptions)
  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    isSpeakingRef.current = false;
    setGeminiVolume(0);
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  // Play incoming 24kHz PCM chunk
  const playAudioChunk = useCallback((base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const float32Data = pcm16Base64ToFloat32(base64Audio);
      if (float32Data.length === 0) return;

      // Calculate audio level for visualizer
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
        if (idx !== -1) {
          activeSourcesRef.current.splice(idx, 1);
        }
        if (activeSourcesRef.current.length === 0) {
          isSpeakingRef.current = false;
          setGeminiVolume(0);
          setStatus((prev) => (prev === 'speaking' ? 'listening' : prev));
        }
      };
    } catch (err) {
      console.warn('Error playing audio chunk:', err);
    }
  }, []);

  // Connect to Gemini 3.8 Live API via WebSocket
  const startSession = useCallback(async () => {
    setErrorMessage(null);
    setStatus('connecting');

    try {
      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Set up Input AudioContext (16kHz for mic capture)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      // 3. Set up Output AudioContext (24kHz for Gemini audio playback)
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      // 4. Establish WebSocket connection to backend
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let connTimeout: any = setTimeout(() => {
        console.warn('[useGeminiLive] Connection timed out (10s)');
        setErrorMessage('Tempo limite de conexão esgotado com o servidor de voz. Você pode alternar para a aba "Comandos" no topo para falar com o Gemini com resposta imediata!');
        setStatus('error');
        try {
          ws.close();
        } catch {}
      }, 10000);

      ws.onopen = () => {
        console.log('[useGeminiLive] WS connected. Sending init...');
        ws.send(
          JSON.stringify({
            type: 'init',
            voice: selectedVoice,
            userContext: options.userContext,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            clearTimeout(connTimeout);
            setStatus('listening');
          } else if (msg.type === 'toolCall' && Array.isArray(msg.functionCalls)) {
            // Execute real database tool calls on the client
            for (const fc of msg.functionCalls) {
              console.log('[useGeminiLiveSession] Executing tool call:', fc.name, fc.args);
              options.onToolCall?.(fc);
            }
          } else if (msg.type === 'audio' && msg.audio) {
            playAudioChunk(msg.audio);
          } else if (msg.type === 'text' && msg.text) {
            setLiveTranscript((prev) => prev + msg.text);
          } else if (msg.type === 'interrupted') {
            stopAllPlayback();
            setStatus('interrupted');
            setTimeout(() => setStatus('listening'), 300);
          } else if (msg.type === 'turnComplete') {
            options.onTurnComplete?.();
            setLiveTranscript((prev) => {
              if (prev.trim()) {
                setConversationLogs((logs) => [
                  ...logs,
                  {
                    sender: 'gemini',
                    text: prev.trim(),
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }
              return '';
            });
            setStatus('listening');
          } else if (msg.type === 'error') {
            clearTimeout(connTimeout);
            console.error('[Gemini Live WS Server Error]:', msg.error);
            setErrorMessage(msg.error || 'Erro na sessão Live');
            setStatus('error');
            options.onError?.(msg.error);
          }
        } catch (e) {
          console.warn('Error parsing incoming WS message:', e);
        }
      };

      ws.onerror = (e) => {
        clearTimeout(connTimeout);
        console.warn('[Gemini Live WS Error]:', e);
        setErrorMessage('Falha na conexão em tempo real com o servidor.');
        setStatus('error');
      };

      ws.onclose = () => {
        clearTimeout(connTimeout);
        setStatus('disconnected');
      };

      // 5. Connect Microphone Processor to stream audio chunks
      const micSource = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const inputBuffer = e.inputBuffer.getChannelData(0);
        const vol = calculateRmsVolume(inputBuffer);
        setUserVolume(vol);

        // Downsample or convert to 16kHz PCM
        let pcmData: Float32Array = inputBuffer;
        if (inputCtx.sampleRate !== 16000) {
          pcmData = downsampleBuffer(inputBuffer, inputCtx.sampleRate, 16000);
        }

        const base64Audio = float32ToPcm16Base64(pcmData);
        ws.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          })
        );
      };

      micSource.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('Failed to start Gemini Live session:', err);
      setStatus('error');
      const msg =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Permissão de microfone negada. Autorize o microfone para conversar em tempo real.'
          : err?.message || 'Erro ao inicializar chamada de voz.';
      setErrorMessage(msg);
      options.onError?.(msg);
    }
  }, [options, playAudioChunk, selectedVoice, stopAllPlayback]);

  // End the live session cleanly
  const endSession = useCallback(() => {
    stopAllPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setUserVolume(0);
    setGeminiVolume(0);
    setStatus('disconnected');
  }, [stopAllPlayback]);

  // Send typed text prompt into the live conversation
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'text',
        text: text.trim(),
      })
    );
    setConversationLogs((logs) => [
      ...logs,
      {
        sender: 'user',
        text: text.trim(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
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
  };
}

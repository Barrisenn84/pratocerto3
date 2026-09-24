import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  Trash2,
  Plus,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  Sliders,
  Smartphone,
  SwitchCamera,
  Circle,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MealType, AIAnalysisResult, AIEstimateItem } from '../../types';
import { SAMPLE_AI_FOOD_IMAGES } from '../../mock/data/seed';

interface FoodVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
}

type VisionStep = 'select' | 'camera_live' | 'analyzing' | 'review';

export const FoodVisionModal: React.FC<FoodVisionModalProps> = ({
  isOpen,
  onClose,
  defaultMealType = 'lunch',
}) => {
  const { foodVisionService, applyAIFoodAnalysisToMeal, showToast } = useApp();

  const [step, setStep] = useState<VisionStep>('select');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [targetMealType, setTargetMealType] = useState<MealType>(defaultMealType);

  // Live Camera state
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Analysis progress animation states
  const [progressStage, setProgressStage] = useState<string>('Iniciando análise com IA...');
  const [progressPercent, setProgressPercent] = useState<number>(10);

  // Review step state
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [reviewedItems, setReviewedItems] = useState<AIEstimateItem[]>([]);

  // Item inline edit id
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Stop camera stream on unmount or when leaving live camera step
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!isOpen || step !== 'camera_live') {
      stopCameraStream();
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  // Start live smartphone camera stream
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    setIsCameraStarting(true);
    stopCameraStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraFacing(facing);
      setStep('camera_live');
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Não foi possível acessar a câmera em tempo real. Use o botão de Câmera Nativa do Celular abaixo.'
      );
      setStep('select');
    } finally {
      setIsCameraStarting(false);
    }
  };

  // Flip between front and rear smartphone camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextFacing);
  };

  // Capture snapshot from live camera stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger visual flash
    setIsShutterFlashing(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }
    setTimeout(() => setIsShutterFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setSelectedImage(dataUrl);
      stopCameraStream();
      setStep('select');
      showToast('Foto do prato capturada com sucesso!');
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setSelectedImage(sampleUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          showToast('Foto selecionada com sucesso!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedImage) return;

    setStep('analyzing');
    setProgressPercent(15);
    setProgressStage('Enviando fotografia do smartphone...');

    try {
      const result = await foodVisionService.analyzeFoodImage(
        selectedImage,
        targetMealType,
        (stage, percent) => {
          setProgressStage(stage);
          setProgressPercent(percent);
        }
      );

      setAnalysisResult(result);
      setReviewedItems(result.items);
      setStep('review');
    } catch (err) {
      console.error('AI analysis error', err);
      showToast('Falha na análise visual. Tente novamente ou use o registro manual.');
      setStep('select');
    }
  };

  // Review screen modifications
  const handleUpdateItem = (id: string, updates: Partial<AIEstimateItem>) => {
    setReviewedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setReviewedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewItem = () => {
    const newItem: AIEstimateItem = {
      id: 'ai_user_add_' + Date.now(),
      name: 'Novo Alimento Adicionado',
      estimatedQuantity: 100,
      unit: 'g',
      calories: 120,
      protein: 8,
      carbs: 15,
      fat: 3,
      confidence: 'high',
      reasoning: 'Inserido manualmente pelo usuário na etapa de revisão.',
    };
    setReviewedItems([...reviewedItems, newItem]);
    setEditingItemId(newItem.id);
  };

  // Dynamic review totals
  const reviewTotals = reviewedItems.reduce(
    (acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein: Math.round((acc.protein + (Number(it.protein) || 0)) * 10) / 10,
      carbs: Math.round((acc.carbs + (Number(it.carbs) || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (Number(it.fat) || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // User Approval Action: Explicit user consent before persistence
  const handleConfirmAndAddToMeal = async () => {
    if (!analysisResult) return;

    await applyAIFoodAnalysisToMeal(
      {
        ...analysisResult,
        items: reviewedItems,
      },
      targetMealType
    );

    // Reset state and close
    setStep('select');
    setSelectedImage(null);
    onClose();
  };

  const handleResetToSelect = () => {
    stopCameraStream();
    setStep('select');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4">
      {/* Hidden canvas for capturing video frames */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {step === 'select' && 'Câmera & Análise de Refeição'}
                  {step === 'camera_live' && 'Câmera do Smartphone Ao Vivo'}
                  {step === 'analyzing' && 'Análise de Prato com IA...'}
                  {step === 'review' && 'Revisão & Aprovação do Usuário'}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 'select' && 'Fotografe seu prato com a câmera ou escolha uma imagem'}
                {step === 'camera_live' && 'Enquadre o prato no visor e aperte o botão disparador'}
                {step === 'analyzing' && 'Identificação de porções, densidade e macronutrientes'}
                {step === 'review' && 'Revise e aprove para incluir no diário alimentar'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body based on step */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Select or Photograph */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* Target Meal Type Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Incluir na refeição:</span>
                <select
                  value={targetMealType}
                  onChange={(e) => setTargetMealType(e.target.value as MealType)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800"
                >
                  <option value="breakfast">Café da Manhã</option>
                  <option value="lunch">Almoço</option>
                  <option value="snack">Lanche da Tarde</option>
                  <option value="dinner">Jantar</option>
                  <option value="supper">Ceia</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Photo Preview if already selected */}
              {selectedImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 group max-h-72 flex items-center justify-center bg-black">
                  <img
                    src={selectedImage}
                    alt="Prato selecionado"
                    referrerPolicy="no-referrer"
                    className="w-full h-72 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Tirar outra foto
                      </button>
                    </div>
                    <div className="text-white text-xs font-medium bg-black/40 backdrop-blur-xs p-2 rounded-xl inline-block">
                      ✓ Foto pronta para detalhamento inteligente com IA
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Action Cards for Camera Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Live Stream Camera inside App */}
                    <button
                      type="button"
                      onClick={() => startLiveCamera('environment')}
                      disabled={isCameraStarting}
                      className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-100/50 hover:border-emerald-600 transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          Ao Vivo
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Abrir Câmera em Tempo Real
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Enquadre o prato no visor da tela e fotografe com 1 clique
                        </p>
                      </div>
                    </button>

                    {/* Option 2: Native Smartphone Camera (triggers phone camera app directly) */}
                    <label
                      htmlFor="camera-smartphone-native-input"
                      className="p-5 rounded-2xl border-2 border-purple-500/40 bg-purple-50/50 hover:bg-purple-100/50 hover:border-purple-600 transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                          Celular
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Câmera Nativa do Celular
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Abre o app de câmera do seu smartphone (Android/iOS)
                        </p>
                      </div>
                      <input
                        id="camera-smartphone-native-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Option 3: Choose from Gallery / File Upload */}
                  <div className="flex items-center justify-center pt-1">
                    <label
                      htmlFor="gallery-file-input"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Ou escolher foto existente da galeria</span>
                      <input
                        id="gallery-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Preset Sample Photos for Demonstration */}
              {!selectedImage && (
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Ou teste agora com um prato demonstrativo:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_AI_FOOD_IMAGES.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample.url)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          selectedImage === sample.url
                            ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={sample.url}
                          alt={sample.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{sample.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{sample.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP: LIVE CAMERA VIEW */}
          {step === 'camera_live' && (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-video sm:aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-2xl">
                {/* Live video feed element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Shutter flash animation overlay */}
                {isShutterFlashing && (
                  <div className="absolute inset-0 bg-white animate-fade-out pointer-events-none z-30" />
                )}

                {/* Viewfinder Target Reticle / Corner brackets */}
                <div className="absolute inset-8 sm:inset-12 border border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm"></div>
                    <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm"></div>
                  </div>

                  <div className="text-center">
                    <span className="px-3 py-1 rounded-full bg-black/50 text-white/90 text-[11px] font-medium backdrop-blur-xs border border-white/10">
                      Posicione a refeição dentro do enquadramento
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm"></div>
                    <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-sm"></div>
                  </div>
                </div>

                {/* Top controls: switch camera & close */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                    title="Alternar câmera traseira / frontal"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setStep('select');
                    }}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                    title="Fechar câmera"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Snapshot Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center z-20">
                  <button
                    type="button"
                    id="btn-capture-camera-shutter"
                    onClick={handleCapturePhoto}
                    className="w-18 h-18 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 active:scale-90 shadow-2xl flex items-center justify-center transition-all cursor-pointer group"
                    title="Tirar foto"
                  >
                    <div className="w-13 h-13 rounded-full bg-white group-hover:scale-95 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500">
                Toque no botão central branco para fotografar e iniciar o detalhamento pela IA.
              </div>
            </div>
          )}

          {/* STEP 2: Analyzing progress */}
          {step === 'analyzing' && (
            <div className="py-12 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-100 animate-ping opacity-30"></div>
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
                  <Sparkles className="w-9 h-9 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{progressStage}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gemini identificando alimentos, gramaturas e macronutrientes...
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-xs mx-auto space-y-1.5">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400">{progressPercent}%</span>
              </div>
            </div>
          )}

          {/* STEP 3: Review Results & MANDATORY USER APPROVAL */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Mandatory User Approval Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400/80 flex items-start gap-3 text-xs text-emerald-950 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-sm text-emerald-900">
                    Etapa de Aprovação do Usuário
                  </strong>
                  <span className="text-emerald-800 text-xs leading-relaxed">
                    A IA analisou e detalhou a foto da sua refeição. Confira as porções e macronutrientes abaixo. <strong>Após sua aprovação</strong>, os alimentos serão salvos no seu registro diário.
                  </span>
                </div>
              </div>

              {/* Image with identified elements tags */}
              {selectedImage && (
                <div className="relative rounded-2xl overflow-hidden max-h-48 bg-slate-900 border border-slate-200">
                  <img
                    src={selectedImage}
                    alt="Foto analisada"
                    referrerPolicy="no-referrer"
                    className="w-full h-48 object-cover opacity-85"
                  />
                  <div className="absolute inset-0 p-3 flex flex-wrap content-end gap-1.5 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    {reviewedItems.map((item) => (
                      <span
                        key={item.id}
                        className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium border border-white/20 flex items-center gap-1"
                      >
                        <span>✓ {item.name}</span>
                        <span className="text-emerald-300 font-mono">({item.estimatedQuantity}{item.unit})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Review Totals Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold">
                    Total Detalhado pela IA
                  </span>
                  <span className="font-bold text-white text-base">{reviewTotals.calories} kcal</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400 font-semibold">{reviewTotals.protein}g Proteína</span>
                  <span className="text-blue-400 font-semibold">{reviewTotals.carbs}g Carb</span>
                  <span className="text-purple-400 font-semibold">{reviewTotals.fat}g Gord</span>
                </div>
              </div>

              {/* Identified Items List with inline editing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Alimentos Identificados e Detalhados ({reviewedItems.length})
                  </span>
                  <button
                    onClick={handleAddNewItem}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar item manual
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {reviewedItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              {item.reasoning && (
                                <p className="text-[11px] text-slate-400">{item.reasoning}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {item.confidence && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  item.confidence === 'high'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.confidence === 'medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.confidence === 'high'
                                  ? 'Alta Confiança'
                                  : item.confidence === 'medium'
                                  ? 'Média Confiança'
                                  : 'Baixa Confiança'}
                              </span>
                            )}

                            <button
                              onClick={() => setEditingItemId(isEditing ? null : item.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Ajustar porção e macros"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Remover alimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline editor toggle */}
                        {isEditing ? (
                          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl animate-in fade-in">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Qtd ({item.unit})</label>
                              <input
                                type="number"
                                value={item.estimatedQuantity}
                                onChange={(e) => {
                                  const newQty = Number(e.target.value) || 0;
                                  const ratio = item.estimatedQuantity > 0 ? newQty / item.estimatedQuantity : 1;
                                  handleUpdateItem(item.id, {
                                    estimatedQuantity: newQty,
                                    calories: Math.round(item.calories * ratio),
                                    protein: Math.round(item.protein * ratio * 10) / 10,
                                    carbs: Math.round(item.carbs * ratio * 10) / 10,
                                    fat: Math.round(item.fat * ratio * 10) / 10,
                                  });
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Kcal</label>
                              <input
                                type="number"
                                value={item.calories}
                                onChange={(e) => handleUpdateItem(item.id, { calories: Number(e.target.value) })}
                                className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Prot (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={item.protein}
                                onChange={(e) => handleUpdateItem(item.id, { protein: Number(e.target.value) })}
                                className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Carb / Gord (g)</label>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={item.carbs}
                                  onChange={(e) => handleUpdateItem(item.id, { carbs: Number(e.target.value) })}
                                  placeholder="C"
                                  className="w-1/2 px-1 py-1 rounded border border-slate-300 bg-white font-mono text-xs text-center"
                                />
                                <input
                                  type="number"
                                  step="0.1"
                                  value={item.fat}
                                  onChange={(e) => handleUpdateItem(item.id, { fat: Number(e.target.value) })}
                                  placeholder="G"
                                  className="w-1/2 px-1 py-1 rounded border border-slate-300 bg-white font-mono text-xs text-center"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg">
                            <span>{item.estimatedQuantity} {item.unit}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{item.calories} kcal</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-emerald-700">{item.protein}g P</span>
                              <span className="text-blue-700">{item.carbs}g C</span>
                              <span className="text-purple-700">{item.fat}g G</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {step === 'select' && (
            <>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-start-ai-analysis"
                type="button"
                onClick={handleStartAnalysis}
                disabled={!selectedImage}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analisar e Detalhar com IA</span>
              </button>
            </>
          )}

          {step === 'camera_live' && (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setStep('select');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Câmera ativa ({cameraFacing === 'environment' ? 'Traseira' : 'Frontal'})
              </span>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="w-full flex justify-center py-1">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                Aguarde o processamento da IA...
              </span>
            </div>
          )}

          {step === 'review' && (
            <>
              <button
                type="button"
                onClick={handleResetToSelect}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Voltar / Nova Foto
              </button>
              <button
                id="btn-confirm-ai-meal"
                type="button"
                onClick={handleConfirmAndAddToMeal}
                disabled={reviewedItems.length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>✓ Aprovar e Incluir no Registro Diário</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

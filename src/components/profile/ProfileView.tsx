import React, { useState } from 'react';
import {
  User,
  Target,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  LogOut,
  LogIn,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateRecommendedTargets } from '../../domain/nutrition/calculations';
import { UserProfile } from '../../types';
import { NotificationSettingsCard } from '../notifications/NotificationSettingsCard';

export const ProfileView: React.FC = () => {
  const {
    user,
    targets,
    isAuthenticated,
    firebaseUser,
    loginWithGoogle,
    logoutUser,
    setAuthModalOpen,
    updateUserProfile,
    updateNutritionGoals,
    clearAllUserData,
    exportUserData,
    isLoading,
  } = useApp();

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [exportRangeDays, setExportRangeDays] = useState<number>(0); // 0 = all

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Atleta');
  const [age, setAge] = useState(user?.age || 26);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'male');
  const [height, setHeight] = useState(user?.height || 175);
  const [currentWeight, setCurrentWeight] = useState(user?.currentWeight || 75.0);
  const [targetWeight, setTargetWeight] = useState(user?.targetWeight || 80.0);
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    user?.activityLevel || 'moderately_active'
  );
  const [goal, setGoal] = useState<UserProfile['goal']>(user?.goal || 'hypertrophy');

  // Goals Form State
  const [calories, setCalories] = useState(targets?.calories || 2300);
  const [protein, setProtein] = useState(targets?.protein || 150);
  const [carbs, setCarbs] = useState(targets?.carbs || 260);
  const [fat, setFat] = useState(targets?.fat || 70);
  const [waterMl, setWaterMl] = useState(targets?.waterMl || 2500);

  // Sync state if user or targets change
  React.useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.age) setAge(user.age);
      if (user.gender) setGender(user.gender);
      if (user.height) setHeight(user.height);
      if (user.currentWeight) setCurrentWeight(user.currentWeight);
      if (user.targetWeight) setTargetWeight(user.targetWeight);
      if (user.activityLevel) setActivityLevel(user.activityLevel);
      if (user.goal) setGoal(user.goal);
    }
  }, [user]);

  React.useEffect(() => {
    if (targets) {
      if (targets.calories) setCalories(targets.calories);
      if (targets.protein) setProtein(targets.protein);
      if (targets.carbs) setCarbs(targets.carbs);
      if (targets.fat) setFat(targets.fat);
      if (targets.waterMl) setWaterMl(targets.waterMl);
    }
  }, [targets]);

  // BMI Calculation
  const heightInMeters = (height || 170) / 100;
  const bmi = Math.round(((currentWeight || 70) / (heightInMeters * heightInMeters)) * 10) / 10;
  let bmiCategory = 'Normal';
  if (bmi < 18.5) bmiCategory = 'Abaixo do peso';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Sobrepeso';
  else if (bmi >= 30) bmiCategory = 'Obesidade';

  const handleCalculateAutomatic = () => {
    const tempProfile: UserProfile = {
      id: user?.id || 'user',
      name,
      email: user?.email || '',
      preferredUnit: user?.preferredUnit || 'metric',
      age: Number(age),
      gender,
      height: Number(height),
      currentWeight: Number(currentWeight),
      startWeight: user?.startWeight || Number(currentWeight),
      targetWeight: Number(targetWeight),
      activityLevel,
      goal,
      createdAt: user?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const calculated = calculateRecommendedTargets(tempProfile);
    setCalories(calculated.calories);
    setProtein(calculated.protein);
    setCarbs(calculated.carbs);
    setFat(calculated.fat);
    setWaterMl(calculated.waterMl || 2500);
  };

  const handleSaveAll = async () => {
    await updateUserProfile({
      name,
      age: Number(age),
      gender,
      height: Number(height),
      currentWeight: Number(currentWeight),
      targetWeight: Number(targetWeight),
      activityLevel,
      goal,
    });

    await updateNutritionGoals({
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      waterMl: Number(waterMl),
    });

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleResetData = async () => {
    await clearAllUserData();
    setConfirmResetOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Account & Session Management Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-sm border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {firebaseUser?.photoURL ? (
            <img
              src={firebaseUser.photoURL}
              alt={firebaseUser.displayName || 'Avatar'}
              className="w-12 h-12 rounded-2xl border-2 border-emerald-400 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                {firebaseUser?.displayName || user?.name || (isAuthenticated ? 'Usuário Conectado' : 'Modo Convidado')}
              </h3>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Nuvem Sincronizada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              {firebaseUser?.email || (isAuthenticated ? 'Autenticado' : 'Faça login para salvar seus dados na nuvem')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              id="btn-logout"
              onClick={logoutUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 text-xs font-semibold border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-login-google-profile"
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Login Google</span>
              </button>

              <button
                type="button"
                id="btn-open-auth-modal"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Page Title & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <span>Perfil & Configuração de Metas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajuste suas características físicas e a distribuição de macronutrientes da dieta
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedFeedback && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              Alterações salvas!
            </span>
          )}

          <button
            id="btn-save-profile"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Section 1: User Profile Data */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Dados Fisiológicos & Antropométricos
          </h3>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            IMC: {bmi} ({bmiCategory})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Idade (anos)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Sexo Biológico</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white focus:border-emerald-500 outline-hidden"
            >
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Altura (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Peso Atual (kg)</label>
            <input
              type="number"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Peso Meta (kg)</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nível de Atividade</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white focus:border-emerald-500 outline-hidden"
            >
              <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
              <option value="lightly_active">Levemente Ativo (treino 1-3x/sem)</option>
              <option value="moderately_active">Moderadamente Ativo (treino 3-5x/sem)</option>
              <option value="very_active">Muito Ativo (treino intenso 6-7x/sem)</option>
              <option value="extra_active">Extremamente Ativo (atleta 2x/dia)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Objetivo Nutricional Primário</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white focus:border-emerald-500 outline-hidden"
            >
              <option value="weight_loss">Perda de Gordura / Definição (Déficit Calórico)</option>
              <option value="maintenance">Manutenção de Peso e Saúde Geral (Isocalórica)</option>
              <option value="hypertrophy">Hipertrofia / Ganho de Massa Muscular (Superávit Calórico)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Nutrition Goals & Macro Calculator */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Metas Nutricionais & Distribuição</span>
            </h3>
            <p className="text-xs text-slate-500">Defina manualmente ou utilize nosso algoritmo científico</p>
          </div>

          <button
            id="btn-auto-calc-targets"
            type="button"
            onClick={handleCalculateAutomatic}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calcular Metas Recomendadas (IA)</span>
          </button>
        </div>

        {/* Form Inputs for Targets */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
            <label className="font-sans font-bold text-amber-900 block mb-1">Calorias (kcal)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white font-bold text-slate-900"
            />
            <span className="text-[10px] text-amber-700 font-sans block mt-1">Total diário</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <label className="font-sans font-bold text-emerald-900 block mb-1">Proteína (g)</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-emerald-800"
            />
            <span className="text-[10px] text-emerald-700 font-sans block mt-1">
              ~{Math.round((protein / (currentWeight || 1)) * 10) / 10}g / kg
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
            <label className="font-sans font-bold text-blue-900 block mb-1">Carboidratos (g)</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white font-bold text-blue-800"
            />
            <span className="text-[10px] text-blue-700 font-sans block mt-1">Energia de treino</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
            <label className="font-sans font-bold text-purple-900 block mb-1">Gorduras (g)</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white font-bold text-purple-800"
            />
            <span className="text-[10px] text-purple-700 font-sans block mt-1">Equilíbrio hormonal</span>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-200 col-span-2 sm:col-span-1">
            <label className="font-sans font-bold text-cyan-900 block mb-1">Água (ml)</label>
            <input
              type="number"
              value={waterMl}
              onChange={(e) => setWaterMl(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-300 bg-white font-bold text-cyan-800"
            />
            <span className="text-[10px] text-cyan-700 font-sans block mt-1">Hidratação diária</span>
          </div>
        </div>
      </div>

      {/* Section: Local Meal Reminders & Notifications */}
      <NotificationSettingsCard />

      {/* Section 3: Data Export (PDF / XLSX / DOC) */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportação de Dados Nutricionais</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exporte seus registros de refeições e macronutrientes nos formatos PDF, Excel (XLSX) e Word (DOC).
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              type="button"
              onClick={() => setExportRangeDays(0)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                exportRangeDays === 0 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tudo
            </button>
            <button
              type="button"
              onClick={() => setExportRangeDays(30)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                exportRangeDays === 30 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Dias
            </button>
            <button
              type="button"
              onClick={() => setExportRangeDays(7)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                exportRangeDays === 7 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setExportRangeDays(1)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                exportRangeDays === 1 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoje
            </button>
          </div>
        </div>

        {/* 3 Main Export Format Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* PDF Card */}
          <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/80 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950">Relatório PDF</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ideal para consultas médicas, nutricionistas e impressão com layout diagramado.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-export-pdf"
              onClick={() => exportUserData('pdf', exportRangeDays)}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          </div>

          {/* XLSX Card */}
          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Planilha Excel (XLSX)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Abas separadas com alimentos, totais diários, metas e cálculo de macros.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-export-xlsx"
              onClick={() => exportUserData('xlsx', exportRangeDays)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar XLSX</span>
            </button>
          </div>

          {/* DOC Card */}
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/80 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">Documento Word (DOC)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Compatível com Microsoft Word, Google Docs e LibreOffice com tabelas formatadas.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-export-doc"
              onClick={() => exportUserData('doc', exportRangeDays)}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar DOC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Clear All / Reset Data (Firebase Firestore) */}
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Zona de Gerenciamento & Limpeza de Dados</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Limpa todas as refeições, fotos e medições salvas na sua conta do banco de dados para reiniciar o histórico do zero.
            </p>
          </div>

          {!confirmResetOpen ? (
            <button
              type="button"
              id="btn-trigger-reset"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Tudo ou Resetar</span>
            </button>
          ) : (
            <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-2 max-w-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirmar exclusão definitiva?</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Todos os registros de refeições e medições em nuvem serão apagados permanentemente.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btn-confirm-clear-all"
                  onClick={handleResetData}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Limpando...' : 'Sim, Limpar Tudo'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

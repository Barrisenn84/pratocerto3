import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';

// Views
import { HomeView } from './components/home/HomeView';
import { HistoryCharts } from './components/dashboard/HistoryCharts';
import { ProgressView } from './components/progress/ProgressView';
import { ProfileView } from './components/profile/ProfileView';
import { AIAssistantView } from './components/assistant/AIAssistantView';

// Modals
import { QuickLogModal } from './components/meals/QuickLogModal';
import { AddMealModal } from './components/meals/AddMealModal';
import { AddFoodModal } from './components/meals/AddFoodModal';
import { FoodVisionModal } from './components/ai/FoodVisionModal';
import { MealDetailModal } from './components/meals/MealDetailModal';
import { AddMeasurementModal } from './components/progress/AddMeasurementModal';
import { AddPhotoModal } from './components/progress/AddPhotoModal';
import { AuthModal } from './components/auth/AuthModal';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { MealReminderToast } from './components/notifications/MealReminderToast';
import { Mic, Sparkles, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isAuthModalOpen,
    setAuthModalOpen,
    isQuickLogModalOpen,
    setQuickLogModalOpen,
    isAddMealModalOpen,
    setAddMealModalOpen,
    isAddFoodModalOpen,
    setAddFoodModalOpen,
    targetMealIdForFood,
    isFoodVisionModalOpen,
    setFoodVisionModalOpen,
    activeMealTypeForLog,
    setActiveMealTypeForLog,
    mealDetailId,
    setMealDetailId,
    isAddMeasurementModalOpen,
    setAddMeasurementModalOpen,
    isAddPhotoModalOpen,
    setAddPhotoModalOpen,
    isVoiceAssistantOpen,
    setVoiceAssistantOpen,
    activeMealReminder,
    dismissActiveMealReminder,
    snoozeActiveMealReminder,
    toastMessage,
  } = useApp();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white pb-20 md:pb-8">
      {/* Primary Header */}
      <Header />

      {/* Floating Meal Reminder Notification Banner */}
      <MealReminderToast
        reminder={activeMealReminder}
        onClose={dismissActiveMealReminder}
        onSnooze={snoozeActiveMealReminder}
        onOpenLogMeal={(type) => {
          setActiveMealTypeForLog(type);
          setAddMealModalOpen(true);
        }}
        onOpenPhotoVision={(type) => {
          setActiveMealTypeForLog(type);
          setFoodVisionModalOpen(true);
        }}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold shadow-xl border border-slate-700/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Structural Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 items-start">
        {/* Persistent Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Main View Area */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'history' && <HistoryCharts />}
          {activeTab === 'progress' && <ProgressView />}
          {activeTab === 'assistant' && <AIAssistantView />}
          {(activeTab === 'profile' || activeTab === 'settings') && <ProfileView />}
        </main>
      </div>

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Global Modals & Overlays */}
      <QuickLogModal
        isOpen={isQuickLogModalOpen}
        onClose={() => setQuickLogModalOpen(false)}
        onOpenAddMeal={(type) => {
          setActiveMealTypeForLog(type);
          setAddMealModalOpen(true);
        }}
        onOpenFoodVision={(type) => {
          setActiveMealTypeForLog(type);
          setFoodVisionModalOpen(true);
        }}
      />

      <AddMealModal
        isOpen={isAddMealModalOpen}
        onClose={() => setAddMealModalOpen(false)}
        initialMealType={activeMealTypeForLog || undefined}
      />

      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setAddFoodModalOpen(false)}
        mealId={targetMealIdForFood}
      />

      <FoodVisionModal
        isOpen={isFoodVisionModalOpen}
        onClose={() => setFoodVisionModalOpen(false)}
        defaultMealType={activeMealTypeForLog || undefined}
      />

      <MealDetailModal
        mealId={mealDetailId}
        onClose={() => setMealDetailId(null)}
      />

      <AddMeasurementModal
        isOpen={isAddMeasurementModalOpen}
        onClose={() => setAddMeasurementModalOpen(false)}
      />

      <AddPhotoModal
        isOpen={isAddPhotoModalOpen}
        onClose={() => setAddPhotoModalOpen(false)}
      />

      {/* Persistent Floating Voice Action Button (Available Across the Entire App) */}
      <button
        id="btn-global-voice-assistant"
        onClick={() => setVoiceAssistantOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 active:scale-95 text-white shadow-xl shadow-emerald-700/30 flex items-center gap-2 transition-all cursor-pointer group ring-4 ring-emerald-500/20"
        title="Conversar com o app por áudio em linguagem natural"
        aria-label="Assistente de Voz"
      >
        <div className="relative">
          <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-300 rounded-full animate-ping" />
        </div>
        <span className="hidden sm:inline text-xs font-bold tracking-tight">
          Voz AI
        </span>
      </button>

      {/* Voice Assistant Modal / Conversational Overlay */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

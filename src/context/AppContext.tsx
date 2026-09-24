import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserProfile,
  NutritionTargets,
  Meal,
  MealItem,
  BodyMeasurement,
  EvolutionPhoto,
  MealType,
  MacroTotals,
  GoalProgress,
  AIAnalysisResult,
  NotificationSettings,
  ActiveMealReminder,
} from '../types';
import {
  FirestoreUserRepository,
  FirestoreMealRepository,
  FirestoreMeasurementRepository,
  FirestoreFoodDatabaseRepository,
  FirestoreWaterRepository,
} from '../firebase/firestoreRepositories';
import { auth, googleProvider } from '../firebase/config';
import { onAuthStateChanged, signOut, signInWithPopup, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import {
  INITIAL_USER,
  INITIAL_TARGETS,
  INITIAL_MEALS,
  INITIAL_MEASUREMENTS,
  INITIAL_EVOLUTION_PHOTOS,
} from '../mock/data/seed';
import { GeminiFoodVisionService } from '../services/GeminiFoodVisionService';
import { LocalNotificationService } from '../services/LocalNotificationService';
import {
  IUserRepository,
  IMealRepository,
  IMeasurementRepository,
  IFoodDatabaseRepository,
  IFoodVisionService,
} from '../repositories/interfaces';
import { calculateDailyTotals, calculateGoalProgress } from '../domain/nutrition/calculations';
import { ExportService } from '../utils/exportService';

export type ActivePage = 'home' | 'history' | 'progress' | 'settings' | 'onboarding' | 'login' | 'profile' | 'assistant';

interface AppContextType {
  // Navigation & User
  currentPage: ActivePage;
  setCurrentPage: (page: ActivePage) => void;
  activeTab: ActivePage;
  setActiveTab: (page: ActivePage) => void;
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  targets: NutritionTargets | null;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  loginDemoUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateTargets: (targets: Partial<NutritionTargets>) => Promise<void>;
  updateNutritionGoals: (targets: Partial<NutritionTargets>) => Promise<void>;

  // Dates & Daily Log
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  changeDateByDays: (offset: number) => void;
  waterIntakeMl: number;
  addWaterIntake: (amountMl: number, targetDate?: string) => void;
  setWaterIntake: (amountMl: number, targetDate?: string) => void;

  // Local Notifications & Reminders
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  activeMealReminder: ActiveMealReminder | null;
  dismissActiveMealReminder: () => void;
  snoozeActiveMealReminder: (minutes?: number) => void;
  requestNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  testNotification: () => void;
  testDelayedBackgroundNotification: (seconds?: number) => void;
  isServiceWorkerActive: boolean;

  // Data Collections
  allMeals: Meal[];
  dailyMeals: Meal[];
  dailyTotals: MacroTotals;
  dailyGoalProgress: GoalProgress;
  measurements: BodyMeasurement[];
  evolutionPhotos: EvolutionPhoto[];

  // Meal Operations
  createMeal: (data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Meal>;
  updateMeal: (id: string, updates: Partial<Meal>) => Promise<Meal>;
  deleteMeal: (id: string) => Promise<boolean>;
  duplicateMeal: (id: string, targetDate?: string) => Promise<Meal>;
  addItemToMeal: (mealId: string, item: Omit<MealItem, 'id' | 'mealId' | 'createdAt' | 'updatedAt'>) => Promise<MealItem>;
  updateMealItem: (mealId: string, itemId: string, updates: Partial<MealItem>) => Promise<MealItem>;
  deleteMealItem: (mealId: string, itemId: string) => Promise<boolean>;

  // Measurement Operations
  addMeasurement: (data: Omit<BodyMeasurement, 'id' | 'createdAt'>) => Promise<BodyMeasurement>;
  deleteMeasurement: (id: string) => Promise<boolean>;
  addEvolutionPhoto: (data: Omit<EvolutionPhoto, 'id' | 'createdAt'>) => Promise<EvolutionPhoto>;
  deleteEvolutionPhoto: (id: string) => Promise<boolean>;

  // Modals & UI States
  authModalOpen: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  quickLogModalOpen: boolean;
  isQuickLogModalOpen: boolean;
  setQuickLogModalOpen: (open: boolean) => void;
  addMealModalOpen: boolean;
  isAddMealModalOpen: boolean;
  setAddMealModalOpen: (open: boolean) => void;
  activeMealTypeForLog: MealType | null;
  setActiveMealTypeForLog: (type: MealType | null) => void;

  foodVisionModalOpen: boolean;
  isFoodVisionModalOpen: boolean;
  setFoodVisionModalOpen: (open: boolean) => void;

  addFoodModalOpen: boolean;
  isAddFoodModalOpen: boolean;
  setAddFoodModalOpen: (open: boolean) => void;
  targetMealIdForFood: string | null;
  setTargetMealIdForFood: (id: string | null) => void;

  mealDetailId: string | null;
  setMealDetailId: (id: string | null) => void;

  addMeasurementModalOpen: boolean;
  isAddMeasurementModalOpen: boolean;
  setAddMeasurementModalOpen: (open: boolean) => void;

  addPhotoModalOpen: boolean;
  isAddPhotoModalOpen: boolean;
  setAddPhotoModalOpen: (open: boolean) => void;

  voiceAssistantOpen: boolean;
  isVoiceAssistantOpen: boolean;
  setVoiceAssistantOpen: (open: boolean) => void;

  // Repositories & Services
  userRepo: IUserRepository;
  mealRepo: IMealRepository;
  measurementRepo: IMeasurementRepository;
  foodRepo: IFoodDatabaseRepository;
  foodVisionService: IFoodVisionService;

  // Export & Portability (PDF / XLSX / DOC)
  exportUserData: (format: 'pdf' | 'xlsx' | 'doc', rangeDays?: number) => Promise<void>;

  // Global Actions & Clear/Reset
  clearAllUserData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  resetAllDataToSeed: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  isLoading: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Direct AI vision completion to meal
  applyAIFoodAnalysisToMeal: (result: AIAnalysisResult, targetMealType: MealType) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Instantiate real Firestore repositories
const userRepo = new FirestoreUserRepository();
const mealRepo = new FirestoreMealRepository();
const measurementRepo = new FirestoreMeasurementRepository();
const foodRepo = new FirestoreFoodDatabaseRepository();
const waterRepo = new FirestoreWaterRepository();
const foodVisionService: IFoodVisionService = new GeminiFoodVisionService();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<ActivePage>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [evolutionPhotos, setEvolutionPhotos] = useState<EvolutionPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
  const [addMealModalOpen, setAddMealModalOpen] = useState(false);
  const [activeMealTypeForLog, setActiveMealTypeForLog] = useState<MealType | null>(null);
  const [foodVisionModalOpen, setFoodVisionModalOpen] = useState(false);
  const [addFoodModalOpen, setAddFoodModalOpen] = useState(false);
  const [targetMealIdForFood, setTargetMealIdForFood] = useState<string | null>(null);
  const [mealDetailId, setMealDetailId] = useState<string | null>(null);
  const [addMeasurementModalOpen, setAddMeasurementModalOpen] = useState(false);
  const [addPhotoModalOpen, setAddPhotoModalOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);

  // Water intake persisted per date (starts with local cache or 0)
  const [waterLogs, setWaterLogs] = useState<Record<string, number>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const today = new Date().toISOString().split('T')[0];
        const cached = localStorage.getItem(`nutrimacro_water_current_${today}`);
        if (cached) return { [today]: Number(cached) || 0 };
      }
    } catch {}
    return {};
  });

  const waterIntakeMl = waterLogs[selectedDate] ?? 0;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Local Notification & Reminder state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    LocalNotificationService.getSettings()
  );
  const [activeMealReminder, setActiveMealReminder] = useState<ActiveMealReminder | null>(null);

  const updateNotificationSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const next: NotificationSettings = {
        ...prev,
        ...updates,
        reminders: {
          ...prev.reminders,
          ...(updates.reminders || {}),
        },
      };
      LocalNotificationService.saveSettings(next);
      return next;
    });
  }, []);

  const dismissActiveMealReminder = useCallback(() => {
    setActiveMealReminder(null);
  }, []);

  const snoozeActiveMealReminder = useCallback(
    (minutes = 15) => {
      if (!activeMealReminder) {
        setActiveMealReminder(null);
        return;
      }
      const reminderToSnooze = { ...activeMealReminder };
      setActiveMealReminder(null);
      showToast(`Lembrete de ${reminderToSnooze.title} adiado por ${minutes} minutos.`);
      setTimeout(() => {
        setActiveMealReminder({
          ...reminderToSnooze,
          id: `snooze_${Date.now()}`,
        });
      }, minutes * 60 * 1000);
    },
    [activeMealReminder, showToast]
  );

  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState<boolean>(false);

  // Initialize Service Worker and listen for notification clicks
  useEffect(() => {
    let isMounted = true;
    LocalNotificationService.initServiceWorker((action, mealType) => {
      if (!isMounted) return;
      if (action === 'log_meal' || action === 'open') {
        if (mealType) {
          setActiveMealTypeForLog(mealType);
        }
        setAddMealModalOpen(true);
        setCurrentPage('home');
      } else if (action === 'view_diary') {
        setCurrentPage('home');
      }
    }).then((reg) => {
      if (isMounted) {
        setIsServiceWorkerActive(Boolean(reg));
      }
    });

    // Handle incoming URL parameters (e.g. opened from system push notification click)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const actionParam = urlParams.get('action');
        const typeParam = urlParams.get('type') as MealType | null;

        if (actionParam === 'log_meal') {
          if (typeParam) {
            setActiveMealTypeForLog(typeParam);
          }
          setAddMealModalOpen(true);
          // Clean up URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (actionParam === 'view_diary') {
          setCurrentPage('home');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {}
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    const perm = await LocalNotificationService.requestPermission();
    updateNotificationSettings({ browserNotifications: perm === 'granted' });
    setIsServiceWorkerActive(LocalNotificationService.isServiceWorkerActive());
    return perm;
  }, [updateNotificationSettings]);

  const testNotification = useCallback(() => {
    LocalNotificationService.triggerTestNotification(notificationSettings, (rem) => {
      setActiveMealReminder(rem);
    });
    showToast('Disparando teste de notificação Push...');
  }, [notificationSettings, showToast]);

  const testDelayedBackgroundNotification = useCallback(
    (seconds = 4) => {
      LocalNotificationService.triggerDelayedBackgroundTest(seconds, notificationSettings, (rem) => {
        setActiveMealReminder(rem);
      });
      showToast(`Alerta em segundo plano agendado para ${seconds}s! Mude de aba ou minimize para testar.`);
    },
    [notificationSettings, showToast]
  );

  // Periodic ticker for local meal reminders (every 25 seconds)
  useEffect(() => {
    if (!notificationSettings.enabled) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMeals = allMeals.filter((m) => m.date === todayStr);

    const check = () => {
      LocalNotificationService.checkReminders(notificationSettings, todayMeals, (rem) => {
        setActiveMealReminder(rem);
      });
    };

    check();
    const interval = setInterval(check, 25000);
    return () => clearInterval(interval);
  }, [notificationSettings, allMeals]);

  // Sync water log for selectedDate
  useEffect(() => {
    let isMounted = true;
    waterRepo.getWaterByDate(selectedDate).then((amount) => {
      if (isMounted) {
        setWaterLogs((prev) => ({ ...prev, [selectedDate]: amount }));
      }
    }).catch(console.warn);
    return () => {
      isMounted = false;
    };
  }, [selectedDate, firebaseUser]);

  const addWaterIntake = useCallback((amountMl: number, targetDate?: string) => {
    const dateToUse = targetDate || selectedDate;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('nutrimacro_data_cleared');
      } catch {}
    }
    setWaterLogs((prev) => {
      const current = prev[dateToUse] ?? 0;
      const nextTotal = Math.max(0, current + amountMl);
      waterRepo.saveWaterIntake(dateToUse, nextTotal).catch(console.warn);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nutrimacro_water_current_${dateToUse}`, String(nextTotal));
        }
      } catch {}
      return { ...prev, [dateToUse]: nextTotal };
    });
    showToast(`+${amountMl}ml de água registrados com sucesso!`);
  }, [selectedDate, showToast]);

  const setWaterIntake = useCallback((amountMl: number, targetDate?: string) => {
    const dateToUse = targetDate || selectedDate;
    const nextTotal = Math.max(0, amountMl);
    setWaterLogs((prev) => ({ ...prev, [dateToUse]: nextTotal }));
    waterRepo.saveWaterIntake(dateToUse, nextTotal).catch(console.warn);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nutrimacro_water_current_${dateToUse}`, String(nextTotal));
      }
    } catch {}
    showToast(`Consumo de água ajustado para ${nextTotal}ml!`);
  }, [selectedDate, showToast]);

  // Load user data from Firestore with robust local fallback
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const isCleared =
        typeof window !== 'undefined' &&
        localStorage.getItem('nutrimacro_data_cleared') === 'true';

      if (auth.currentUser) {
        const [userData, targetsData, mealsData, measurementsData, photosData] =
          await Promise.all([
            userRepo.getCurrentUser().catch(() => null),
            userRepo.getTargets().catch(() => null),
            mealRepo.getAllMeals().catch(() => []),
            measurementRepo.getAllMeasurements().catch(() => []),
            measurementRepo.getAllEvolutionPhotos().catch(() => []),
          ]);

        setUser(userData || INITIAL_USER);
        setTargets(targetsData || INITIAL_TARGETS);

        // When authenticated, respect the actual database contents (even if empty [])
        setAllMeals(Array.isArray(mealsData) ? mealsData : []);
        setMeasurements(Array.isArray(measurementsData) ? measurementsData : []);
        setEvolutionPhotos(Array.isArray(photosData) ? photosData : []);
      } else {
        setUser(INITIAL_USER);
        setTargets(INITIAL_TARGETS);
        if (isCleared) {
          setAllMeals([]);
          setMeasurements([]);
          setEvolutionPhotos([]);
        } else {
          setAllMeals(INITIAL_MEALS);
          setMeasurements(INITIAL_MEASUREMENTS);
          setEvolutionPhotos(INITIAL_EVOLUTION_PHOTOS);
        }
      }
    } catch (e) {
      console.warn('Fallback in loadData:', e);
      setUser(INITIAL_USER);
      setTargets(INITIAL_TARGETS);
      setAllMeals([]);
      setMeasurements([]);
      setEvolutionPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);
      if (currentFbUser) {
        setIsAuthenticated(true);
        await loadData();
      } else {
        // Attempt anonymous sign-in so firestore security rules allow access seamlessly
        try {
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn('Anonymous sign-in not available, running in local mode:', anonErr);
          setIsAuthenticated(false);
          await loadData();
        }
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  // Derived meals for the selected date
  const dailyMeals = useMemo(() => {
    return allMeals.filter((m) => m.date === selectedDate);
  }, [allMeals, selectedDate]);

  // Derived daily totals
  const dailyTotals = useMemo(() => {
    return calculateDailyTotals(dailyMeals);
  }, [dailyMeals]);

  // Derived daily goal progress
  const dailyGoalProgress = useMemo(() => {
    if (!targets) {
      return {
        caloriesPercent: 0,
        proteinPercent: 0,
        carbsPercent: 0,
        fatPercent: 0,
        caloriesRemaining: 0,
        proteinRemaining: 0,
        carbsRemaining: 0,
        fatRemaining: 0,
        isCaloriesExceeded: false,
      };
    }
    return calculateGoalProgress(dailyTotals, targets);
  }, [dailyTotals, targets]);

  const changeDateByDays = useCallback(
    (offset: number) => {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + offset);
      setSelectedDate(d.toISOString().split('T')[0]);
    },
    [selectedDate]
  );

  const goToToday = useCallback(() => {
    setSelectedDate(getTodayString());
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      showToast('Login com o Google realizado!');
      setAuthModalOpen(false);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google login error', err);
        showToast('Falha no login com Google.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const loginDemoUser = useCallback(async () => {
    setAuthModalOpen(true);
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      showToast('Sessão encerrada com sucesso.');
    } catch (err) {
      console.error('Logout error', err);
      showToast('Erro ao encerrar sessão.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const updateUserProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      try {
        const updated = await userRepo.updateUser(updates);
        setUser(updated);
        showToast('Perfil atualizado com sucesso!');
      } catch (err) {
        console.error('Update profile error', err);
        showToast('Erro ao atualizar perfil.');
      }
    },
    [showToast]
  );

  const updateTargetsCallback = useCallback(
    async (newTargets: Partial<NutritionTargets>) => {
      try {
        const updated = await userRepo.updateTargets(newTargets);
        setTargets(updated);
        showToast('Metas nutricionais atualizadas!');
      } catch (err) {
        console.error('Update targets error', err);
        showToast('Erro ao atualizar metas.');
      }
    },
    [showToast]
  );

  const createMeal = useCallback(
    async (data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('nutrimacro_data_cleared');
        } catch {}
      }
      try {
        const newMeal = await mealRepo.createMeal(data);
        setAllMeals((prev) => [newMeal, ...prev.filter((m) => m.id !== newMeal.id)]);
        showToast('Refeição registrada com sucesso!');
        return newMeal;
      } catch (err: any) {
        console.warn('Error in createMeal repository, fallback to local state:', err);
        const fallbackMeal: Meal = {
          ...data,
          id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAllMeals((prev) => [fallbackMeal, ...prev]);
        showToast('Refeição registrada com sucesso!');
        return fallbackMeal;
      }
    },
    [showToast]
  );

  const updateMeal = useCallback(
    async (id: string, updates: Partial<Meal>) => {
      try {
        const updated = await mealRepo.updateMeal(id, updates);
        setAllMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
        showToast('Refeição atualizada!');
        return updated;
      } catch (err) {
        setAllMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m)));
        showToast('Refeição atualizada!');
        return { id, ...updates } as Meal;
      }
    },
    [showToast]
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      try {
        await mealRepo.deleteMeal(id);
      } catch (err) {
        console.warn('Error deleting meal from repo, deleting locally:', err);
      }
      setAllMeals((prev) => prev.filter((m) => m.id !== id));
      if (mealDetailId === id) setMealDetailId(null);
      showToast('Refeição removida.');
      return true;
    },
    [mealDetailId, showToast]
  );

  const duplicateMeal = useCallback(
    async (id: string, targetDate?: string) => {
      const dateToUse = targetDate || selectedDate;
      const duplicated = await mealRepo.duplicateMeal(id, dateToUse);
      setAllMeals((prev) => [duplicated, ...prev]);
      showToast('Refeição duplicada com sucesso!');
      return duplicated;
    },
    [selectedDate, showToast]
  );

  const addItemToMeal = useCallback(
    async (
      mealId: string,
      itemData: Omit<MealItem, 'id' | 'mealId' | 'createdAt' | 'updatedAt'>
    ) => {
      const newItem = await mealRepo.addItemToMeal(mealId, itemData);
      setAllMeals((prev) =>
        prev.map((m) => {
          if (m.id === mealId) {
            return {
              ...m,
              items: [...m.items, newItem],
            };
          }
          return m;
        })
      );
      showToast('Alimento adicionado à refeição!');
      return newItem;
    },
    [showToast]
  );

  const updateMealItem = useCallback(
    async (mealId: string, itemId: string, updates: Partial<MealItem>) => {
      const updated = await mealRepo.updateMealItem(mealId, itemId, updates);
      setAllMeals((prev) =>
        prev.map((m) => {
          if (m.id === mealId) {
            return {
              ...m,
              items: m.items.map((i) => (i.id === itemId ? updated : i)),
            };
          }
          return m;
        })
      );
      return updated;
    },
    []
  );

  const deleteMealItem = useCallback(
    async (mealId: string, itemId: string) => {
      const ok = await mealRepo.deleteMealItem(mealId, itemId);
      if (ok) {
        setAllMeals((prev) =>
          prev.map((m) => {
            if (m.id === mealId) {
              return {
                ...m,
                items: m.items.filter((i) => i.id !== itemId),
              };
            }
            return m;
          })
        );
        showToast('Alimento removido da refeição.');
      }
      return ok;
    },
    [showToast]
  );

  const addMeasurement = useCallback(
    async (data: Omit<BodyMeasurement, 'id' | 'createdAt'>) => {
      const newM = await measurementRepo.addMeasurement(data);
      setMeasurements((prev) =>
        [...prev, newM].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      if (user) {
        setUser({ ...user, currentWeight: newM.weight });
      }
      showToast('Medição corporal registrada no Firestore!');
      return newM;
    },
    [user, showToast]
  );

  const deleteMeasurement = useCallback(
    async (id: string) => {
      const ok = await measurementRepo.deleteMeasurement(id);
      if (ok) {
        setMeasurements((prev) => prev.filter((m) => m.id !== id));
        showToast('Medição excluída.');
      }
      return ok;
    },
    [showToast]
  );

  const addEvolutionPhoto = useCallback(
    async (data: Omit<EvolutionPhoto, 'id' | 'createdAt'>) => {
      const newPhoto = await measurementRepo.addEvolutionPhoto(data);
      setEvolutionPhotos((prev) =>
        [...prev, newPhoto].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      showToast('Foto de evolução salva com sucesso!');
      return newPhoto;
    },
    [showToast]
  );

  const deleteEvolutionPhoto = useCallback(
    async (id: string) => {
      const ok = await measurementRepo.deleteEvolutionPhoto(id);
      if (ok) {
        setEvolutionPhotos((prev) => prev.filter((p) => p.id !== id));
        showToast('Foto de evolução excluída.');
      }
      return ok;
    },
    [showToast]
  );

  // Clear all data / Reset in Firestore and local state
  const clearAllUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Instantly reset React collections to empty
      setAllMeals([]);
      setMeasurements([]);
      setEvolutionPhotos([]);
      setWaterLogs({});

      // 2. Clear all Firestore user subcollections and local storage
      await userRepo.clearAllUserData();

      if (typeof window !== 'undefined') {
        localStorage.setItem('nutrimacro_data_cleared', 'true');
      }

      // 3. Reload cleanly
      await loadData();
      showToast('Todos os registros e fotos foram limpos do banco de dados!');
    } catch (err) {
      console.error('Error clearing data', err);
      setAllMeals([]);
      setMeasurements([]);
      setEvolutionPhotos([]);
      setWaterLogs({});
      showToast('Histórico e registros limpos com sucesso.');
    } finally {
      setIsLoading(false);
    }
  }, [loadData, showToast]);

  const resetDemoData = useCallback(async () => {
    await clearAllUserData();
  }, [clearAllUserData]);

  const applyAIFoodAnalysisToMeal = useCallback(
    async (result: AIAnalysisResult, targetMealType: MealType) => {
      const currentTime = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const typeLabels: Record<MealType, string> = {
        breakfast: 'Café da Manhã',
        lunch: 'Almoço',
        snack: 'Lanche da Tarde',
        dinner: 'Jantar',
        supper: 'Ceia',
        other: 'Refeição Extra',
      };

      const mealItems: MealItem[] = result.items.map((item, index) => ({
        id: 'item_ai_' + Date.now() + '_' + index,
        mealId: '',
        name: item.name,
        description: item.reasoning,
        quantity: item.estimatedQuantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        source: 'photo',
        aiEstimate: true,
        confidence: item.confidence,
        notes: item.reasoning,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const newMeal = await createMeal({
        userId: user?.id || auth.currentUser?.uid || 'user',
        date: selectedDate,
        time: currentTime,
        type: targetMealType,
        name: `${typeLabels[targetMealType]} (IA Vision)`,
        photo: result.imageUrl,
        items: mealItems,
      });

      showToast(`Refeição adicionada com ${mealItems.length} alimentos analisados!`);
      setFoodVisionModalOpen(false);
      return;
    },
    [createMeal, selectedDate, showToast, user]
  );

  // Multi-format export: PDF, XLSX, DOC
  const exportUserData = useCallback(
    async (format: 'pdf' | 'xlsx' | 'doc', rangeDays?: number) => {
      let filteredMeals = allMeals;
      let rangeLabel = 'Todo o Histórico';

      if (rangeDays && rangeDays > 0) {
        const cutOff = new Date();
        cutOff.setDate(cutOff.getDate() - rangeDays);
        const cutOffStr = cutOff.toISOString().split('T')[0];
        filteredMeals = allMeals.filter((m) => m.date >= cutOffStr);
        rangeLabel = rangeDays === 1 ? 'Apenas Hoje' : `Últimos ${rangeDays} dias`;
      }

      try {
        if (format === 'pdf') {
          ExportService.exportToPDF({ user, targets, meals: filteredMeals, rangeLabel, waterIntakeMl });
          showToast('Relatório em PDF gerado com sucesso!');
        } else if (format === 'xlsx') {
          ExportService.exportToXLSX({ user, targets, meals: filteredMeals, rangeLabel });
          showToast('Planilha Excel (.XLSX) baixada com sucesso!');
        } else if (format === 'doc') {
          ExportService.exportToDOC({ user, targets, meals: filteredMeals, rangeLabel });
          showToast('Documento Word (.DOC) gerado com sucesso!');
        }
      } catch (err) {
        console.error('Export error', err);
        showToast('Erro ao gerar exportação.');
      }
    },
    [allMeals, targets, user, waterIntakeMl, showToast]
  );

  const value = useMemo(
    () => ({
      currentPage,
      setCurrentPage,
      activeTab: currentPage,
      setActiveTab: setCurrentPage,
      exportUserData,
      user,
      firebaseUser,
      targets,
      isAuthenticated,
      loginWithGoogle,
      loginDemoUser,
      logoutUser,
      updateUserProfile,
      updateTargets: updateTargetsCallback,
      updateNutritionGoals: updateTargetsCallback,

      selectedDate,
      setSelectedDate,
      goToToday,
      changeDateByDays,
      waterIntakeMl,
      addWaterIntake,
      setWaterIntake,

      allMeals,
      dailyMeals,
      dailyTotals,
      dailyGoalProgress,
      measurements,
      evolutionPhotos,

      createMeal,
      updateMeal,
      deleteMeal,
      duplicateMeal,
      addItemToMeal,
      updateMealItem,
      deleteMealItem,

      addMeasurement,
      deleteMeasurement,
      addEvolutionPhoto,
      deleteEvolutionPhoto,

      authModalOpen,
      isAuthModalOpen: authModalOpen,
      setAuthModalOpen,

      quickLogModalOpen,
      isQuickLogModalOpen: quickLogModalOpen,
      setQuickLogModalOpen,
      addMealModalOpen,
      isAddMealModalOpen: addMealModalOpen,
      setAddMealModalOpen,
      activeMealTypeForLog,
      setActiveMealTypeForLog,

      foodVisionModalOpen,
      isFoodVisionModalOpen: foodVisionModalOpen,
      setFoodVisionModalOpen,

      addFoodModalOpen,
      isAddFoodModalOpen: addFoodModalOpen,
      setAddFoodModalOpen,
      targetMealIdForFood,
      setTargetMealIdForFood,

      mealDetailId,
      setMealDetailId,

      addMeasurementModalOpen,
      isAddMeasurementModalOpen: addMeasurementModalOpen,
      setAddMeasurementModalOpen,

      addPhotoModalOpen,
      isAddPhotoModalOpen: addPhotoModalOpen,
      setAddPhotoModalOpen,

      voiceAssistantOpen,
      isVoiceAssistantOpen: voiceAssistantOpen,
      setVoiceAssistantOpen,

      // Local Notifications & Push API
      notificationSettings,
      updateNotificationSettings,
      activeMealReminder,
      dismissActiveMealReminder,
      snoozeActiveMealReminder,
      requestNotificationPermission,
      testNotification,
      testDelayedBackgroundNotification,
      isServiceWorkerActive,

      userRepo,
      mealRepo,
      measurementRepo,
      foodRepo,
      foodVisionService,

      clearAllUserData,
      resetDemoData,
      resetAllDataToSeed: clearAllUserData,
      refreshAllData: loadData,
      isLoading,
      toastMessage,
      showToast,

      applyAIFoodAnalysisToMeal,
    }),
    [
      currentPage,
      user,
      firebaseUser,
      targets,
      isAuthenticated,
      loginWithGoogle,
      loginDemoUser,
      logoutUser,
      updateUserProfile,
      updateTargetsCallback,
      selectedDate,
      goToToday,
      changeDateByDays,
      waterIntakeMl,
      addWaterIntake,
      setWaterIntake,
      allMeals,
      dailyMeals,
      dailyTotals,
      dailyGoalProgress,
      measurements,
      evolutionPhotos,
      createMeal,
      updateMeal,
      deleteMeal,
      duplicateMeal,
      addItemToMeal,
      updateMealItem,
      deleteMealItem,
      addMeasurement,
      deleteMeasurement,
      addEvolutionPhoto,
      deleteEvolutionPhoto,
      authModalOpen,
      quickLogModalOpen,
      addMealModalOpen,
      activeMealTypeForLog,
      foodVisionModalOpen,
      addFoodModalOpen,
      targetMealIdForFood,
      mealDetailId,
      addMeasurementModalOpen,
      addPhotoModalOpen,
      voiceAssistantOpen,
      notificationSettings,
      updateNotificationSettings,
      activeMealReminder,
      dismissActiveMealReminder,
      snoozeActiveMealReminder,
      requestNotificationPermission,
      testNotification,
      clearAllUserData,
      resetDemoData,
      loadData,
      isLoading,
      toastMessage,
      showToast,
      applyAIFoodAnalysisToMeal,
      exportUserData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

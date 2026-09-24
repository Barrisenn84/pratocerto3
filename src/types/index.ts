export type GoalType = 'cutting' | 'bulking' | 'maintenance' | 'weight_loss' | 'hypertrophy';

export type PreferredUnit = 'metric' | 'imperial';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: GoalType;
  currentWeight: number; // in kg
  startWeight: number; // in kg
  targetWeight: number; // in kg
  height: number; // in cm
  preferredUnit: PreferredUnit;
  createdAt: string;
  updatedAt: string;
}

export type TargetSource = 'manual' | 'professional' | 'estimated';

export interface NutritionTargets {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  waterMl?: number;
  source: TargetSource;
  updatedAt: string;
}

export type NutritionGoals = NutritionTargets;


export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper' | 'other';

export type ItemSource = 'manual' | 'photo' | 'database' | 'voice';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface MealItem {
  id: string;
  mealId: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  photo?: string;
  source: ItemSource;
  aiEstimate: boolean;
  confidence?: ConfidenceLevel;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: MealType;
  name?: string;
  photo?: string;
  items: MealItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GoalProgress {
  caloriesPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  caloriesRemaining: number;
  proteinRemaining: number;
  carbsRemaining: number;
  fatRemaining: number;
  isCaloriesExceeded: boolean;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  waist?: number; // in cm
  arm?: number; // in cm
  chest?: number; // in cm
  thigh?: number; // in cm
  notes?: string;
  photo?: string;
  createdAt: string;
}

export interface EvolutionPhoto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  photoUrl: string;
  weight: number;
  weekLabel: string;
  notes?: string;
  createdAt: string;
}

export interface FoodDatabaseItem {
  id: string;
  name: string;
  category: string;
  defaultQuantity: number;
  unit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isFavorite?: boolean;
  isRecent?: boolean;
  lastUsedAt?: string;
}

export interface AIEstimateItem {
  id: string;
  name: string;
  estimatedQuantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: ConfidenceLevel;
  reasoning?: string;
}

export interface AIAnalysisResult {
  imageUrl: string;
  identifiedMealType?: MealType;
  items: AIEstimateItem[];
  notes?: string;
}

export interface MealReminderConfig {
  id: string;
  mealType: MealType;
  label: string;
  time: string; // "HH:mm" (e.g. "08:00")
  enabled: boolean;
  message: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  smartSkipIfLogged: boolean;
  browserNotifications: boolean;
  reminders: {
    breakfast: MealReminderConfig;
    lunch: MealReminderConfig;
    snack: MealReminderConfig;
    dinner: MealReminderConfig;
    water?: MealReminderConfig;
  };
}

export interface ActiveMealReminder {
  id: string;
  mealType: MealType;
  title: string;
  message: string;
  time: string;
  scheduledTime: string;
}

import {
  UserProfile,
  NutritionTargets,
  Meal,
  MealItem,
  BodyMeasurement,
  EvolutionPhoto,
  FoodDatabaseItem,
  AIAnalysisResult,
  MealType,
} from '../types';

export interface IUserRepository {
  getCurrentUser(): Promise<UserProfile>;
  updateUser(updates: Partial<UserProfile>): Promise<UserProfile>;
  getTargets(): Promise<NutritionTargets>;
  updateTargets(targets: Partial<NutritionTargets>): Promise<NutritionTargets>;
  resetDemoData(): Promise<void>;
}

export interface IMealRepository {
  getMealsByDate(date: string): Promise<Meal[]>;
  getAllMeals(): Promise<Meal[]>;
  getMealById(id: string): Promise<Meal | null>;
  createMeal(meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meal>;
  updateMeal(id: string, updates: Partial<Meal>): Promise<Meal>;
  deleteMeal(id: string): Promise<boolean>;
  addItemToMeal(mealId: string, item: Omit<MealItem, 'id' | 'mealId' | 'createdAt' | 'updatedAt'>): Promise<MealItem>;
  updateMealItem(mealId: string, itemId: string, updates: Partial<MealItem>): Promise<MealItem>;
  deleteMealItem(mealId: string, itemId: string): Promise<boolean>;
  duplicateMeal(mealId: string, targetDate?: string, targetTime?: string): Promise<Meal>;
  getRecentMeals(limit?: number): Promise<Meal[]>;
}

export interface IMeasurementRepository {
  getAllMeasurements(): Promise<BodyMeasurement[]>;
  addMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>): Promise<BodyMeasurement>;
  deleteMeasurement(id: string): Promise<boolean>;
  getAllEvolutionPhotos(): Promise<EvolutionPhoto[]>;
  addEvolutionPhoto(photo: Omit<EvolutionPhoto, 'id' | 'createdAt'>): Promise<EvolutionPhoto>;
  deleteEvolutionPhoto(id: string): Promise<boolean>;
}

export interface IFoodDatabaseRepository {
  searchFoods(query: string): Promise<FoodDatabaseItem[]>;
  getRecentFoods(): Promise<FoodDatabaseItem[]>;
  getFavoriteFoods(): Promise<FoodDatabaseItem[]>;
  toggleFavorite(foodId: string): Promise<boolean>;
  addCustomFood(food: Omit<FoodDatabaseItem, 'id'>): Promise<FoodDatabaseItem>;
}

export interface IFoodVisionService {
  analyzeFoodImage(
    imageDataUrl: string,
    targetMealType?: MealType,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<AIAnalysisResult>;
}

import {
  INITIAL_USER,
  INITIAL_TARGETS,
  INITIAL_MEALS,
  INITIAL_MEASUREMENTS,
  INITIAL_EVOLUTION_PHOTOS,
  INITIAL_FOOD_DATABASE,
} from '../data/seed';
import {
  UserProfile,
  NutritionTargets,
  Meal,
  BodyMeasurement,
  EvolutionPhoto,
  FoodDatabaseItem,
} from '../../types';

const STORAGE_KEYS = {
  USER: 'nutrimacro_demo_user_v1',
  TARGETS: 'nutrimacro_demo_targets_v1',
  MEALS: 'nutrimacro_demo_meals_v1',
  MEASUREMENTS: 'nutrimacro_demo_measurements_v1',
  EVOLUTION_PHOTOS: 'nutrimacro_demo_evolution_photos_v1',
  FOOD_DB: 'nutrimacro_demo_food_db_v1',
};

export class MockStorageManager {
  static getUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  }

  static setUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('Unable to persist user to localStorage', e);
    }
  }

  static getTargets(): NutritionTargets {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TARGETS);
      return data ? JSON.parse(data) : INITIAL_TARGETS;
    } catch {
      return INITIAL_TARGETS;
    }
  }

  static setTargets(targets: NutritionTargets): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
    } catch (e) {
      console.warn('Unable to persist targets to localStorage', e);
    }
  }

  static getMeals(): Meal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEALS);
      return data ? JSON.parse(data) : INITIAL_MEALS;
    } catch {
      return INITIAL_MEALS;
    }
  }

  static setMeals(meals: Meal[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
    } catch (e) {
      console.warn('Unable to persist meals to localStorage', e);
    }
  }

  static getMeasurements(): BodyMeasurement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      return data ? JSON.parse(data) : INITIAL_MEASUREMENTS;
    } catch {
      return INITIAL_MEASUREMENTS;
    }
  }

  static setMeasurements(measurements: BodyMeasurement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
    } catch (e) {
      console.warn('Unable to persist measurements to localStorage', e);
    }
  }

  static getEvolutionPhotos(): EvolutionPhoto[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVOLUTION_PHOTOS);
      return data ? JSON.parse(data) : INITIAL_EVOLUTION_PHOTOS;
    } catch {
      return INITIAL_EVOLUTION_PHOTOS;
    }
  }

  static setEvolutionPhotos(photos: EvolutionPhoto[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EVOLUTION_PHOTOS, JSON.stringify(photos));
    } catch (e) {
      console.warn('Unable to persist evolution photos to localStorage', e);
    }
  }

  static getFoodDatabase(): FoodDatabaseItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOOD_DB);
      return data ? JSON.parse(data) : INITIAL_FOOD_DATABASE;
    } catch {
      return INITIAL_FOOD_DATABASE;
    }
  }

  static setFoodDatabase(items: FoodDatabaseItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FOOD_DB, JSON.stringify(items));
    } catch (e) {
      console.warn('Unable to persist food database to localStorage', e);
    }
  }

  static resetAllToDefaults(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error resetting demo storage', e);
    }
  }
}

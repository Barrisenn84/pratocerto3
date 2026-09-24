import { IMealRepository } from '../../repositories/interfaces';
import { Meal, MealItem } from '../../types';
import { MockStorageManager } from './MockStorage';

export class MockMealRepository implements IMealRepository {
  async getMealsByDate(date: string): Promise<Meal[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const meals = MockStorageManager.getMeals();
    return meals.filter((m) => m.date === date);
  }

  async getAllMeals(): Promise<Meal[]> {
    await new Promise((resolve) => setTimeout(resolve, 70));
    return MockStorageManager.getMeals();
  }

  async getMealById(id: string): Promise<Meal | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const meals = MockStorageManager.getMeals();
    return meals.find((m) => m.id === id) || null;
  }

  async createMeal(mealData: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meal> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const meals = MockStorageManager.getMeals();
    const newMeal: Meal = {
      ...mealData,
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: (mealData.items || []).map((it, idx) => ({
        ...it,
        id: it.id || 'item_' + Date.now() + '_' + idx,
        mealId: it.mealId || '',
        createdAt: it.createdAt || new Date().toISOString(),
        updatedAt: it.updatedAt || new Date().toISOString(),
      })),
    };

    // Ensure items have correct mealId
    newMeal.items = newMeal.items.map((it) => ({ ...it, mealId: newMeal.id }));

    meals.unshift(newMeal);
    MockStorageManager.setMeals(meals);
    return newMeal;
  }

  async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
    await new Promise((resolve) => setTimeout(resolve, 90));
    const meals = MockStorageManager.getMeals();
    const index = meals.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Refeição não encontrada: ${id}`);
    }

    const updated: Meal = {
      ...meals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    meals[index] = updated;
    MockStorageManager.setMeals(meals);
    return updated;
  }

  async deleteMeal(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 90));
    const meals = MockStorageManager.getMeals();
    const filtered = meals.filter((m) => m.id !== id);
    if (filtered.length !== meals.length) {
      MockStorageManager.setMeals(filtered);
      return true;
    }
    return false;
  }

  async addItemToMeal(
    mealId: string,
    itemData: Omit<MealItem, 'id' | 'mealId' | 'createdAt' | 'updatedAt'>
  ): Promise<MealItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const meals = MockStorageManager.getMeals();
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) {
      throw new Error(`Refeição não encontrada: ${mealId}`);
    }

    const newItem: MealItem = {
      ...itemData,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      mealId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    meal.items.push(newItem);
    meal.updatedAt = new Date().toISOString();
    MockStorageManager.setMeals(meals);
    return newItem;
  }

  async updateMealItem(mealId: string, itemId: string, updates: Partial<MealItem>): Promise<MealItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const meals = MockStorageManager.getMeals();
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) {
      throw new Error(`Refeição não encontrada: ${mealId}`);
    }

    const itemIdx = meal.items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) {
      throw new Error(`Alimento não encontrado: ${itemId}`);
    }

    const updatedItem: MealItem = {
      ...meal.items[itemIdx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    meal.items[itemIdx] = updatedItem;
    meal.updatedAt = new Date().toISOString();
    MockStorageManager.setMeals(meals);
    return updatedItem;
  }

  async deleteMealItem(mealId: string, itemId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const meals = MockStorageManager.getMeals();
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return false;

    const initialLen = meal.items.length;
    meal.items = meal.items.filter((i) => i.id !== itemId);
    if (meal.items.length !== initialLen) {
      meal.updatedAt = new Date().toISOString();
      MockStorageManager.setMeals(meals);
      return true;
    }
    return false;
  }

  async duplicateMeal(mealId: string, targetDate?: string, targetTime?: string): Promise<Meal> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const meals = MockStorageManager.getMeals();
    const sourceMeal = meals.find((m) => m.id === mealId);
    if (!sourceMeal) {
      throw new Error('Refeição para duplicação não encontrada');
    }

    const newId = 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const dateToUse = targetDate || new Date().toISOString().split('T')[0];
    const timeToUse =
      targetTime ||
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const duplicated: Meal = {
      ...sourceMeal,
      id: newId,
      date: dateToUse,
      time: timeToUse,
      name: sourceMeal.name ? `${sourceMeal.name} (Cópia)` : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: sourceMeal.items.map((it, idx) => ({
        ...it,
        id: 'item_' + Date.now() + '_' + idx,
        mealId: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    meals.unshift(duplicated);
    MockStorageManager.setMeals(meals);
    return duplicated;
  }

  async getRecentMeals(limit: number = 5): Promise<Meal[]> {
    const meals = MockStorageManager.getMeals();
    return meals.slice(0, limit);
  }
}

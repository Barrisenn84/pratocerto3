import { IFoodDatabaseRepository } from '../../repositories/interfaces';
import { FoodDatabaseItem } from '../../types';
import { MockStorageManager } from './MockStorage';

export class MockFoodDatabaseRepository implements IFoodDatabaseRepository {
  async searchFoods(query: string): Promise<FoodDatabaseItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const items = MockStorageManager.getFoodDatabase();
    if (!query || !query.trim()) {
      return items;
    }
    const cleanQuery = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery)
    );
  }

  async getRecentFoods(): Promise<FoodDatabaseItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const items = MockStorageManager.getFoodDatabase();
    return items.filter((i) => i.isRecent);
  }

  async getFavoriteFoods(): Promise<FoodDatabaseItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const items = MockStorageManager.getFoodDatabase();
    return items.filter((i) => i.isFavorite);
  }

  async toggleFavorite(foodId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const items = MockStorageManager.getFoodDatabase();
    const item = items.find((i) => i.id === foodId);
    if (!item) return false;

    item.isFavorite = !item.isFavorite;
    MockStorageManager.setFoodDatabase(items);
    return item.isFavorite;
  }

  async addCustomFood(
    foodData: Omit<FoodDatabaseItem, 'id'>
  ): Promise<FoodDatabaseItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const items = MockStorageManager.getFoodDatabase();
    const newFood: FoodDatabaseItem = {
      ...foodData,
      id: 'food_custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    };
    items.unshift(newFood);
    MockStorageManager.setFoodDatabase(items);
    return newFood;
  }
}

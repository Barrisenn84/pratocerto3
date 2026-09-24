import { IUserRepository } from '../../repositories/interfaces';
import { UserProfile, NutritionTargets } from '../../types';
import { MockStorageManager } from './MockStorage';

export class MockUserRepository implements IUserRepository {
  async getCurrentUser(): Promise<UserProfile> {
    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 80));
    return MockStorageManager.getUser();
  }

  async updateUser(updates: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const current = MockStorageManager.getUser();
    const updated: UserProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    MockStorageManager.setUser(updated);
    return updated;
  }

  async getTargets(): Promise<NutritionTargets> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return MockStorageManager.getTargets();
  }

  async updateTargets(targets: Partial<NutritionTargets>): Promise<NutritionTargets> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const current = MockStorageManager.getTargets();
    const updated: NutritionTargets = {
      ...current,
      ...targets,
      updatedAt: new Date().toISOString(),
    };
    MockStorageManager.setTargets(updated);
    return updated;
  }

  async resetDemoData(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    MockStorageManager.resetAllToDefaults();
  }
}

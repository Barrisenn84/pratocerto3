import { IMeasurementRepository } from '../../repositories/interfaces';
import { BodyMeasurement, EvolutionPhoto } from '../../types';
import { MockStorageManager } from './MockStorage';

export class MockMeasurementRepository implements IMeasurementRepository {
  async getAllMeasurements(): Promise<BodyMeasurement[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const items = MockStorageManager.getMeasurements();
    // sort chronologically by date
    return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async addMeasurement(
    data: Omit<BodyMeasurement, 'id' | 'createdAt'>
  ): Promise<BodyMeasurement> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const items = MockStorageManager.getMeasurements();
    const newMeasurement: BodyMeasurement = {
      ...data,
      id: 'meas_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    items.push(newMeasurement);
    MockStorageManager.setMeasurements(items);

    // Also update current weight on the user profile
    const user = MockStorageManager.getUser();
    MockStorageManager.setUser({
      ...user,
      currentWeight: newMeasurement.weight,
      updatedAt: new Date().toISOString(),
    });

    return newMeasurement;
  }

  async deleteMeasurement(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const items = MockStorageManager.getMeasurements();
    const filtered = items.filter((m) => m.id !== id);
    if (filtered.length !== items.length) {
      MockStorageManager.setMeasurements(filtered);
      return true;
    }
    return false;
  }

  async getAllEvolutionPhotos(): Promise<EvolutionPhoto[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const photos = MockStorageManager.getEvolutionPhotos();
    return [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async addEvolutionPhoto(
    photoData: Omit<EvolutionPhoto, 'id' | 'createdAt'>
  ): Promise<EvolutionPhoto> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const photos = MockStorageManager.getEvolutionPhotos();
    const newPhoto: EvolutionPhoto = {
      ...photoData,
      id: 'evo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    photos.push(newPhoto);
    MockStorageManager.setEvolutionPhotos(photos);
    return newPhoto;
  }

  async deleteEvolutionPhoto(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const photos = MockStorageManager.getEvolutionPhotos();
    const filtered = photos.filter((p) => p.id !== id);
    if (filtered.length !== photos.length) {
      MockStorageManager.setEvolutionPhotos(filtered);
      return true;
    }
    return false;
  }
}

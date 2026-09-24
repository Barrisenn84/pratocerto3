import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  IUserRepository,
  IMealRepository,
  IMeasurementRepository,
  IFoodDatabaseRepository,
} from '../repositories/interfaces';
import {
  UserProfile,
  NutritionTargets,
  Meal,
  MealItem,
  BodyMeasurement,
  EvolutionPhoto,
  FoodDatabaseItem,
} from '../types';
import { INITIAL_FOOD_DATABASE } from '../mock/data/seed';

export class FirestoreUserRepository implements IUserRepository {
  private getUserId(): string {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      let guestUid = '';
      try {
        if (typeof window !== 'undefined') {
          guestUid = localStorage.getItem('nutrimacro_guest_uid') || '';
          if (!guestUid) {
            guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('nutrimacro_guest_uid', guestUid);
          }
        }
      } catch {
        guestUid = 'guest_user';
      }
      return guestUid;
    }
    return uid;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return {
        id: 'guest_user',
        name: 'Atleta',
        email: '',
        age: 26,
        gender: 'other',
        activityLevel: 'moderately_active',
        goal: 'hypertrophy',
        currentWeight: 75,
        startWeight: 75,
        targetWeight: 80,
        height: 175,
        preferredUnit: 'metric',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const userPath = `users/${uid}`;
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        return {
          id: uid,
          name: data.name || auth.currentUser?.displayName || 'Atleta',
          email: data.email || auth.currentUser?.email || '',
          avatar: data.avatar || auth.currentUser?.photoURL || undefined,
          age: data.age || 26,
          gender: data.gender || 'other',
          activityLevel: data.activityLevel || 'moderately_active',
          goal: data.goal || 'hypertrophy',
          currentWeight: data.currentWeight || 75,
          startWeight: data.startWeight || 75,
          targetWeight: data.targetWeight || 80,
          height: data.height || 175,
          preferredUnit: data.preferredUnit || 'metric',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      }

      // First time user: create real initial profile
      const newProfile: UserProfile = {
        id: uid,
        name: auth.currentUser?.displayName || 'Atleta',
        email: auth.currentUser?.email || '',
        avatar: auth.currentUser?.photoURL || undefined,
        age: 26,
        gender: 'other',
        activityLevel: 'moderately_active',
        goal: 'hypertrophy',
        currentWeight: 75,
        startWeight: 75,
        targetWeight: 80,
        height: 175,
        preferredUnit: 'metric',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const initialTargets: NutritionTargets = {
        calories: 2300,
        protein: 150,
        carbs: 260,
        fat: 70,
        waterMl: 2500,
        source: 'estimated',
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userRef, {
        ...newProfile,
        targets: initialTargets,
      });

      return newProfile;
    } catch (err) {
      console.warn('Warning loading user from Firestore:', err);
      return {
        id: uid,
        name: auth.currentUser?.displayName || 'Atleta',
        email: auth.currentUser?.email || '',
        avatar: auth.currentUser?.photoURL || undefined,
        age: 26,
        gender: 'other',
        activityLevel: 'moderately_active',
        goal: 'hypertrophy',
        currentWeight: 75,
        startWeight: 75,
        targetWeight: 80,
        height: 175,
        preferredUnit: 'metric',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async updateUser(updates: Partial<UserProfile>): Promise<UserProfile> {
    const uid = this.getUserId();
    const userPath = `users/${uid}`;
    try {
      const userRef = doc(db, 'users', uid);
      const current = await this.getCurrentUser();
      const merged: UserProfile = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (auth.currentUser?.uid) {
        await setDoc(userRef, merged, { merge: true });
      }
      return merged;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  }

  async getTargets(): Promise<NutritionTargets> {
    const uid = auth.currentUser?.uid;
    const defaultTargets: NutritionTargets = {
      calories: 2300,
      protein: 150,
      carbs: 260,
      fat: 70,
      waterMl: 2500,
      source: 'estimated',
      updatedAt: new Date().toISOString(),
    };

    if (!uid) {
      return defaultTargets;
    }

    const userPath = `users/${uid}`;
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().targets) {
        return snap.data().targets as NutritionTargets;
      }

      await setDoc(userRef, { targets: defaultTargets }, { merge: true });
      return defaultTargets;
    } catch (err) {
      console.warn('Warning loading targets from Firestore:', err);
      return defaultTargets;
    }
  }

  async updateTargets(targets: Partial<NutritionTargets>): Promise<NutritionTargets> {
    const uid = this.getUserId();
    const userPath = `users/${uid}`;
    try {
      const userRef = doc(db, 'users', uid);
      const current = await this.getTargets();
      const merged: NutritionTargets = {
        ...current,
        ...targets,
        updatedAt: new Date().toISOString(),
      };
      if (auth.currentUser?.uid) {
        await setDoc(userRef, { targets: merged }, { merge: true });
      }
      return merged;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  }

  async resetDemoData(): Promise<void> {
    await this.clearAllUserData();
  }

  async clearAllUserData(): Promise<void> {
    const uid = auth.currentUser?.uid;

    // 1. Clear all local caches
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('nutrimacro_') ||
              key.startsWith('water_') ||
              key.includes('water') ||
              key.includes('meal'))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem('nutrimacro_data_cleared', 'true');
      } catch (e) {
        console.warn('Error clearing localStorage', e);
      }
    }

    if (!uid) return;

    const basePath = `users/${uid}`;

    try {
      const subcollections = [
        'meals',
        'measurements',
        'photos',
        'water',
        'custom_foods',
        'progress',
      ];

      for (const colName of subcollections) {
        try {
          const colRef = collection(db, 'users', uid, colName);
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            const docs = snap.docs;
            for (let i = 0; i < docs.length; i += 400) {
              const chunk = docs.slice(i, i + 400);
              const batch = writeBatch(db);
              chunk.forEach((d) => batch.delete(d.ref));
              await batch.commit();
            }
          }
        } catch (colErr) {
          console.warn(`Warning clearing subcollection ${colName}:`, colErr);
        }
      }

      // Reset targets and user state
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            updatedAt: new Date().toISOString(),
            isCleared: true,
            targets: {
              calories: 2200,
              protein: 140,
              carbs: 250,
              fat: 65,
              waterMl: 2500,
              source: 'estimated',
              updatedAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );
      } catch (uErr) {
        console.warn('Warning updating userDoc on clear:', uErr);
      }
    } catch (err) {
      console.warn('Error clearing all user data in Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, basePath);
    }
  }
}

export class FirestoreMealRepository implements IMealRepository {
  private getUserId(): string {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      let guestUid = '';
      try {
        guestUid = localStorage.getItem('nutrimacro_guest_uid') || '';
        if (!guestUid) {
          guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('nutrimacro_guest_uid', guestUid);
        }
      } catch {
        guestUid = 'guest_user';
      }
      return guestUid;
    }
    return uid;
  }

  async getMealsByDate(date: string): Promise<Meal[]> {
    const uid = this.getUserId();
    const path = `users/${uid}/meals`;
    try {
      const colRef = collection(db, 'users', uid, 'meals');
      const q = query(colRef, where('date', '==', date));
      const snap = await getDocs(q);
      const meals: Meal[] = [];
      snap.forEach((d) => {
        meals.push({ id: d.id, ...d.data() } as Meal);
      });
      return meals.sort((a, b) => a.time.localeCompare(b.time));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async getAllMeals(): Promise<Meal[]> {
    const uid = this.getUserId();
    const path = `users/${uid}/meals`;
    try {
      const colRef = collection(db, 'users', uid, 'meals');
      const snap = await getDocs(colRef);
      const meals: Meal[] = [];
      snap.forEach((d) => {
        meals.push({ id: d.id, ...d.data() } as Meal);
      });
      return meals.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async getMealById(id: string): Promise<Meal | null> {
    const uid = this.getUserId();
    const path = `users/${uid}/meals/${id}`;
    try {
      const mealRef = doc(db, 'users', uid, 'meals', id);
      const snap = await getDoc(mealRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Meal;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  async createMeal(mealData: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meal> {
    const uid = this.getUserId();
    const path = `users/${uid}/meals`;
    try {
      const colRef = collection(db, 'users', uid, 'meals');
      const newDocRef = doc(colRef);
      const now = new Date().toISOString();

      const itemsWithIds = (mealData.items || []).map((item, idx) => ({
        ...item,
        id: item.id || `item_${Date.now()}_${idx}`,
        mealId: newDocRef.id,
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now,
      }));

      const newMeal: Meal = {
        ...mealData,
        id: newDocRef.id,
        userId: uid,
        items: itemsWithIds,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(newDocRef, newMeal);
      } catch (saveErr) {
        console.warn('Firestore setDoc warning in createMeal, continuing with local meal state:', saveErr);
      }
      return newMeal;
    } catch (err) {
      console.warn('Error creating meal in repo:', err);
      const fallbackId = 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      return {
        ...mealData,
        id: fallbackId,
        userId: uid,
        items: mealData.items || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
    const uid = this.getUserId();
    const path = `users/${uid}/meals/${id}`;
    try {
      const mealRef = doc(db, 'users', uid, 'meals', id);
      const current = await this.getMealById(id);
      if (!current) throw new Error(`Refeição ${id} não encontrada`);

      const updated: Meal = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(mealRef, updated, { merge: true });
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async deleteMeal(id: string): Promise<boolean> {
    const uid = this.getUserId();
    const path = `users/${uid}/meals/${id}`;
    try {
      const mealRef = doc(db, 'users', uid, 'meals', id);
      await deleteDoc(mealRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async addItemToMeal(
    mealId: string,
    itemData: Omit<MealItem, 'id' | 'mealId' | 'createdAt' | 'updatedAt'>
  ): Promise<MealItem> {
    const meal = await this.getMealById(mealId);
    if (!meal) throw new Error(`Refeição ${mealId} não encontrada`);

    const now = new Date().toISOString();
    const newItem: MealItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mealId,
      createdAt: now,
      updatedAt: now,
    };

    const updatedItems = [...meal.items, newItem];
    await this.updateMeal(mealId, { items: updatedItems });
    return newItem;
  }

  async updateMealItem(mealId: string, itemId: string, updates: Partial<MealItem>): Promise<MealItem> {
    const meal = await this.getMealById(mealId);
    if (!meal) throw new Error(`Refeição ${mealId} não encontrada`);

    const index = meal.items.findIndex((i) => i.id === itemId);
    if (index === -1) throw new Error(`Alimento ${itemId} não encontrado na refeição`);

    const updatedItem: MealItem = {
      ...meal.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newItems = [...meal.items];
    newItems[index] = updatedItem;

    await this.updateMeal(mealId, { items: newItems });
    return updatedItem;
  }

  async deleteMealItem(mealId: string, itemId: string): Promise<boolean> {
    const meal = await this.getMealById(mealId);
    if (!meal) return false;

    const filtered = meal.items.filter((i) => i.id !== itemId);
    await this.updateMeal(mealId, { items: filtered });
    return true;
  }

  async duplicateMeal(mealId: string, targetDate?: string, targetTime?: string): Promise<Meal> {
    const original = await this.getMealById(mealId);
    if (!original) throw new Error(`Refeição ${mealId} não encontrada`);

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().substring(0, 5);

    const duplicatedData: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'> = {
      ...original,
      date: targetDate || todayStr,
      time: targetTime || nowTime,
      name: `${original.name || original.type} (Cópia)`,
      items: original.items.map((i) => ({ ...i })),
    };

    return this.createMeal(duplicatedData);
  }

  async getRecentMeals(limit = 10): Promise<Meal[]> {
    const all = await this.getAllMeals();
    return all.slice(0, limit);
  }
}

export class FirestoreMeasurementRepository implements IMeasurementRepository {
  private getUserId(): string {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      let guestUid = '';
      try {
        if (typeof window !== 'undefined') {
          guestUid = localStorage.getItem('nutrimacro_guest_uid') || '';
          if (!guestUid) {
            guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('nutrimacro_guest_uid', guestUid);
          }
        }
      } catch {
        guestUid = 'guest_user';
      }
      return guestUid;
    }
    return uid;
  }

  async getAllMeasurements(): Promise<BodyMeasurement[]> {
    const uid = this.getUserId();
    const path = `users/${uid}/measurements`;
    try {
      const colRef = collection(db, 'users', uid, 'measurements');
      const snap = await getDocs(colRef);
      const list: BodyMeasurement[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as BodyMeasurement);
      });
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async addMeasurement(
    measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>
  ): Promise<BodyMeasurement> {
    const uid = this.getUserId();
    const path = `users/${uid}/measurements`;
    try {
      const colRef = collection(db, 'users', uid, 'measurements');
      const newDoc = doc(colRef);
      const created: BodyMeasurement = {
        ...measurement,
        id: newDoc.id,
        userId: uid,
        createdAt: new Date().toISOString(),
      };
      await setDoc(newDoc, created);
      return created;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async deleteMeasurement(id: string): Promise<boolean> {
    const uid = this.getUserId();
    const path = `users/${uid}/measurements/${id}`;
    try {
      const dRef = doc(db, 'users', uid, 'measurements', id);
      await deleteDoc(dRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async getAllEvolutionPhotos(): Promise<EvolutionPhoto[]> {
    const uid = this.getUserId();
    const path = `users/${uid}/photos`;
    try {
      const colRef = collection(db, 'users', uid, 'photos');
      const snap = await getDocs(colRef);
      const list: EvolutionPhoto[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as EvolutionPhoto);
      });
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async addEvolutionPhoto(photo: Omit<EvolutionPhoto, 'id' | 'createdAt'>): Promise<EvolutionPhoto> {
    const uid = this.getUserId();
    const path = `users/${uid}/photos`;
    try {
      const colRef = collection(db, 'users', uid, 'photos');
      const newDoc = doc(colRef);
      const created: EvolutionPhoto = {
        ...photo,
        id: newDoc.id,
        userId: uid,
        createdAt: new Date().toISOString(),
      };
      await setDoc(newDoc, created);
      return created;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async deleteEvolutionPhoto(id: string): Promise<boolean> {
    const uid = this.getUserId();
    const path = `users/${uid}/photos/${id}`;
    try {
      const dRef = doc(db, 'users', uid, 'photos', id);
      await deleteDoc(dRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

export class FirestoreFoodDatabaseRepository implements IFoodDatabaseRepository {
  private baseFoods: FoodDatabaseItem[] = [...INITIAL_FOOD_DATABASE];

  private getUserIdOrNull(): string | null {
    return auth.currentUser?.uid || null;
  }

  async searchFoods(queryStr: string): Promise<FoodDatabaseItem[]> {
    const uid = this.getUserIdOrNull();
    let customFoods: FoodDatabaseItem[] = [];

    if (uid) {
      try {
        const colRef = collection(db, 'users', uid, 'custom_foods');
        const snap = await getDocs(colRef);
        snap.forEach((d) => customFoods.push({ id: d.id, ...d.data() } as FoodDatabaseItem));
      } catch {
        // custom_foods fallback to baseFoods if empty
      }
    }

    const all = [...customFoods, ...this.baseFoods];
    if (!queryStr || !queryStr.trim()) {
      return all;
    }
    const clean = queryStr.toLowerCase().trim();
    return all.filter(
      (item) =>
        item.name.toLowerCase().includes(clean) ||
        item.category.toLowerCase().includes(clean)
    );
  }

  async getRecentFoods(): Promise<FoodDatabaseItem[]> {
    return this.baseFoods.filter((i) => i.isRecent);
  }

  async getFavoriteFoods(): Promise<FoodDatabaseItem[]> {
    return this.baseFoods.filter((i) => i.isFavorite);
  }

  async toggleFavorite(foodId: string): Promise<boolean> {
    const item = this.baseFoods.find((i) => i.id === foodId);
    if (!item) return false;
    item.isFavorite = !item.isFavorite;
    return item.isFavorite;
  }

  async addCustomFood(food: Omit<FoodDatabaseItem, 'id'>): Promise<FoodDatabaseItem> {
    const uid = this.getUserIdOrNull();
    const newId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newFood: FoodDatabaseItem = { ...food, id: newId };

    if (uid) {
      try {
        const docRef = doc(db, 'users', uid, 'custom_foods', newId);
        await setDoc(docRef, newFood);
      } catch (err) {
        console.warn('Could not persist custom food to Firestore', err);
      }
    }

    this.baseFoods.unshift(newFood);
    return newFood;
  }
}

export class FirestoreWaterRepository {
  private getGuestUid(): string {
    let guestUid = 'guest_user';
    try {
      if (typeof window !== 'undefined') {
        let stored = localStorage.getItem('nutrimacro_guest_uid');
        if (!stored) {
          stored = 'guest_' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('nutrimacro_guest_uid', stored);
        }
        guestUid = stored;
      }
    } catch {
      guestUid = 'guest_user';
    }
    return guestUid;
  }

  async getWaterByDate(date: string): Promise<number> {
    const authUid = auth.currentUser?.uid;
    const uid = authUid || this.getGuestUid();

    // 1. Instant cache lookup
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`nutrimacro_water_${uid}_${date}`);
        if (cached !== null) {
          return Number(cached) || 0;
        }
      }
    } catch {}

    // 2. If not authenticated, do not query Firestore (avoids permission denied warnings)
    if (!authUid) {
      return 0;
    }

    // 3. Fetch from Firestore for authenticated users
    try {
      const waterDoc = doc(db, 'users', authUid, 'water', date);
      const snap = await getDoc(waterDoc);
      if (snap.exists()) {
        const amount = snap.data().amountMl || 0;
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`nutrimacro_water_${authUid}_${date}`, String(amount));
          }
        } catch {}
        return amount;
      }
    } catch (err) {
      // Graceful error handling using standard format
      const errMessage = err instanceof Error ? err.message : String(err);
      if (!errMessage.includes('insufficient permissions')) {
        console.warn('Could not read water from Firestore:', err);
      }
    }
    return 0;
  }

  async saveWaterIntake(date: string, amountMl: number): Promise<void> {
    const authUid = auth.currentUser?.uid;
    const uid = authUid || this.getGuestUid();

    // 1. Cache locally first
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nutrimacro_water_${uid}_${date}`, String(amountMl));
      }
    } catch {}

    // 2. If not authenticated, local cache is sufficient
    if (!authUid) {
      return;
    }

    // 3. Persist to Firestore for authenticated users
    try {
      const waterDoc = doc(db, 'users', authUid, 'water', date);
      await setDoc(
        waterDoc,
        {
          userId: authUid,
          date,
          amountMl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      if (!errMessage.includes('insufficient permissions')) {
        console.warn('Could not persist water to Firestore:', err);
      }
    }
  }
}

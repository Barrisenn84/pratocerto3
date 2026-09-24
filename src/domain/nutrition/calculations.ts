import { Meal, MealItem, MacroTotals, GoalProgress, NutritionTargets, GoalType, NutritionGoals } from '../../types';

/**
 * Derives the total nutritional values for a single meal item.
 */
export function calculateItemTotals(item: MealItem): MacroTotals {
  return {
    calories: Math.round(item.calories),
    protein: Math.round(item.protein * 10) / 10,
    carbs: Math.round(item.carbs * 10) / 10,
    fat: Math.round(item.fat * 10) / 10,
  };
}

/**
 * Derives the total nutritional values for an entire meal by summing all its items.
 */
export function calculateMealTotals(meal: Meal): MacroTotals {
  return meal.items.reduce<MacroTotals>(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carbs: acc.carbs + (Number(item.carbs) || 0),
      fat: acc.fat + (Number(item.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Derives the daily totals by summing all meals recorded for that day.
 */
export function calculateDailyTotals(meals: Meal[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (acc, meal) => {
      const mealTotals = calculateMealTotals(meal);
      return {
        calories: acc.calories + mealTotals.calories,
        protein: Math.round((acc.protein + mealTotals.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + mealTotals.carbs) * 10) / 10,
        fat: Math.round((acc.fat + mealTotals.fat) * 10) / 10,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calculates user's progress against their daily targets.
 */
export function calculateGoalProgress(
  totals: MacroTotals,
  targets: NutritionTargets
): GoalProgress {
  const safeCaloriesTarget = Math.max(targets.calories, 1);
  const safeProteinTarget = Math.max(targets.protein, 1);
  const safeCarbsTarget = Math.max(targets.carbs, 1);
  const safeFatTarget = Math.max(targets.fat, 1);

  const caloriesPercent = Math.min(Math.round((totals.calories / safeCaloriesTarget) * 100), 200);
  const proteinPercent = Math.min(Math.round((totals.protein / safeProteinTarget) * 100), 200);
  const carbsPercent = Math.min(Math.round((totals.carbs / safeCarbsTarget) * 100), 200);
  const fatPercent = Math.min(Math.round((totals.fat / safeFatTarget) * 100), 200);

  const caloriesRemaining = targets.calories - totals.calories;
  const proteinRemaining = Math.max(0, Math.round((targets.protein - totals.protein) * 10) / 10);
  const carbsRemaining = Math.max(0, Math.round((targets.carbs - totals.carbs) * 10) / 10);
  const fatRemaining = Math.max(0, Math.round((targets.fat - totals.fat) * 10) / 10);

  return {
    caloriesPercent,
    proteinPercent,
    carbsPercent,
    fatPercent,
    caloriesRemaining,
    proteinRemaining,
    carbsRemaining,
    fatRemaining,
    isCaloriesExceeded: totals.calories > targets.calories,
  };
}

/**
 * Derives weekly metrics from day summaries.
 */
export function calculateWeeklyMetrics(dailyList: Array<{ date: string; totals: MacroTotals }>) {
  if (dailyList.length === 0) {
    return {
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFat: 0,
      daysLogged: 0,
    };
  }

  const activeDays = dailyList.filter((d) => d.totals.calories > 0);
  const divisor = Math.max(activeDays.length, 1);

  const sum = dailyList.reduce(
    (acc, curr) => ({
      calories: acc.calories + curr.totals.calories,
      protein: acc.protein + curr.totals.protein,
      carbs: acc.carbs + curr.totals.carbs,
      fat: acc.fat + curr.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    averageCalories: Math.round(sum.calories / divisor),
    averageProtein: Math.round((sum.protein / divisor) * 10) / 10,
    averageCarbs: Math.round((sum.carbs / divisor) * 10) / 10,
    averageFat: Math.round((sum.fat / divisor) * 10) / 10,
    daysLogged: activeDays.length,
  };
}

/**
 * Calculates nutritional target recommendations based on goal and user weight.
 */
export function suggestTargets(
  weight: number, // kg
  height: number, // cm
  goal: GoalType
): NutritionTargets {
  // Basal estimate using Mifflin-St Jeor (moderate physical activity ~1.4 factor)
  const baseTdee = Math.round((10 * weight + 6.25 * height - 5 * 28 + 5) * 1.4);

  let targetCalories = baseTdee;
  let proteinPerKg = 2.0; // 2g/kg default for fitness
  let fatPercentOfCalories = 0.25;

  if (goal === 'cutting') {
    targetCalories = Math.round(baseTdee * 0.82); // 18% deficit
    proteinPerKg = 2.2; // Higher protein to preserve lean mass
    fatPercentOfCalories = 0.25;
  } else if (goal === 'bulking') {
    targetCalories = Math.round(baseTdee * 1.12); // 12% surplus
    proteinPerKg = 2.0;
    fatPercentOfCalories = 0.25;
  } else {
    // maintenance
    targetCalories = baseTdee;
    proteinPerKg = 1.8;
    fatPercentOfCalories = 0.28;
  }

  const proteinGrams = Math.round(weight * proteinPerKg);
  const fatGrams = Math.round((targetCalories * fatPercentOfCalories) / 9);
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const carbsCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbsGrams = Math.round(carbsCalories / 4);

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
    source: 'estimated',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates recommended nutritional targets for a UserProfile.
 */
export function calculateRecommendedTargets(profile: {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height: number;
  currentWeight: number;
  activityLevel?: string;
  goal?: string;
}): NutritionGoals {
  const weight = profile.currentWeight || 75;
  const height = profile.height || 175;
  const age = profile.age || 30;

  // Harris-Benedict revised / Mifflin-St Jeor BMR
  let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  if (profile.gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };

  const mult = activityMultipliers[profile.activityLevel || 'moderately_active'] || 1.5;
  const tdee = Math.round(bmr * mult);

  let targetCals = tdee;
  let proteinPerKg = 2.0;

  if (profile.goal === 'weight_loss' || profile.goal === 'cutting') {
    targetCals = Math.round(tdee * 0.82); // 18% deficit
    proteinPerKg = 2.2;
  } else if (profile.goal === 'hypertrophy' || profile.goal === 'bulking') {
    targetCals = Math.round(tdee * 1.12); // 12% surplus
    proteinPerKg = 2.0;
  } else {
    targetCals = tdee;
    proteinPerKg = 1.8;
  }

  const proteinG = Math.round(weight * proteinPerKg);
  const fatG = Math.round((targetCals * 0.25) / 9);
  const carbsG = Math.round(Math.max(0, targetCals - (proteinG * 4 + fatG * 9)) / 4);

  return {
    calories: targetCals,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    waterMl: Math.round(weight * 38),
    source: 'estimated',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluates whether daily consumption is within the target threshold.
 */
export function getDayAdherenceStatus(
  consumed: MacroTotals,
  target: NutritionGoals | NutritionTargets,
  toleranceCal: number = 200
): 'under_target' | 'within_target' | 'over_target' {
  const diff = consumed.calories - target.calories;
  if (diff > toleranceCal) return 'over_target';
  if (diff < -toleranceCal) return 'under_target';
  return 'within_target';
}

/**
 * Calculates total weight change and remaining progress toward target weight.
 */
export function calculateWeightChange(
  startWeight: number,
  currentWeight: number,
  targetWeight?: number
) {
  const delta = Math.round((currentWeight - startWeight) * 10) / 10;
  const remaining = targetWeight !== undefined ? Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10 : 0;
  const isLoss = delta < 0;

  return {
    deltaKg: delta,
    remainingKg: remaining,
    isLoss,
    formattedDelta: `${delta > 0 ? '+' : ''}${delta} kg`,
  };
}

/**
 * Calculates consistency adherence percentage over a specific time window.
 */
export function calculateConsistency(daysLogged: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.min(100, Math.round((daysLogged / totalDays) * 100));
}


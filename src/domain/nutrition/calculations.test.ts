import {
  calculateMealTotals,
  calculateDailyTotals,
  calculateGoalProgress,
  suggestTargets,
  getDayAdherenceStatus,
  calculateWeightChange,
  calculateConsistency,
} from './calculations';
import { Meal, NutritionTargets } from '../../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertCloseTo(actual: number, expected: number, delta: number = 0.2) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`Expected ${actual} to be close to ${expected} (+/- ${delta})`);
  }
}

/**
 * Self-contained executable test suite for domain nutrition rules.
 */
export function runDomainCalculationTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function testCase(name: string, fn: () => void) {
    try {
      fn();
      passed++;
    } catch (err: any) {
      failed++;
      errors.push(`${name}: ${err?.message || err}`);
    }
  }

  const sampleMeal: Meal = {
    id: 'meal_test_1',
    userId: 'user_1',
    date: '2026-09-19',
    time: '12:30',
    type: 'lunch',
    name: 'Almoço Balanceado',
    items: [
      {
        id: 'item_1',
        mealId: 'meal_test_1',
        name: 'Peito de Frango',
        quantity: 150,
        unit: 'g',
        calories: 247,
        protein: 46.5,
        carbs: 0,
        fat: 5.4,
        source: 'manual',
        aiEstimate: false,
        createdAt: '2026-09-19T12:00:00Z',
        updatedAt: '2026-09-19T12:00:00Z',
      },
      {
        id: 'item_2',
        mealId: 'meal_test_1',
        name: 'Arroz Branco',
        quantity: 150,
        unit: 'g',
        calories: 195,
        protein: 3.7,
        carbs: 42.1,
        fat: 0.4,
        source: 'manual',
        aiEstimate: false,
        createdAt: '2026-09-19T12:00:00Z',
        updatedAt: '2026-09-19T12:00:00Z',
      },
    ],
    createdAt: '2026-09-19T12:00:00Z',
    updatedAt: '2026-09-19T12:00:00Z',
  };

  const sampleTargets: NutritionTargets = {
    calories: 2000,
    protein: 150,
    carbs: 220,
    fat: 60,
    waterMl: 2800,
    source: 'estimated',
    updatedAt: '2026-09-19T00:00:00Z',
  };

  testCase('calculateMealTotals accurately sums all items', () => {
    const totals = calculateMealTotals(sampleMeal);
    assert(totals.calories === 442, `calories should be 442, got ${totals.calories}`);
    assertCloseTo(totals.protein, 50.2);
    assertCloseTo(totals.carbs, 42.1);
    assertCloseTo(totals.fat, 5.8);
  });

  testCase('calculateDailyTotals sums across multiple meals', () => {
    const meal2: Meal = {
      ...sampleMeal,
      id: 'meal_test_2',
      type: 'dinner',
      items: [
        {
          id: 'item_3',
          mealId: 'meal_test_2',
          name: 'Iogurte Natural',
          quantity: 170,
          unit: 'g',
          calories: 100,
          protein: 10.0,
          carbs: 8.0,
          fat: 3.0,
          source: 'manual',
          aiEstimate: false,
          createdAt: '2026-09-19T19:00:00Z',
          updatedAt: '2026-09-19T19:00:00Z',
        },
      ],
    };

    const daily = calculateDailyTotals([sampleMeal, meal2]);
    assert(daily.calories === 542, `daily calories should be 542, got ${daily.calories}`);
    assertCloseTo(daily.protein, 60.2);
  });

  testCase('calculateGoalProgress calculates remaining macros correctly', () => {
    const mealTotals = calculateMealTotals(sampleMeal);
    const progress = calculateGoalProgress(mealTotals, sampleTargets);

    assert(progress.caloriesRemaining === 1558, 'remaining calories should be 1558');
    assert(progress.isCaloriesExceeded === false, 'isCaloriesExceeded should be false');
    assert(progress.proteinRemaining > 0, 'protein remaining should be > 0');
  });

  testCase('calculateWeightChange calculates delta and remaining distance correctly', () => {
    const change = calculateWeightChange(82.0, 78.5, 75.0);
    assert(change.deltaKg === -3.5, 'delta should be -3.5');
    assert(change.remainingKg === 3.5, 'remaining should be 3.5');
    assert(change.isLoss === true, 'isLoss should be true');
    assert(change.formattedDelta === '-3.5 kg', 'formattedDelta should be -3.5 kg');
  });

  testCase('calculateConsistency returns correct percentage', () => {
    assert(calculateConsistency(6, 7) === 86, '6/7 should be 86%');
    assert(calculateConsistency(7, 7) === 100, '7/7 should be 100%');
    assert(calculateConsistency(0, 7) === 0, '0/7 should be 0%');
  });

  testCase('getDayAdherenceStatus returns proper status based on tolerance', () => {
    const statusWithin = getDayAdherenceStatus({ calories: 2050, protein: 150, carbs: 200, fat: 50 }, sampleTargets);
    assert(statusWithin === 'within_target', 'status should be within_target');

    const statusOver = getDayAdherenceStatus({ calories: 2350, protein: 150, carbs: 200, fat: 50 }, sampleTargets);
    assert(statusOver === 'over_target', 'status should be over_target');

    const statusUnder = getDayAdherenceStatus({ calories: 1600, protein: 100, carbs: 150, fat: 30 }, sampleTargets);
    assert(statusUnder === 'under_target', 'status should be under_target');
  });

  testCase('suggestTargets adjusts calories for cutting vs bulking', () => {
    const cutting = suggestTargets(80, 180, 'cutting');
    const bulking = suggestTargets(80, 180, 'bulking');
    assert(cutting.calories < bulking.calories, 'cutting calories should be < bulking');
    assert(cutting.protein > 0, 'cutting protein should be > 0');
  });

  return { passed, failed, errors };
}

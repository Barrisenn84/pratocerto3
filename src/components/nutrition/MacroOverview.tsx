import React from 'react';
import { useApp } from '../../context/AppContext';
import { MacroCard } from './MacroCard';

export const MacroOverview: React.FC = () => {
  const { targets, dailyTotals, dailyGoalProgress } = useApp();

  if (!targets) return null;

  return (
    <section aria-label="Resumo dos Macronutrientes" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <MacroCard
          type="calories"
          consumed={dailyTotals.calories}
          target={targets.calories}
          percent={dailyGoalProgress.caloriesPercent}
          remaining={dailyGoalProgress.caloriesRemaining}
          isExceeded={dailyGoalProgress.isCaloriesExceeded}
        />
        <MacroCard
          type="protein"
          consumed={dailyTotals.protein}
          target={targets.protein}
          percent={dailyGoalProgress.proteinPercent}
          remaining={dailyGoalProgress.proteinRemaining}
          isExceeded={dailyTotals.protein > targets.protein}
        />
        <MacroCard
          type="carbs"
          consumed={dailyTotals.carbs}
          target={targets.carbs}
          percent={dailyGoalProgress.carbsPercent}
          remaining={dailyGoalProgress.carbsRemaining}
          isExceeded={dailyTotals.carbs > targets.carbs}
        />
        <MacroCard
          type="fat"
          consumed={dailyTotals.fat}
          target={targets.fat}
          percent={dailyGoalProgress.fatPercent}
          remaining={dailyGoalProgress.fatRemaining}
          isExceeded={dailyTotals.fat > targets.fat}
        />
      </div>
    </section>
  );
};

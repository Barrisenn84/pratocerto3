# Modelo de Dados & Proveniência — NutriMacro

Este documento define as entidades principais do domínio, seus relacionamentos e a rastreabilidade da origem dos dados (*data provenance*).

---

## 1. Entidades Principais

### `UserProfile`
Representa as informações biométricas e objetivos gerais do usuário.

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferredUnit: 'metric' | 'imperial';
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;          // cm
  currentWeight: number;   // kg
  startWeight: number;     // kg
  targetWeight: number;    // kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: 'weight_loss' | 'cutting' | 'maintenance' | 'hypertrophy' | 'bulking';
  createdAt: string;
  updatedAt: string;
}
```

### `NutritionTargets` / `NutritionGoals`
Metas energéticas e nutricionais diárias ativas.

```typescript
interface NutritionTargets {
  calories: number;        // kcal
  protein: number;         // gramas
  carbs: number;           // gramas
  fat: number;             // gramas
  waterMl: number;         // ml
  source: 'manual' | 'estimated' | 'nutritionist';
  updatedAt: string;
}
```

### `Meal`
Representa um evento de consumo alimentar (refeição) em uma data e horário.

```typescript
interface Meal {
  id: string;
  userId: string;
  date: string;            // Formato YYYY-MM-DD
  time: string;            // Formato HH:MM
  type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'supper';
  name: string;
  notes?: string;
  photo?: string;          // Data URL ou storage path
  items: MealItem[];
  createdAt: string;
  updatedAt: string;
}
```

### `MealItem`
Alimento individual registrado em uma refeição.

```typescript
interface MealItem {
  id: string;
  mealId: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;            // 'g', 'ml', 'unidade'
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'manual' | 'ai_estimate' | 'food_database';
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `BodyMeasurement` & `EvolutionPhoto`
Métricas de evolução antropométrica e registros fotográficos.

```typescript
interface BodyMeasurement {
  id: string;
  userId: string;
  date: string;
  weight: number;          // kg
  waist?: number;          // cm
  arm?: number;            // cm
  chest?: number;          // cm
  thigh?: number;          // cm
  notes?: string;
  createdAt: string;
}

interface EvolutionPhoto {
  id: string;
  userId: string;
  date: string;
  weightAtDate?: number;
  imageUrl: string;
  notes?: string;
  createdAt: string;
}
```

---

## 2. Proveniência e Auditoria

Cada registro alimentar preserva o campo `source`:
- `manual`: Inserido diretamente pelo usuário.
- `ai_estimate`: Gerado pela IA multimodal com base em análise visual.
- `food_database`: Selecionado a partir do banco de alimentos de referência.

Quando um usuário edita uma porção sugerida pela IA na tela de revisão, os valores são atualizados com consentimento explícito antes de serem persistidos.

---

## 3. Fonte da Verdade e Agregação

A hierarquia de cálculo é estritamente unidirecional:
$$\text{MealItems} \longrightarrow \text{Meal Total} \longrightarrow \text{Daily Total} \longrightarrow \text{Weekly / Monthly Metrics}$$

Agregados diários e semanais são funções puras calculadas a partir dos registros brutos de itens e refeições.

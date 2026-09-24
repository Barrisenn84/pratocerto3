# Estratégia de Testes — NutriMacro

Este documento descreve os níveis de testes, a cobertura do domínio e os procedimentos de validação de qualidade.

---

## 1. Níveis de Testes

### 1.1 Testes Unitários de Domínio
Localizados em `src/domain/nutrition/calculations.test.ts`.
Cobrem:
- `calculateItemTotals`: Cálculo de calorias e macros para itens individuais.
- `calculateMealTotals`: Agregação por refeição com tratamento de valores ausentes ou nulos.
- `calculateDailyTotals`: Soma de todas as refeições do dia selecionado.
- `calculateGoalProgress`: Percentuais de cumprimento e saldo restante sem números negativos espúrios.
- `suggestTargets`: Algoritmo Mifflin-St Jeor ajustado por objetivo (cutting, bulking, manutenção).
- `getDayAdherenceStatus`: Enquadramento em faixas de tolerância calórica.
- `calculateWeightChange`: Diferença entre peso inicial e atual com formatação de sinais.
- `calculateConsistency`: Taxa de dias ativos no período.

---

## 2. Validação Contínua (Lint & Compilação)

O pipeline executa:
- `npm run lint` (`tsc --noEmit`): Validação completa de tipagem estática do TypeScript em todos os arquivos de backend e frontend.
- `npm run build`: Validação de empacotamento do Vite e bundling do servidor via esbuild em `dist/server.cjs`.

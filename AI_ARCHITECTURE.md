# Arquitetura de Inteligência Artificial — NutriMacro

Este documento detalha o subsistema de IA, a seleção de modelos, o roteamento (*model routing*), versionamento de prompts, esquemas estruturados e observabilidade.

---

## 1. Seleção de Modelos & Model Routing

Conforme as diretrizes da API `@google/genai`:
- **Modelo Principal**: `gemini-3.8-flash`
  - Utilizado tanto para a análise multimodal de fotografias de refeições quanto para o assistente conversacional (*AI Nutrition Coach*).
  - Oferece alto desempenho de inferência multimodal com baixa latência e custo controlado.
- **Roteamento Inteligente**:
  - Tarefas de texto e perguntas rápidas: `gemini-3.8-flash` com `maxOutputTokens: 600` e temperatura baixa (`0.2` a `0.3`).
  - Tarefas multimodais com imagem: `gemini-3.8-flash` com `responseSchema` (JSON Schema rigoroso).
  - Tarefas determinísticas (cálculo de soma, macros, metas): software nativo em TypeScript (sem custos de tokens e com 100% de confiabilidade matemática).

---

## 2. Versionamento de Prompts

Todos os prompts críticos possuem identificadores versionados nos metadados de telemetria:

- `food-analysis-v2`: Prompt multimodal para segmentação visual de ingredientes, estimativa de peso em gramas e categorização de confiança (`high`, `medium`, `low`).
- `coach-v1`: Prompt do assistente conversacional diário com grounding estrito nos dados reais de metas e consumo do usuário.

---

## 3. Esquema Estruturado (Structured Outputs)

A rota `POST /api/ai/analyze-food` impõe um esquema estrito via `Type.OBJECT` e `Type.ARRAY`:

```json
{
  "items": [
    {
      "name": "Peito de Frango Grelhado",
      "estimatedQuantity": 150,
      "unit": "g",
      "calories": 247,
      "protein": 46.5,
      "carbs": 0,
      "fat": 5.4,
      "confidence": "high",
      "reasoning": "Textura consistente com filé de corte magro sem pele."
    }
  ],
  "notes": "Prato balanceado com distribuição proteica adequada."
}
```

---

## 4. Observabilidade & Telemetria

Toda resposta do servidor inclui:
- `model`: Identificador do modelo executado (`gemini-3.8-flash` ou fallback).
- `promptVersion`: Versão do contrato de prompt utilizado.
- `latencyMs`: Tempo total de resposta em milissegundos.
- `usedFallback`: Booleano indicando se o resultado foi produzido pela IA remota ou pelo motor de fallback local.

# Arquitetura do Sistema — NutriMacro

Este documento descreve os princípios arquiteturais, a separação de responsabilidades e as diretrizes de engenharia implementadas no NutriMacro.

---

## 1. Princípios Fundamentais

1. **Separação Rígida de Camadas**: Nenhum componente de visualização (React) se conecta diretamente a serviços de IA ou bancos de dados remotos sem passar pelas camadas de Domínio e Repositório.
2. **Determinismo Nutricional**: Cálculos matemáticos (soma de calorias, percentuais de aderência, projeções de déficit/superávit) são executados deterministicamente no código TypeScript e nunca delegados a estimativas de LLMs.
3. **Segurança de Segredos**: Nenhuma chave de API ou credencial sensível (`GEMINI_API_KEY`) é exposta ao navegador. Toda comunicação com modelos fundacionais ocorre via rotas de backend `/api/*`.
4. **Resiliência e Fallbacks**: Se um serviço de IA falhar ou o usuário estiver sem conectividade externa, a aplicação entra em modo de degradação elegante, permitindo registro manual e cálculos imediatos.

---

## 2. Diagrama de Camadas

```text
┌─────────────────────────────────────────────────────────┐
│                     CAMADA DE UI                        │
│  React 19 Components, Tailwind CSS, Layouts, Modais     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                CAMADA DE APLICAÇÃO                      │
│  AppContext (State Management, ViewModels, Coordenador) │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐  ┌───────────────────────┐
│       CAMADA DE DOMÍNIO      │  │  CAMADA DE SERVIÇOS   │
│  Cálculos nutricionais       │  │  GeminiFoodVision     │
│  Metas e recomendações TDEE  │  │  AI Assistant Coach   │
│  Validações de consistência  │  │  Export Service       │
└──────────────┬───────────────┘  └───────────┬───────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────┐
│              CAMADA DE REPOSITÓRIOS                     │
│  Interfaces desacopladas (IUserRepository,             │
│  IMealRepository, IMeasurementRepository,              │
│  IFoodDatabaseRepository, IFoodVisionService)          │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              INFRAESTRUTURA & PERSISTÊNCIA              │
│  Express API Routes (/api/*), LocalStorage,            │
│  Firestore / Firebase Auth Ready, Google Cloud Run      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Execução: Análise de Alimentos por Foto

1. **Upload/Captura**: O usuário seleciona uma imagem ou tira foto do prato.
2. **Pré-processamento**: O cliente valida o tamanho do payload e converte a imagem em base64.
3. **Comunicação Segura**: O cliente envia `POST /api/ai/analyze-food` para o backend Express.
4. **Inferência Multimodal**: O backend executa o modelo `gemini-3.8-flash` via `@google/genai` com JSON Schema estruturado.
5. **Cálculo Determinístico**: Calorias são calculadas com a fórmula padrão de macronutrientes:
   $$\text{Kcal} = (\text{Proteína} \times 4) + (\text{Carboidratos} \times 4) + (\text{Gordura} \times 9)$$
6. **Revisão Humana (Human-in-the-loop)**: Os alimentos detectados são apresentados na tela de revisão com nível de confiança (`high`, `medium`, `low`). O usuário pode ajustar gramas, adicionar ou remover itens.
7. **Persistência**: Ao clicar em "Salvar Refeição", a refeição é gravada no histórico do usuário e os agregados diários são recalculados em tempo real.

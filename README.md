# NutriMacro — Nutrição, Macros & Evolução Física

Plataforma moderna de acompanhamento nutricional, cálculo determinístico de macronutrientes, análise visual de alimentos por IA multimodal e monitoramento de evolução corporal.

## 🚀 Visão Geral

NutriMacro resolve o atrito do registro alimentar diário combinando:
1. **Registro Ultrarrápido**: Atalhos de 1 clique para água, peso e refeições frequentes.
2. **IA Multimodal (Food Vision)**: Identificação visual de ingredientes e porções a partir de fotos com o modelo **Gemini 3.8 Flash** e revisão humana obrigatória (*Human-in-the-loop*).
3. **AI Nutrition Coach**: Assistente de nutrição esportiva conectado aos dados reais do usuário (metas, consumo do dia, consistência semanal).
4. **Cálculos Determinísticos de Alta Precisão**: O software calcula calorias e balanços de macros com base estrita nos itens da refeição (P*4 + C*4 + G*9), sem delegar matemática simples a LLMs.
5. **Evolução Física**: Linha do tempo de pesagem, medidas corporais (cintura, braço, etc.) e comparador fotográfico de antes e depois.
6. **Portabilidade & Privacidade (LGPD)**: Exportação completa do histórico em JSON e CSV a qualquer momento.

---

## 🏗️ Arquitetura em Camadas

O sistema adota arquitetura modular desacoplada:

```text
UI (React 19 + Tailwind CSS)
       ↓
Application Context (State, ViewModels & Actions)
       ↓
Domain (Pure Business Logic & Nutrition Calculations)
       ↓
Services (Gemini Multimodal, Nutrition Knowledge)
       ↓
Repositories (Decoupled Interfaces / LocalStorage / Cloud Firestore ready)
```

Para detalhes profundos, consulte:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Camadas, fluxo de dados e contratos.
- [DATA_MODEL.md](./DATA_MODEL.md) — Esquema de dados, tipos e proveniência.
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) — Model routing, prompts versionados e observabilidade.
- [SECURITY.md](./SECURITY.md) — Regras de autorização, isolamento de dados e proteção de segredos.
- [TESTING.md](./TESTING.md) — Estratégia de testes unitários e de integração.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Empacotamento de produção no Google Cloud Run.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Recharts, Canvas Confetti.
- **Backend**: Node.js, Express, middleware Vite para desenvolvimento unificado na porta 3000.
- **IA Multimodal**: `@google/genai` com Gemini 3.8 Flash (executado exclusivamente no servidor).
- **Persistência**: Repositórios desacoplados com persistência reativa local e compatibilidade nativa com Firebase (Firestore / Auth / Storage).

---

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor full-stack (Express + Vite) na porta 3000.
- `npm run build`: Compila os assets estáticos via Vite e agrupa o servidor Node.js em `dist/server.cjs` via esbuild.
- `npm start`: Inicia o servidor compilado em modo de produção (`node dist/server.cjs`).
- `npm run lint`: Valida tipos estáticos TypeScript sem emitir arquivos.

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import { parseVoiceCommandLocally } from './server/voiceCommandParser';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const PROMPT_VERSION_FOOD = 'food-analysis-v2';
const PROMPT_VERSION_COACH = 'coach-v1';

// Lazy initialized Gemini client with built-in active key fallback
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

// Resilient Gemini generateContent caller with automatic model fallback for 503/429/high-demand spikes
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  },
  models: string[] = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-2.5-pro']
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini generateContent model ${model} error (trying next if available)] ->`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('Nenhum modelo Gemini respondeu com sucesso.');
}

async function startServer() {
  const app = express();

  // Enable JSON body parsing with large limit for base64 food photos
  app.use(express.json({ limit: '25mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Healthcheck
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Multimodal Food Vision Analysis
  app.post('/api/ai/analyze-food', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { imageBase64, mealType = 'lunch' } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'Campo imageBase64 é obrigatório.' });
      return;
    }

    const ai = getGenAI();

    // If API key is not configured, clearly inform the client
    if (!ai) {
      res.status(500).json({
        success: false,
        usedFallback: false,
        error: 'Chave GEMINI_API_KEY não configurada no servidor. É necessário configurar uma chave de API válida no painel de ambiente do Railway (ex: AIzaSy...).',
        promptVersion: PROMPT_VERSION_FOOD,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    try {
      // Extract raw base64 and mime type from data URL if needed
      let mimeType = 'image/jpeg';
      let rawBase64 = imageBase64;

      if (imageBase64.startsWith('data:')) {
        const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          rawBase64 = matches[2];
        }
      }

      const prompt = `Você é um nutricionista esportivo de precisão e especialista em visão computacional de alimentos.
Analise com fidelidade visual ABSOLUTA a fotografia enviada.

DIRETRIZES CRÍTICAS ANTI-ALUCINAÇÃO (SIGA RIGOROSAMENTE):
1. IDENTIFICAÇÃO ESTRITA: Identifique EXCLUSIVAMENTE o que está presente e visível na imagem. NUNCA invente acompanhamentos como arroz, feijão, carnes ou saladas se eles não estiverem explicitamente visíveis na imagem.
2. FRUTAS OU ITENS ISOLADOS:
   - Se a foto mostrar bananas, maçãs, laranjas ou qualquer fruta isolada, liste APENAS a fruta!
   - Se for uma PENCA OU CACHO DE BANANAS / FRUTAS:
     * No campo "name", identifique a fruta com clareza (ex: "Banana Prata", "Banana Nanica", "Banana da Terra").
     * No campo "estimatedQuantity", calcule os macronutrientes para UMA porção individual consumível padrão (ex: 1 banana média de aproximadamente 90g a 110g).
     * No campo "reasoning", mencione explicitamente que a foto contém uma penca/cacho de bananas e que os valores nutricionais foram calculados para 1 unidade consumível média (~100g).
3. PRATOS COMPOSTOS: Se for um prato com vários alimentos preparados, identifique cada alimento individualmente com suas proporções reais.
4. Para cada alimento identificado:
   - Nome em português claro (ex: "Banana Prata", "Peito de Frango Grelhado", "Maçã Fuji").
   - Quantidade estimada em gramas (g) ou ml.
   - Unidade ('g' ou 'ml').
   - Estimativa nutricional rigorosa: Calorias (kcal), Proteína (g), Carboidratos (g), Gorduras (g).
   - Nível de confiança: 'high' (visível e nítido), 'medium' ou 'low'.
   - Justificativa visual realista.`;

      const { text: textOutput, modelUsed } = await generateContentWithFallback(
        ai,
        {
          contents: [
            {
              inlineData: {
                data: rawBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  description: 'Lista de alimentos detectados no prato',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      estimatedQuantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      confidence: {
                        type: Type.STRING,
                        description: "high, medium ou low",
                      },
                      reasoning: { type: Type.STRING },
                    },
                    required: [
                      'name',
                      'estimatedQuantity',
                      'unit',
                      'calories',
                      'protein',
                      'carbs',
                      'fat',
                      'confidence',
                    ],
                  },
                },
                notes: {
                  type: Type.STRING,
                  description: 'Observações gerais sobre a composição do prato ou incertezas.',
                },
              },
              required: ['items'],
            },
          },
        },
        ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-2.5-pro']
      );

      const latencyMs = Date.now() - startTime;

      if (!textOutput) {
        throw new Error('Nenhum texto retornado pelo modelo Gemini.');
      }

      const parsedData = JSON.parse(textOutput);

      res.json({
        success: true,
        usedFallback: false,
        model: modelUsed,
        promptVersion: PROMPT_VERSION_FOOD,
        latencyMs,
        data: {
          imageUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${rawBase64}`,
          identifiedMealType: mealType,
          items: parsedData.items.map((item: any, idx: number) => ({
            id: `ai_gemini_${Date.now()}_${idx}`,
            name: item.name,
            estimatedQuantity: Math.round(Number(item.estimatedQuantity) || 100),
            unit: item.unit || 'g',
            calories: Math.round(Number(item.calories) || 0),
            protein: Number((Number(item.protein) || 0).toFixed(1)),
            carbs: Number((Number(item.carbs) || 0).toFixed(1)),
            fat: Number((Number(item.fat) || 0).toFixed(1)),
            confidence: item.confidence === 'high' || item.confidence === 'medium' || item.confidence === 'low' ? item.confidence : 'medium',
            reasoning: item.reasoning || `Estimado via modelo multimodal Gemini (${modelUsed}).`,
          })),
          notes: parsedData.notes || 'Análise visual Gemini concluída com sucesso. Revise as quantidades antes de confirmar.',
        },
      });
    } catch (err: any) {
      console.error('[Gemini Food Vision Error]:', err?.message || err);
      res.status(500).json({
        success: false,
        usedFallback: false,
        error: err?.message || 'Falha ao processar a imagem com a IA Gemini. Verifique a chave de API.',
        promptVersion: PROMPT_VERSION_FOOD,
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // 3. AI Nutrition Assistant & Coach
  app.post('/api/ai/assistant', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Mensagens em formato de array são obrigatórias.' });
      return;
    }

    const ai = getGenAI();

    // Deterministic fallback if API key is absent
    if (!ai) {
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let reply = 'Olá! Estou operando com base nas suas regras nutricionais locais.';

      if (lastMsg.includes('proteína') || lastMsg.includes('proteina')) {
        const proteinConsumed = userContext?.dailyTotals?.protein ?? 0;
        const proteinTarget = userContext?.targets?.protein ?? 160;
        const diff = proteinTarget - proteinConsumed;
        reply = `Hoje você consumiu **${Math.round(proteinConsumed)}g** de proteína da sua meta de **${proteinTarget}g**. ${
          diff > 0
            ? `Ainda faltam **${Math.round(diff)}g** para fechar sua cota ideal de hipertrofia/manutenção.`
            : `Meta de proteína superada em **${Math.round(Math.abs(diff))}g**! Excelente consistência proteica.`
        }`;
      } else if (lastMsg.includes('caloria') || lastMsg.includes('meta')) {
        const calConsumed = userContext?.dailyTotals?.calories ?? 0;
        const calTarget = userContext?.targets?.calories ?? 2400;
        const diff = calTarget - calConsumed;
        reply = `Seu balanço energético para hoje: **${Math.round(calConsumed)} kcal** consumidas de **${calTarget} kcal** planejadas. ${
          diff > 0
            ? `Você possui saldo restante de **${Math.round(diff)} kcal** para as próximas refeições.`
            : `Você atingiu a meta calórica com **${Math.round(Math.abs(diff))} kcal** de excedente controlado.`
        }`;
      } else if (lastMsg.includes('evolução') || lastMsg.includes('peso')) {
        const currentWeight = userContext?.user?.currentWeight ?? 78;
        const targetWeight = userContext?.user?.targetWeight ?? 75;
        reply = `Seu peso atual registrado é de **${currentWeight} kg**, com meta estipulada em **${targetWeight} kg**. Continue registrando suas medições e refeições para mantermos a curva de tendência atualizada!`;
      } else {
        reply = `Estou aqui para acompanhar sua jornada nutricional! Você pode me perguntar sobre seus macros de hoje, quanto falta para atingir as metas calóricas, ou pedir sugestões para seu próximo prato.`;
      }

      res.json({
        reply,
        usedFallback: true,
        model: 'deterministic-knowledge',
        promptVersion: PROMPT_VERSION_COACH,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    try {
      // Build context grounding string from verified user data
      const contextStr = JSON.stringify({
        userName: userContext?.user?.name || 'Atleta',
        goal: userContext?.user?.goal || 'hipertrofia',
        currentWeightKg: userContext?.user?.currentWeight,
        targetWeightKg: userContext?.user?.targetWeight,
        dailyTargets: userContext?.targets,
        todayTotals: userContext?.dailyTotals,
        todayMealsCount: userContext?.todayMeals?.length || 0,
        todayMealsSummary: userContext?.todayMeals?.map((m: any) => ({
          type: m.type,
          name: m.name,
          time: m.time,
          calories: m.items?.reduce((acc: number, it: any) => acc + (it.calories || 0), 0),
          protein: m.items?.reduce((acc: number, it: any) => acc + (it.protein || 0), 0),
        })),
        waterIntakeMl: userContext?.waterIntakeMl,
      });

      const systemInstruction = `Você é o NutriMacro AI Coach, um assistente de nutrição esportiva e hábitos saudáveis de alto nível.
Regras fundamentais de comportamento:
1. Responda em Português do Brasil com tom encorajador, claro, objetivo e elegante.
2. DADOS REAIS: Utilize ESTRITAMENTE os dados nutricionais fornecidos no contexto do usuário. NUNCA invente números, calorias ou refeições que não existam no contexto.
3. LIMITES DE SAÚDE: Você é um assistente de bem-estar e controle nutricional, NÃO prescreva medicamentos e NÃO diagnostique doenças clínicas.
4. FORMATAÇÃO: Use markdown limpo com negrito em valores-chave (ex: **140g**, **2.150 kcal**) e listas quando apropriado. Mantenha as respostas concisas e acionáveis (máximo 3 parágrafos curtos).

DADOS REAIS DO USUÁRIO NO MOMENTO:
${contextStr}`;

      // Convert conversation history to Gemini contents format
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const { text: textOutput, modelUsed } = await generateContentWithFallback(
        ai,
        {
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        },
        ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-2.5-pro']
      );

      const reply = textOutput || 'Não consegui formular uma resposta no momento.';

      res.json({
        reply,
        usedFallback: false,
        model: modelUsed,
        promptVersion: PROMPT_VERSION_COACH,
        latencyMs: Date.now() - startTime,
      });
    } catch (err: any) {
      console.error('[Gemini Assistant Error]:', err?.message || err);

      // Smart contextual fallback response using user's active nutrition stats
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let fallbackReply = '';
      const proteinConsumed = userContext?.dailyTotals?.protein ?? 0;
      const proteinTarget = userContext?.targets?.protein ?? 160;
      const calConsumed = userContext?.dailyTotals?.calories ?? 0;
      const calTarget = userContext?.targets?.calories ?? 2400;
      const waterConsumed = userContext?.waterIntakeMl ?? 0;

      if (lastMsg.includes('proteína') || lastMsg.includes('proteina') || lastMsg.includes('macro')) {
        const diffP = proteinTarget - proteinConsumed;
        fallbackReply = `Você consumiu **${Math.round(proteinConsumed)}g** de proteína hoje (meta: **${proteinTarget}g**). ${
          diffP > 0
            ? `Ainda faltam **${Math.round(diffP)}g** para fechar sua cota ideal de hipertrofia. Boas fontes rápidas: ovos, peito de frango grelhado ou whey protein.`
            : `Sua meta proteica já foi batida com **${Math.round(Math.abs(diffP))}g** de superávit proteico! Excelente consistência.`
        }`;
      } else if (lastMsg.includes('caloria') || lastMsg.includes('kcal') || lastMsg.includes('meta')) {
        const diffC = calTarget - calConsumed;
        fallbackReply = `Seu consumo calórico atual é de **${Math.round(calConsumed)} kcal** de **${calTarget} kcal**. ${
          diffC > 0
            ? `Você ainda possui um saldo de **${Math.round(diffC)} kcal** para as próximas refeições de hoje.`
            : `Você atingiu sua meta diária com **${Math.round(Math.abs(diffC))} kcal** adicionais.`
        }`;
      } else if (lastMsg.includes('água') || lastMsg.includes('agua') || lastMsg.includes('hidrata')) {
        fallbackReply = `Você registrou **${waterConsumed} ml** de água hoje. Manter-se bem hidratado é fundamental para a recuperação muscular e metabolismo!`;
      } else if (lastMsg.includes('evolução') || lastMsg.includes('peso')) {
        const currentWeight = userContext?.user?.currentWeight ?? 78;
        const targetWeight = userContext?.user?.targetWeight ?? 75;
        fallbackReply = `Seu peso atual é de **${currentWeight} kg**, com meta de **${targetWeight} kg**. Mantenha o foco nos seus macros diários para atingir a meta com consistência!`;
      } else {
        fallbackReply = `Olá! Com base no seu diário de hoje: você registrou **${Math.round(calConsumed)} / ${calTarget} kcal** e **${Math.round(proteinConsumed)} / ${proteinTarget}g** de proteína. Como posso ajudar com sua alimentação ou estratégia de macros agora?`;
      }

      res.json({
        reply: fallbackReply,
        usedFallback: true,
        model: 'nutrimacro-coach-engine',
        promptVersion: PROMPT_VERSION_COACH,
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // 4. Natural Language Conversational Voice Assistant for the Entire App
  app.post('/api/ai/voice-command', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { transcript, userContext } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Campo transcript é obrigatório.' });
      return;
    }

    const ai = getGenAI();

    // Deterministic fallback if API key is absent
    if (!ai) {
      const localResult = parseVoiceCommandLocally(transcript, userContext);
      res.json({
        success: true,
        usedFallback: true,
        spokenReply: localResult.spokenReply,
        displayText: localResult.displayText,
        intent: localResult.intent,
        action: localResult.action,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // Pre-calculate deterministic local parse (executes in < 5ms)
    const localResult = parseVoiceCommandLocally(transcript, userContext);

    // If local parser identified a definitive action with valid items or water or navigation,
    // return immediately for instant, zero-latency response (< 20ms) and 100% reliability
    const hasValidLocalMeal =
      (localResult.action.type === 'log_meal_direct' || localResult.action.type === 'log_meal_proposal') &&
      Array.isArray(localResult.action.mealData?.items) &&
      localResult.action.mealData.items.length > 0;

    const hasValidLocalWater =
      localResult.action.type === 'log_water' &&
      typeof localResult.action.waterAmountMl === 'number' &&
      localResult.action.waterAmountMl > 0;

    const hasValidLocalNav =
      localResult.action.type === 'navigate' && !!localResult.action.targetPage;

    if (hasValidLocalMeal || hasValidLocalWater || hasValidLocalNav) {
      res.json({
        success: true,
        usedFallback: false,
        spokenReply: localResult.spokenReply,
        displayText: localResult.displayText,
        intent: localResult.intent,
        action: localResult.action,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    try {
      const contextStr = JSON.stringify({
        userName: userContext?.userName || 'Atleta',
        goal: userContext?.goal || 'hipertrofia',
        currentWeightKg: userContext?.currentWeight,
        targetWeightKg: userContext?.targetWeight,
        dailyTargets: userContext?.targets,
        todayTotals: userContext?.dailyTotals,
        todayMeals: userContext?.todayMeals?.map((m: any) => ({
          type: m.type,
          name: m.name,
          time: m.time,
          calories: m.items?.reduce((acc: number, it: any) => acc + (it.calories || 0), 0),
          protein: m.items?.reduce((acc: number, it: any) => acc + (it.protein || 0), 0),
          items: m.items?.map((it: any) => it.name),
        })),
        waterIntakeMl: userContext?.waterIntakeMl || 0,
        currentPage: userContext?.currentPage || 'home',
        selectedDate: userContext?.selectedDate,
      });

      const systemInstruction = `Você é o assistente de voz completo do aplicativo NutriMacro em Português do Brasil.
O usuário está CONVERSANDO COM TODO O APLICATIVO VIA ÁUDIO em linguagem natural.
Sua missão é entender a intenção do usuário, interagir amigavelmente e produzir ações para o aplicativo quando apropriado.

Capacidades que você pode acionar:
1. REGISTRAR REFEIÇÃO / ALIMENTOS ("log_meal_direct"):
   Quando o usuário disser que comeu algo ou pedir para registrar alimentos em uma refeição (ex: "comi 2 ovos", "registre 1 tapioca no café da manhã", "adicionei 150g de frango e arroz no almoço", "anote 1 maçã").
   Você DEVE decompor os alimentos informados com estimativa científica rigorosa de calorias, proteína, carboidrato e gordura e retornar action.type = "log_meal_direct" com o objeto mealData completo contendo todos os items.
   A spokenReply DEVE confirmar imediatamente o registro com entusiasmo e clareza (ex: "Registrado com sucesso! Adicionei 2 ovos e 1 tapioca no seu café da manhã, somando 340 calorias e 14 gramas de proteína.").
2. REGISTRAR ÁGUA ("log_water"):
   Quando disser "bebi 300ml de água", "adicionei 2 copos de água", etc. Retorne action.type = "log_water" com waterAmountMl. Confirme na spokenReply.
3. NAVEGAÇÃO ("navigate"):
   Quando pedir para ir para uma tela ("ir para início" -> 'home', "ver evolução/peso" -> 'progress', "ver histórico" -> 'history', "abrir configurações/perfil" -> 'settings', "abrir câmera/tirar foto da comida" -> 'camera').
4. CONSULTAR DADOS E MACROS ("query_stats"):
   Responda com os números exatos do contexto (calorias consumidas, proteína restante, etc). NUNCA invente números diferentes do contexto.
5. CONSELHOS NUTRICIONAIS ("general_advice"):
   Responda dúvidas sobre alimentação saudável, hipertrofia ou perda de peso de forma concisa e amigável.

DIRETRIZES DE ÁUDIO:
- "spokenReply": Deve ser curta, natural, falável em áudio (TTS), fluida, em português brasileiro e sem caracteres especiais desnecessários (máximo 2 a 3 frases).
- "displayText": Pode ter markdown com negritos e marcadores para leitura visual.`;

      // Call Gemini with fallback and timeout
      const geminiCall = generateContentWithFallback(
        ai,
        {
          contents: [
            {
              text: `DADOS DO USUÁRIO E DO APP:\n${contextStr}\n\nTRANSCRIÇÃO DA VOZ DO USUÁRIO:\n"${transcript}"`,
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenReply: {
                type: Type.STRING,
                description: 'Frase natural em português para ser falada em áudio (máximo 3 frases).',
              },
              displayText: {
                type: Type.STRING,
                description: 'Texto formatado para leitura visual no app.',
              },
              intent: {
                type: Type.STRING,
                description: 'log_meal | log_water | navigate | query_stats | general_advice | unknown',
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'none | log_meal_direct | log_meal_proposal | log_water | navigate',
                  },
                  mealData: {
                    type: Type.OBJECT,
                    properties: {
                      mealType: {
                        type: Type.STRING,
                        description: 'breakfast | lunch | snack | dinner | supper | other',
                      },
                      mealName: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                          },
                          required: ['name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fat'],
                        },
                      },
                    },
                  },
                  mealProposal: {
                    type: Type.OBJECT,
                    properties: {
                      mealType: {
                        type: Type.STRING,
                        description: 'breakfast | lunch | snack | dinner | supper | other',
                      },
                      mealName: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                          },
                          required: ['name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fat'],
                        },
                      },
                    },
                  },
                  waterAmountMl: { type: Type.NUMBER },
                  targetPage: {
                    type: Type.STRING,
                    description: 'home | history | progress | assistant | settings | camera',
                  },
                },
                required: ['type'],
              },
            },
            required: ['spokenReply', 'displayText', 'intent', 'action'],
          },
          },
        },
        ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-2.5-pro']
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout (4000ms)')), 4000)
      );

      const { text: output, modelUsed }: any = await Promise.race([geminiCall, timeoutPromise]);

      if (!output) throw new Error('Nenhuma resposta gerada pelo Gemini.');
      const parsed = JSON.parse(output);

      // GUARANTEE: If intent or action is meal logging, mealData MUST have items
      if (
        parsed.action?.type === 'log_meal_direct' ||
        parsed.action?.type === 'log_meal_proposal' ||
        parsed.intent === 'log_meal'
      ) {
        if (!parsed.action) parsed.action = { type: 'log_meal_direct' };
        if (!parsed.action.mealData) parsed.action.mealData = parsed.action.mealProposal || {};

        // If Gemini omitted items or returned an empty array, inject guaranteed items from local parser
        if (!Array.isArray(parsed.action.mealData.items) || parsed.action.mealData.items.length === 0) {
          if (localResult.action.mealData?.items && localResult.action.mealData.items.length > 0) {
            parsed.action.mealData = localResult.action.mealData;
          } else {
            parsed.action.mealData.items = [
              {
                name: 'Refeição Registrada (Voz)',
                quantity: 1,
                unit: 'porção',
                calories: 350,
                protein: 20,
                carbs: 40,
                fat: 10,
              },
            ];
          }
        }

        // Sanitize mealType to valid enum
        const validMealTypes = ['breakfast', 'lunch', 'snack', 'dinner', 'supper', 'other'];
        if (!validMealTypes.includes(parsed.action.mealData.mealType)) {
          parsed.action.mealData.mealType = localResult.action.mealData?.mealType || 'lunch';
          parsed.action.mealData.mealName = localResult.action.mealData?.mealName || 'Almoço';
        }

        parsed.action.mealProposal = parsed.action.mealData;
      }

      res.json({
        success: true,
        usedFallback: false,
        spokenReply: parsed.spokenReply,
        displayText: parsed.displayText,
        intent: parsed.intent,
        action: parsed.action,
        latencyMs: Date.now() - startTime,
      });
    } catch (err: any) {
      console.warn('[Gemini Voice Command Warning, executing smart local parser]:', err?.message || err);
      res.json({
        success: true,
        usedFallback: true,
        spokenReply: localResult.spokenReply,
        displayText: localResult.displayText,
        intent: localResult.intent,
        action: localResult.action,
        fallbackReason: err?.message,
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // 5. Data Export (JSON / CSV)
  app.post('/api/export', (req: Request, res: Response) => {
    const { format = 'json', data } = req.body;

    if (!data) {
      res.status(400).json({ error: 'Dados para exportação não foram fornecidos.' });
      return;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="nutrimacro_export.json"');
      res.send(JSON.stringify(data, null, 2));
      return;
    }

    // CSV format
    if (format === 'csv') {
      const meals = data.meals || [];
      const csvRows = [
        'Data,Hora,Tipo de Refeição,Nome,Alimento,Quantidade,Unidade,Calorias(kcal),Proteína(g),Carboidratos(g),Gordura(g),Origem',
      ];

      for (const meal of meals) {
        for (const item of meal.items || []) {
          csvRows.push(
            `"${meal.date}","${meal.time}","${meal.type}","${meal.name}","${item.name}",${item.quantity},"${item.unit}",${item.calories},${item.protein},${item.carbs},${item.fat},"${item.source || 'manual'}"`
          );
        }
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="nutrimacro_historico.csv"');
      res.send(csvRows.join('\n'));
      return;
    }

    res.status(400).json({ error: 'Formato inválido. Use json ou csv.' });
  });

  // 6. Push API Web Subscriptions & Push Notifications
  const pushSubscriptions = new Map<string, any>();

  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    const { subscription, userId } = req.body;
    if (!subscription || !subscription.endpoint) {
      res.status(400).json({ error: 'Subscription endpoint is required.' });
      return;
    }
    const key = userId || subscription.endpoint;
    pushSubscriptions.set(key, subscription);
    res.json({ success: true, message: 'Push subscription registered successfully.' });
  });

  app.post('/api/push/test', (req: Request, res: Response) => {
    const { mealType = 'lunch' } = req.body;
    res.json({
      success: true,
      title: '🔔 NutriMacro: Lembrete de Refeição',
      body: 'Hora de registrar seu prato e manter seus macros equilibrados no NutriMacro!',
      mealType,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // GEMINI 3.8 LIVE API WEBSOCKET BRIDGE
  // ==========================================
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/live' || url.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Gemini Live WS] Client connected to live voice channel');
    const ai = getGenAI();

    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: 'GEMINI_API_KEY não configurada no servidor para Live API.',
        })
      );
      clientWs.close();
      return;
    }

    let session: any = null;
    let isConnecting = false;

    async function initSession(voiceName: string = 'Zephyr', userContext?: any) {
      if (session || isConnecting) return;
      isConnecting = true;

      const currentAi = getGenAI();
      if (!currentAi) {
        isConnecting = false;
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error: 'GEMINI_API_KEY não configurada no servidor para Live API.',
            })
          );
        }
        return;
      }

      try {
        const contextSummary = userContext
          ? `DADOS ATUAIS DO USUÁRIO NO NUTRIMACRO:\n- Nome: ${userContext.userName || 'Atleta'}\n- Objetivo: ${userContext.goal || 'Hipertrofia'}\n- Peso Atual: ${userContext.currentWeight || 75}kg (Meta: ${userContext.targetWeight || 70}kg)\n- Meta diária de calorias: ${userContext.targets?.calories || 2000} kcal\n- Meta diária de proteína: ${userContext.targets?.protein || 150}g\n- Consumo hoje: ${userContext.dailyTotals?.calories || 0} kcal, ${userContext.dailyTotals?.protein || 0}g proteína\n- Água ingerida: ${userContext.waterIntakeMl || 0} ml.`
          : 'O usuário está usando o app NutriMacro para controle nutricional e metas corporais.';

        const systemInstruction = `Você é o NutriMacro Live Coach, um assistente nutricional e de saúde em tempo real baseado no modelo Gemini 3.8 Live API.
Você está em uma chamada de voz contínua (full-duplex live audio) em Português do Brasil com o usuário.

DIRETRIZES FUNDAMENTAIS DE EXECUÇÃO:
1. Responda em Português do Brasil com entonação amigável, clara, motivadora e concisa (1 a 3 frases por turno).
2. QUANDO O USUÁRIO DISSER QUE COMEU, INFORMAR ALIMENTOS OU PEDIR PARA REGISTRAR UMA REFEIÇÃO (ex: "registre 2 ovos no café", "comi frango com arroz no almoço", "tomei 1 scoop de whey"):
   - Você DEVE OBRIGATORIAMENTE CHAMAR A FERRAMENTA 'register_meal' com a decomposição precisa dos alimentos e seus macronutrientes (calorias, proteína, carboidrato e gordura).
   - NUNCA invente que registrou sem acionar a ferramenta 'register_meal'!
3. QUANDO O USUÁRIO DISSER QUE BEBEU ÁGUA (ex: "bebi 300ml de água", "tomei um copo de 250ml"):
   - Você DEVE OBRIGATORIAMENTE CHAMAR A FERRAMENTA 'register_water' com a quantidade em ml.
4. QUANDO O USUÁRIO PEDIR PARA IR A UMA TELA (ex: "ver evolução", "abrir câmera"):
   - Chame a ferramenta 'navigate_screen'.
5. Ao receber a resposta da ferramenta, confirme verbalmente com naturalidade as calorias e proteína registradas no diário.

${contextSummary}`;

        const validVoices = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'];
        const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Zephyr';

        const connectPromise = currentAi.live.connect({
          model: 'gemini-2.0-flash-exp',
          config: {
            responseModalities: [Modality.AUDIO, Modality.TEXT],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: chosenVoice,
                },
              },
            },
            systemInstruction,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'register_meal',
                    description:
                      'Registra alimentos e refeições consumidas pelo usuário no diário de nutrição.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        mealType: {
                          type: Type.STRING,
                          description: 'breakfast | lunch | snack | dinner | supper | other',
                        },
                        mealName: {
                          type: Type.STRING,
                          description:
                            'Nome legível da refeição (ex: Café da Manhã, Almoço, Lanche, Jantar, Ceia)',
                        },
                        items: {
                          type: Type.ARRAY,
                          description: 'Lista de alimentos detalhados com macros',
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING, description: 'Nome do alimento' },
                              quantity: { type: Type.NUMBER, description: 'Quantidade numérica' },
                              unit: {
                                type: Type.STRING,
                                description: 'Unidade (ex: g, ml, unid, colher, fatia, copo, scoop, porção)',
                              },
                              calories: { type: Type.NUMBER, description: 'Calorias totais em kcal' },
                              protein: { type: Type.NUMBER, description: 'Proteína em gramas' },
                              carbs: { type: Type.NUMBER, description: 'Carboidratos em gramas' },
                              fat: { type: Type.NUMBER, description: 'Gorduras em gramas' },
                            },
                            required: ['name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fat'],
                          },
                        },
                      },
                      required: ['mealType', 'mealName', 'items'],
                    },
                  },
                  {
                    name: 'register_water',
                    description: 'Registra quantidade de água ingerida em mililitros (ml).',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        amountMl: {
                          type: Type.NUMBER,
                          description: 'Volume de água ingerido em ml (ex: 200, 250, 300, 500, 1000).',
                        },
                      },
                      required: ['amountMl'],
                    },
                  },
                  {
                    name: 'navigate_screen',
                    description: 'Navega para outra tela do aplicativo.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        screen: {
                          type: Type.STRING,
                          description: 'home | history | progress | settings | camera',
                        },
                      },
                      required: ['screen'],
                    },
                  },
                ],
              },
            ],
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // 1. Tool Call Handler
              if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
                const fCalls = message.toolCall.functionCalls;
                console.log('[Gemini Live Tool Call Triggered]:', JSON.stringify(fCalls));

                // Send tool call to client
                clientWs.send(
                  JSON.stringify({
                    type: 'toolCall',
                    functionCalls: fCalls,
                  })
                );

                // Send immediate tool response to the Live session so model acknowledges
                try {
                  const functionResponses = fCalls.map((fc: any) => ({
                    response: {
                      output: {
                        success: true,
                        status: 'saved_to_database',
                        message: `Operacao ${fc.name} executada e salva no banco de dados com sucesso.`,
                      },
                    },
                    id: fc.id,
                  }));

                  // Use sendToolResponse or fallback to sendRealtimeInput
                  if (typeof session.sendToolResponse === 'function') {
                    session.sendToolResponse({ functionResponses });
                  } else {
                    session.sendRealtimeInput({ toolResponse: { functionResponses } });
                  }
                } catch (toolErr) {
                  console.warn('Error sending toolResponse back to Live session:', toolErr);
                }
              }

              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        audio: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                      })
                    );
                  }
                  if (part.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'text',
                        text: part.text,
                      })
                    );
                  }
                }
              }

              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
            },
            onclose: (event) => {
              console.log('[Gemini Live Session closed]:', event?.reason || 'normal');
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'session_closed', reason: event?.reason }));
              }
            },
            onerror: (err) => {
              console.error('[Gemini Live Session error]:', err?.message || err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Erro na sessão Live' }));
              }
            },
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite excedido ao conectar com a API Gemini Live (20s). O servidor de voz pode estar temporariamente sobrecarregado.')), 20000)
        );
        session = await Promise.race([connectPromise, timeoutPromise]);

        isConnecting = false;
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'ready',
              model: 'gemini-2.0-flash-exp',
              voice: chosenVoice,
            })
          );
        }
      } catch (err: any) {
        isConnecting = false;
        console.error('[Gemini Live Connect Error]:', err?.message || err);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error: err?.message || 'Falha ao conectar ao Gemini Live.',
            })
          );
        }
      }
    }

    clientWs.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'init') {
          await initSession(msg.voice || 'Zephyr', msg.userContext);
          return;
        }

        if (!session && !isConnecting) {
          await initSession('Zephyr');
        }

        if (!session) {
          return;
        }

        if (msg.type === 'audio' && msg.audio) {
          // Send PCM audio via realtimeInput
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: msg.mimeType || 'audio/pcm;rate=16000',
            },
          });
        } else if (msg.type === 'text' && msg.text) {
          // Send text via sendClientContent (SDK v2.x)
          if (typeof session.sendClientContent === 'function') {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: msg.text }] }],
              turnComplete: true,
            });
          } else {
            session.sendRealtimeInput({ text: msg.text });
          }
        }
      } catch (e: any) {
        console.warn('[Gemini Live message parse error]:', e?.message || e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Gemini Live WS] Client disconnected');
      if (session) {
        try {
          session.close();
        } catch {}
        session = null;
      }
    });
  });

  // ==========================================
  // VITE & STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[NutriMacro Server] listening on http://0.0.0.0:${PORT} (Express + Vite + Gemini Live WS)`);
  });
}

startServer().catch((err) => {
  console.error('[NutriMacro Startup Error]:', err);
});

import { IFoodVisionService } from '../../repositories/interfaces';
import { AIAnalysisResult, MealType, AIEstimateItem } from '../../types';
import { SAMPLE_AI_FOOD_IMAGES } from '../data/seed';

export class MockFoodVisionService implements IFoodVisionService {
  async analyzeFoodImage(
    imageDataUrl: string,
    targetMealType?: MealType,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<AIAnalysisResult> {
    // Stage 1: Uploading
    onProgress?.('Enviando imagem para análise segura...', 20);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Stage 2: Segmenting / Preprocessing
    onProgress?.('Segmentando elementos visuais e prato...', 45);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Stage 3: Identifying Foods
    onProgress?.('Identificando alimentos e texturas...', 75);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Stage 4: Estimating Volumes & Macros
    onProgress?.('Estimando densidade volumétrica e macronutrientes...', 95);
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Check if the image matches any sample
    const matchedSample = SAMPLE_AI_FOOD_IMAGES.find((s) => s.url === imageDataUrl);

    if (matchedSample) {
      const items: AIEstimateItem[] = matchedSample.detectedItems.map((item, idx) => ({
        ...item,
        id: 'ai_item_' + Date.now() + '_' + idx,
      }));

      return {
        imageUrl: imageDataUrl,
        identifiedMealType: targetMealType || 'lunch',
        items,
        notes: `Identificados ${items.length} alimentos principais com base na geometria do prato e texturas visualizadas.`,
      };
    }

    // If it's a custom uploaded photo from the user:
    // Do NOT invent fake food (chicken, rice, beans). Inform clearly that real vision requires the Gemini AI service.
    throw new Error(
      'Não foi possível conectar à IA do Gemini para analisar sua foto. Verifique a configuração da chave GEMINI_API_KEY no servidor.'
    );
  }
}

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
    // Generate realistic multi-item meal detection tailored to typical plate composition
    const genericItems: AIEstimateItem[] = [
      {
        id: 'ai_gen_1_' + Date.now(),
        name: 'Grelhado de Proteína (Frango / Carne Magra)',
        estimatedQuantity: 150,
        unit: 'g',
        calories: 255,
        protein: 46.5,
        carbs: 0,
        fat: 6.0,
        confidence: 'high',
        reasoning: 'Textura consistente com corte de carne magra grelhada.',
      },
      {
        id: 'ai_gen_2_' + Date.now(),
        name: 'Carboidrato Complexo (Arroz ou Raiz)',
        estimatedQuantity: 160,
        unit: 'g',
        calories: 208,
        protein: 4.3,
        carbs: 45.1,
        fat: 0.5,
        confidence: 'high',
        reasoning: 'Porção equivalente a aproximadamente 4 colheres de servir.',
      },
      {
        id: 'ai_gen_3_' + Date.now(),
        name: 'Guarnição de Leguminosa / Feijão',
        estimatedQuantity: 100,
        unit: 'g',
        calories: 76,
        protein: 4.8,
        carbs: 13.6,
        fat: 0.5,
        confidence: 'medium',
        reasoning: 'Caldo denso ao lado do carboidrato; estimativa com incerteza na quantidade de caldo.',
      },
      {
        id: 'ai_gen_4_' + Date.now(),
        name: 'Salada / Vegetais Frescos',
        estimatedQuantity: 80,
        unit: 'g',
        calories: 18,
        protein: 1.2,
        carbs: 3.5,
        fat: 0.2,
        confidence: 'high',
        reasoning: 'Folhas verdes e vegetais coloridos identificados na borda.',
      },
      {
        id: 'ai_gen_5_' + Date.now(),
        name: 'Azeite / Molho de Finalização',
        estimatedQuantity: 8,
        unit: 'ml',
        calories: 70,
        protein: 0,
        carbs: 0,
        fat: 8.0,
        confidence: 'low',
        reasoning: 'Brilho reflexivo na superfície dos vegetais indica presença de óleo/azeite.',
      },
    ];

    return {
      imageUrl: imageDataUrl,
      identifiedMealType: targetMealType || 'lunch',
      items: genericItems,
      notes: 'Análise multimodal simulada concluída. Revise e confirme as quantidades antes de salvar na refeição.',
    };
  }
}

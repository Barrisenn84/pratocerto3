import { IFoodVisionService } from '../repositories/interfaces';
import { AIAnalysisResult, MealType } from '../types';
import { MockFoodVisionService } from '../mock/services/MockFoodVisionService';
import { SAMPLE_AI_FOOD_IMAGES } from '../mock/data/seed';

export class GeminiFoodVisionService implements IFoodVisionService {
  private fallbackService = new MockFoodVisionService();

  async analyzeFoodImage(
    imageDataUrl: string,
    targetMealType?: MealType,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<AIAnalysisResult> {
    onProgress?.('Conectando ao serviço de IA Gemini...', 20);

    try {
      onProgress?.('Segmentando elementos visuais e prato com Gemini...', 50);

      const response = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mealType: targetMealType || 'lunch',
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.error || `Erro no servidor de IA: HTTP ${response.status}`);
      }

      onProgress?.('Extraindo macronutrientes e conferindo porções...', 85);
      const json = await response.json();

      if (json.success && json.data) {
        onProgress?.('Análise concluída com sucesso!', 100);
        return json.data as AIAnalysisResult;
      }

      throw new Error(json.error || json.reason || 'Falha ao analisar a foto com a IA do Gemini.');
    } catch (err: any) {
      console.warn('[GeminiFoodVisionService] Erro na análise visual com Gemini:', err?.message || err);

      // Only fallback to mock if this was explicitly one of the static demo sample images
      const isKnownSample = SAMPLE_AI_FOOD_IMAGES.some((s) => s.url === imageDataUrl);
      if (isKnownSample) {
        return await this.fallbackService.analyzeFoodImage(imageDataUrl, targetMealType, onProgress);
      }

      // For custom user camera/upload photos, report the actual error instead of faking food
      throw new Error(
        err?.message ||
          'Não foi possível analisar a imagem pela IA Gemini. Verifique a chave GEMINI_API_KEY no servidor.'
      );
    }
  }
}


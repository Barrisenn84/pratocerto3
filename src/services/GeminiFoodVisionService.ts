import { IFoodVisionService } from '../repositories/interfaces';
import { AIAnalysisResult, MealType } from '../types';
import { MockFoodVisionService } from '../mock/services/MockFoodVisionService';

export class GeminiFoodVisionService implements IFoodVisionService {
  private fallbackService = new MockFoodVisionService();

  async analyzeFoodImage(
    imageDataUrl: string,
    targetMealType?: MealType,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<AIAnalysisResult> {
    onProgress?.('Conectando ao serviço de IA...', 20);

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
        throw new Error(`Erro na resposta do servidor: HTTP ${response.status}`);
      }

      onProgress?.('Extraindo macronutrientes e conferindo porções...', 85);
      const json = await response.json();

      if (json.success && json.data) {
        onProgress?.('Análise concluída com sucesso!', 100);
        return json.data as AIAnalysisResult;
      }

      // If server returned usedFallback, use local fallback gracefully
      console.warn('[GeminiFoodVisionService] Utilizando fallback determinístico:', json.reason || json.error);
      return await this.fallbackService.analyzeFoodImage(imageDataUrl, targetMealType, onProgress);
    } catch (err) {
      console.warn('[GeminiFoodVisionService] Falha na chamada de IA, acionando fallback local:', err);
      return await this.fallbackService.analyzeFoodImage(imageDataUrl, targetMealType, onProgress);
    }
  }
}

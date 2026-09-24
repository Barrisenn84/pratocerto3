export interface VoiceActionResult {
  type: 'none' | 'log_water' | 'navigate' | 'log_meal_proposal' | 'log_meal_direct';
  waterAmountMl?: number;
  targetPage?: 'home' | 'history' | 'progress' | 'assistant' | 'settings' | 'camera';
  mealData?: {
    mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper' | 'other';
    mealName: string;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  };
  mealProposal?: {
    mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper' | 'other';
    mealName: string;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  };
}

export interface VoiceCommandResponse {
  spokenReply: string;
  displayText: string;
  intent: 'log_meal' | 'log_water' | 'navigate' | 'query_stats' | 'general_advice';
  action: VoiceActionResult;
}

interface FoodDef {
  aliases: string[];
  name: string;
  defaultQty: number;
  unit: string;
  perQtyCals: number;
  perQtyProt: number;
  perQtyCarbs: number;
  perQtyFat: number;
}

export const FOOD_DATABASE: FoodDef[] = [
  {
    aliases: ['ovo', 'ovos', 'ovo cozido', 'ovos cozidos', 'ovo frito', 'ovos fritos', 'ovos mexidos', 'ovo mexido', 'clara', 'claras'],
    name: 'Ovo de Galinha',
    defaultQty: 2,
    unit: 'unid',
    perQtyCals: 75,
    perQtyProt: 6.5,
    perQtyCarbs: 0.6,
    perQtyFat: 5.2,
  },
  {
    aliases: ['omelete', 'omelet'],
    name: 'Omelete Simples (2 Ovos)',
    defaultQty: 1,
    unit: 'porção',
    perQtyCals: 160,
    perQtyProt: 13.0,
    perQtyCarbs: 1.2,
    perQtyFat: 11.5,
  },
  {
    aliases: ['tapioca', 'tapioca simples', 'goma de tapioca', 'tapiocas'],
    name: 'Tapioca',
    defaultQty: 1,
    unit: 'unid (80g)',
    perQtyCals: 190,
    perQtyProt: 0.5,
    perQtyCarbs: 45.0,
    perQtyFat: 0.2,
  },
  {
    aliases: ['cuscuz', 'cuscuz nordestino', 'cuscuz de milho', 'milharina'],
    name: 'Cuscuz de Milho',
    defaultQty: 1,
    unit: 'fatia (100g)',
    perQtyCals: 115,
    perQtyProt: 2.5,
    perQtyCarbs: 25.0,
    perQtyFat: 0.8,
  },
  {
    aliases: ['frango', 'peito de frango', 'file de frango', 'filé de frango', 'frango grelhado', 'frango desfiado', 'sobrecoxa'],
    name: 'Peito de Frango Grelhado',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 1.6, // per gram
    perQtyProt: 0.31,
    perQtyCarbs: 0.0,
    perQtyFat: 0.036,
  },
  {
    aliases: ['arroz', 'arroz branco', 'arroz cozido', 'arroz integral'],
    name: 'Arroz Cozido',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 1.3,
    perQtyProt: 0.025,
    perQtyCarbs: 0.28,
    perQtyFat: 0.003,
  },
  {
    aliases: ['feijao', 'feijão', 'feijao carioca', 'feijão carioca', 'feijao preto', 'feijão preto', 'feijoada'],
    name: 'Feijão Cozido',
    defaultQty: 100,
    unit: 'g',
    perQtyCals: 0.76,
    perQtyProt: 0.048,
    perQtyCarbs: 0.136,
    perQtyFat: 0.005,
  },
  {
    aliases: ['carne', 'bife', 'patinho', 'carne moida', 'carne moída', 'alcatra', 'file mignon', 'filé mignon', 'picanha'],
    name: 'Carne Bovina Grelhada',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 2.1,
    perQtyProt: 0.29,
    perQtyCarbs: 0.0,
    perQtyFat: 0.1,
  },
  {
    aliases: ['peixe', 'tilapia', 'tilápia', 'salmao', 'salmão', 'atum', 'atum enlatado'],
    name: 'Filé de Tilápia / Peixe Grelhado',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 1.25,
    perQtyProt: 0.26,
    perQtyCarbs: 0.0,
    perQtyFat: 0.025,
  },
  {
    aliases: ['batata doce', 'batata-doce'],
    name: 'Batata Doce Cozida',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 0.77,
    perQtyProt: 0.014,
    perQtyCarbs: 0.184,
    perQtyFat: 0.001,
  },
  {
    aliases: ['batata', 'batata inglesa', 'pure de batata', 'purê de batata'],
    name: 'Batata Inglesa Cozida',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 0.85,
    perQtyProt: 0.02,
    perQtyCarbs: 0.19,
    perQtyFat: 0.001,
  },
  {
    aliases: ['mandioca', 'aipim', 'macaxeira'],
    name: 'Mandioca Cozida',
    defaultQty: 120,
    unit: 'g',
    perQtyCals: 1.6,
    perQtyProt: 0.012,
    perQtyCarbs: 0.38,
    perQtyFat: 0.003,
  },
  {
    aliases: ['whey', 'whey protein', 'proteina em po', 'proteína em pó', 'shake proteico', 'shake'],
    name: 'Whey Protein Concentrado',
    defaultQty: 1,
    unit: 'scoop (30g)',
    perQtyCals: 120,
    perQtyProt: 24.0,
    perQtyCarbs: 2.5,
    perQtyFat: 1.8,
  },
  {
    aliases: ['creatina'],
    name: 'Creatina Monohidratada',
    defaultQty: 5,
    unit: 'g',
    perQtyCals: 0,
    perQtyProt: 0,
    perQtyCarbs: 0,
    perQtyFat: 0,
  },
  {
    aliases: ['banana', 'bananas', 'banana prata', 'banana nanica'],
    name: 'Banana Prata',
    defaultQty: 1,
    unit: 'unid',
    perQtyCals: 90,
    perQtyProt: 1.2,
    perQtyCarbs: 23.0,
    perQtyFat: 0.3,
  },
  {
    aliases: ['maca', 'maçã', 'maca fuji', 'maçã fuji', 'maçã gala'],
    name: 'Maçã',
    defaultQty: 1,
    unit: 'unid',
    perQtyCals: 72,
    perQtyProt: 0.4,
    perQtyCarbs: 19.0,
    perQtyFat: 0.2,
  },
  {
    aliases: ['mamao', 'mamão', 'papaya'],
    name: 'Mamão Papaia',
    defaultQty: 1,
    unit: 'fatia (150g)',
    perQtyCals: 65,
    perQtyProt: 0.8,
    perQtyCarbs: 15.0,
    perQtyFat: 0.2,
  },
  {
    aliases: ['morango', 'morangos'],
    name: 'Morangos Frescos',
    defaultQty: 100,
    unit: 'g',
    perQtyCals: 0.32,
    perQtyProt: 0.007,
    perQtyCarbs: 0.077,
    perQtyFat: 0.003,
  },
  {
    aliases: ['abacate', 'avocado'],
    name: 'Abacate',
    defaultQty: 100,
    unit: 'g',
    perQtyCals: 1.6,
    perQtyProt: 0.02,
    perQtyCarbs: 0.08,
    perQtyFat: 0.15,
  },
  {
    aliases: ['laranja', 'laranjas'],
    name: 'Laranja Fresca',
    defaultQty: 1,
    unit: 'unid',
    perQtyCals: 62,
    perQtyProt: 1.2,
    perQtyCarbs: 15.0,
    perQtyFat: 0.2,
  },
  {
    aliases: ['aveia', 'farelo de aveia', 'aveia em flocos'],
    name: 'Aveia em Flocos',
    defaultQty: 40,
    unit: 'g',
    perQtyCals: 3.75,
    perQtyProt: 0.14,
    perQtyCarbs: 0.65,
    perQtyFat: 0.07,
  },
  {
    aliases: ['pasta de amendoim', 'amendoim'],
    name: 'Pasta de Amendoim Integral',
    defaultQty: 1,
    unit: 'colher (15g)',
    perQtyCals: 90,
    perQtyProt: 4.0,
    perQtyCarbs: 3.0,
    perQtyFat: 7.5,
  },
  {
    aliases: ['pao integral', 'pão integral', 'torrada integral', 'torrada', 'torradas'],
    name: 'Pão Integral',
    defaultQty: 2,
    unit: 'fatias (50g)',
    perQtyCals: 120,
    perQtyProt: 5.0,
    perQtyCarbs: 22.0,
    perQtyFat: 1.5,
  },
  {
    aliases: ['pao frances', 'pão francês', 'pao de sal', 'pão de sal', 'pao', 'pão'],
    name: 'Pão Francês',
    defaultQty: 1,
    unit: 'unid (50g)',
    perQtyCals: 140,
    perQtyProt: 4.5,
    perQtyCarbs: 29.0,
    perQtyFat: 1.0,
  },
  {
    aliases: ['queijo mussarela', 'mussarela', 'queijo minas', 'queijo branco', 'queijo prato', 'ricota', 'cottage', 'queijo'],
    name: 'Queijo',
    defaultQty: 2,
    unit: 'fatias (40g)',
    perQtyCals: 120,
    perQtyProt: 8.5,
    perQtyCarbs: 0.8,
    perQtyFat: 9.0,
  },
  {
    aliases: ['presunto', 'peito de peru', 'blanquet'],
    name: 'Presunto / Peito de Peru',
    defaultQty: 2,
    unit: 'fatias (30g)',
    perQtyCals: 45,
    perQtyProt: 6.5,
    perQtyCarbs: 0.5,
    perQtyFat: 1.5,
  },
  {
    aliases: ['manteiga', 'requeijao', 'requeijão', 'margarina'],
    name: 'Manteiga / Requeijão',
    defaultQty: 1,
    unit: 'colher (15g)',
    perQtyCals: 75,
    perQtyProt: 1.5,
    perQtyCarbs: 1.0,
    perQtyFat: 7.0,
  },
  {
    aliases: ['leite desnatado', 'leite integral', 'leite'],
    name: 'Leite',
    defaultQty: 200,
    unit: 'ml',
    perQtyCals: 0.55,
    perQtyProt: 0.032,
    perQtyCarbs: 0.048,
    perQtyFat: 0.02,
  },
  {
    aliases: ['iogurte grego', 'iogurte natural', 'iogurte desnatado', 'iogurte'],
    name: 'Iogurte Natural',
    defaultQty: 1,
    unit: 'pote (160g)',
    perQtyCals: 110,
    perQtyProt: 6.5,
    perQtyCarbs: 9.0,
    perQtyFat: 5.0,
  },
  {
    aliases: ['salada verde', 'salada', 'alface', 'tomate', 'legumes', 'brocolis', 'brócolis', 'cenoura', 'abobrinha'],
    name: 'Salada & Vegetais Cozidos',
    defaultQty: 100,
    unit: 'g',
    perQtyCals: 0.3,
    perQtyProt: 0.02,
    perQtyCarbs: 0.06,
    perQtyFat: 0.003,
  },
  {
    aliases: ['macarrao', 'macarrão', 'espaguete', 'massa'],
    name: 'Macarrão Cozido',
    defaultQty: 150,
    unit: 'g',
    perQtyCals: 1.5,
    perQtyProt: 0.05,
    perQtyCarbs: 0.31,
    perQtyFat: 0.01,
  },
  {
    aliases: ['cafe preto', 'café preto', 'cafezinho', 'cafe', 'café'],
    name: 'Café Preto (Sem Açúcar)',
    defaultQty: 1,
    unit: 'xícara (100ml)',
    perQtyCals: 2,
    perQtyProt: 0.1,
    perQtyCarbs: 0.3,
    perQtyFat: 0.0,
  },
  {
    aliases: ['suco de laranja', 'suco de uva', 'suco natural', 'suco'],
    name: 'Suco de Frutas Natural',
    defaultQty: 250,
    unit: 'ml',
    perQtyCals: 0.45,
    perQtyProt: 0.007,
    perQtyCarbs: 0.10,
    perQtyFat: 0.002,
  },
  {
    aliases: ['refrigerante zero', 'coca zero', 'guarana zero', 'refrigerante'],
    name: 'Refrigerante Zero Açúcar',
    defaultQty: 350,
    unit: 'lata (350ml)',
    perQtyCals: 0,
    perQtyProt: 0.0,
    perQtyCarbs: 0.0,
    perQtyFat: 0.0,
  },
  {
    aliases: ['azeite de oliva', 'azeite extravirgem', 'azeite'],
    name: 'Azeite de Oliva Extra Virgem',
    defaultQty: 1,
    unit: 'colher sopa (10ml)',
    perQtyCals: 88,
    perQtyProt: 0.0,
    perQtyCarbs: 0.0,
    perQtyFat: 10.0,
  },
  {
    aliases: ['hamburguer', 'hambúrguer', 'burger', 'cheeseburger', 'sanduiche', 'sanduíche'],
    name: 'Hambúrguer Artesanal Completo',
    defaultQty: 1,
    unit: 'unid',
    perQtyCals: 460,
    perQtyProt: 26.0,
    perQtyCarbs: 38.0,
    perQtyFat: 22.0,
  },
  {
    aliases: ['pizza', 'fatia de pizza', 'pedaco de pizza', 'pedaço de pizza'],
    name: 'Fatia de Pizza',
    defaultQty: 1,
    unit: 'fatia (100g)',
    perQtyCals: 260,
    perQtyProt: 11.0,
    perQtyCarbs: 28.0,
    perQtyFat: 11.0,
  },
  {
    aliases: ['batata frita', 'fritas'],
    name: 'Batata Frita',
    defaultQty: 100,
    unit: 'g',
    perQtyCals: 3.12,
    perQtyProt: 0.034,
    perQtyCarbs: 0.41,
    perQtyFat: 0.15,
  },
  {
    aliases: ['pastel', 'pastel de carne', 'pastel de queijo', 'coxinha', 'salgado'],
    name: 'Pastel / Salgado Assado/Frito',
    defaultQty: 1,
    unit: 'unid (120g)',
    perQtyCals: 280,
    perQtyProt: 8.5,
    perQtyCarbs: 26.0,
    perQtyFat: 15.0,
  },
  {
    aliases: ['acai', 'açaí', 'tigela de acai', 'tigela de açaí'],
    name: 'Tigela de Açaí com Banana',
    defaultQty: 250,
    unit: 'g',
    perQtyCals: 1.1,
    perQtyProt: 0.015,
    perQtyCarbs: 0.22,
    perQtyFat: 0.025,
  },
  {
    aliases: ['barra de proteina', 'barra de proteína', 'barra proteica', 'barra de cereal'],
    name: 'Barra de Proteína',
    defaultQty: 1,
    unit: 'unid (40g)',
    perQtyCals: 160,
    perQtyProt: 15.0,
    perQtyCarbs: 13.0,
    perQtyFat: 5.0,
  },
  {
    aliases: ['chocolate', 'chocolate amargo', 'bombom'],
    name: 'Chocolate',
    defaultQty: 25,
    unit: 'g',
    perQtyCals: 5.4,
    perQtyProt: 0.07,
    perQtyCarbs: 0.55,
    perQtyFat: 0.32,
  },
  {
    aliases: ['castanha', 'castanhas', 'nozes', 'amendoas', 'amêndoas'],
    name: 'Castanhas & Oleaginosas',
    defaultQty: 30,
    unit: 'g',
    perQtyCals: 6.0,
    perQtyProt: 0.15,
    perQtyCarbs: 0.14,
    perQtyFat: 0.55,
  },
];

/**
 * Normalizes spoken Portuguese numbers into digits
 * e.g. "dois ovos" -> "2 ovos", "meio litro de agua" -> "500ml de agua"
 */
function normalizeSpokenPortuguese(str: string): string {
  return str
    .toLowerCase()
    .replace(/\bmeio litro\b/gi, '500ml')
    .replace(/\bum litro\b/gi, '1000ml')
    .replace(/\bdois litros\b/gi, '2000ml')
    .replace(/\buma garrafa\b/gi, '500ml')
    .replace(/\bduas garrafas\b/gi, '1000ml')
    .replace(/\bum copo\b/gi, '250ml')
    .replace(/\bdois copos\b/gi, '500ml')
    .replace(/\btrês copos\b/gi, '750ml')
    .replace(/\btres copos\b/gi, '750ml')
    .replace(/\bquatro copos\b/gi, '1000ml')
    .replace(/\buma colher\b/gi, '1 colher')
    .replace(/\bduas colheres\b/gi, '2 colheres')
    .replace(/\btrês colheres\b/gi, '3 colheres')
    .replace(/\bum\b/gi, '1')
    .replace(/\buma\b/gi, '1')
    .replace(/\bdois\b/gi, '2')
    .replace(/\bduas\b/gi, '2')
    .replace(/\btrês\b/gi, '3')
    .replace(/\btres\b/gi, '3')
    .replace(/\bquatro\b/gi, '4')
    .replace(/\bcinco\b/gi, '5')
    .replace(/\bseis\b/gi, '6')
    .replace(/\bsete\b/gi, '7')
    .replace(/\boito\b/gi, '8')
    .replace(/\bnove\b/gi, '9')
    .replace(/\bdez\b/gi, '10')
    .replace(/\bcem\b/gi, '100')
    .replace(/\bduzentos\b/gi, '200')
    .replace(/\bduzentas\b/gi, '200')
    .replace(/\btrezentos\b/gi, '300')
    .replace(/\btrezentas\b/gi, '300')
    .replace(/\bquatrocentos\b/gi, '400')
    .replace(/\bquinhentos\b/gi, '500');
}

/**
 * Intelligent deterministic voice command parser for NutriMacro.
 * Executes seamlessly to directly register meals and handle app actions.
 */
export function parseVoiceCommandLocally(
  transcript: string,
  userContext: any
): VoiceCommandResponse {
  const text = transcript.trim();
  const lower = normalizeSpokenPortuguese(text);

  // 1. WATER LOGGING
  if (
    lower.includes('água') ||
    lower.includes('agua') ||
    lower.includes('copo de agua') ||
    lower.includes('garrafa de agua') ||
    lower.includes('hidratação') ||
    lower.includes('hidratacao')
  ) {
    let amount = 250;
    const mlMatch = lower.match(/(\d+)\s*(ml|mililitros)/);
    const copoMatch = lower.match(/(\d+)\s*(copo|copos)/);
    const garrafaMatch = lower.match(/(\d+)\s*(garrafa|garrafas)/);
    const litroMatch = lower.match(/(\d+(\.\d+)?)\s*(litro|litros|l\b)/);

    if (mlMatch) {
      amount = parseInt(mlMatch[1], 10);
    } else if (copoMatch) {
      amount = parseInt(copoMatch[1], 10) * 250;
    } else if (garrafaMatch) {
      amount = parseInt(garrafaMatch[1], 10) * 500;
    } else if (litroMatch) {
      amount = Math.round(parseFloat(litroMatch[1]) * 1000);
    } else {
      const genericNum = lower.match(/\b(\d+)\b/);
      if (genericNum) {
        const val = parseInt(genericNum[1], 10);
        amount = val > 50 ? val : val * 250;
      }
    }

    // Sanity limit: max 3000ml per single log
    amount = Math.min(Math.max(amount, 50), 3000);

    return {
      spokenReply: `Registrado com sucesso! Adicionei ${amount} mililitros de água no seu diário de hoje. Continue hidratado!`,
      displayText: `✅ **+${amount}ml de água registrados com sucesso no seu diário!**\n💧 Total de hidratação atualizado.`,
      intent: 'log_water',
      action: {
        type: 'log_water',
        waterAmountMl: amount,
      },
    };
  }

  // 2. NAVIGATION COMMANDS
  if (
    lower.includes('câmera') ||
    lower.includes('camera') ||
    lower.includes('foto') ||
    lower.includes('fotografar') ||
    lower.includes('tirar foto')
  ) {
    return {
      spokenReply: 'Abrindo a câmera para você fotografar sua refeição agora.',
      displayText: 'Abrindo a **Câmera Inteligente** para análise visual.',
      intent: 'navigate',
      action: {
        type: 'navigate',
        targetPage: 'camera',
      },
    };
  }

  if (
    lower.includes('evolução') ||
    lower.includes('evolucao') ||
    lower.includes('progresso') ||
    lower.includes('medidas') ||
    lower.includes('peso corporal')
  ) {
    return {
      spokenReply: 'Abrindo a tela de evolução corporal e medidas.',
      displayText: 'Navegando para a página de **Evolução Corporal**.',
      intent: 'navigate',
      action: {
        type: 'navigate',
        targetPage: 'progress',
      },
    };
  }

  if (
    lower.includes('histórico') ||
    lower.includes('historico') ||
    lower.includes('gráficos') ||
    lower.includes('graficos')
  ) {
    return {
      spokenReply: 'Exibindo seu histórico de refeições e gráficos nutricionais.',
      displayText: 'Navegando para a página de **Histórico & Metas**.',
      intent: 'navigate',
      action: {
        type: 'navigate',
        targetPage: 'history',
      },
    };
  }

  if (
    lower.includes('início') ||
    lower.includes('inicio') ||
    lower.includes('diário') ||
    lower.includes('diario') ||
    lower.includes('hoje') ||
    lower.includes('voltar') ||
    lower.includes('home')
  ) {
    return {
      spokenReply: 'Voltando para a tela principal do seu diário de hoje.',
      displayText: 'Navegando para **Diário & Hoje**.',
      intent: 'navigate',
      action: {
        type: 'navigate',
        targetPage: 'home',
      },
    };
  }

  if (
    lower.includes('configurações') ||
    lower.includes('configuracoes') ||
    lower.includes('ajustes') ||
    lower.includes('perfil') ||
    lower.includes('minha conta')
  ) {
    return {
      spokenReply: 'Abrindo suas configurações e dados de perfil.',
      displayText: 'Navegando para **Configurações & Perfil**.',
      intent: 'navigate',
      action: {
        type: 'navigate',
        targetPage: 'settings',
      },
    };
  }

  if (
    lower.includes('coach') ||
    lower.includes('assistente') ||
    lower.includes('conversa com ia')
  ) {
    return {
      spokenReply: 'Abrindo o Assistente NutriMacro AI Coach.',
      displayText: 'Navegando para **Assistente IA Coach**.',
      intent: 'navigate',
      action: {
        type: 'navigate',
        targetPage: 'assistant',
      },
    };
  }

  // 3. STATS & MACRO QUERIES
  if (
    lower.includes('quanto consumi') ||
    lower.includes('quantas calorias') ||
    lower.includes('quanto de proteina') ||
    lower.includes('quanto de proteína') ||
    lower.includes('meus macros') ||
    lower.includes('minhas metas') ||
    lower.includes('quanto falta') ||
    lower.includes('balanço') ||
    lower.includes('balanco')
  ) {
    const calConsumed = Math.round(userContext?.todayTotals?.calories ?? userContext?.dailyTotals?.calories ?? 0);
    const calTarget = Math.round(userContext?.dailyTargets?.calories ?? userContext?.targets?.calories ?? 2400);
    const protConsumed = Math.round(userContext?.todayTotals?.protein ?? userContext?.dailyTotals?.protein ?? 0);
    const protTarget = Math.round(userContext?.dailyTargets?.protein ?? userContext?.targets?.protein ?? 160);
    const calRemaining = calTarget - calConsumed;
    const protRemaining = protTarget - protConsumed;

    const spokenReply = `Hoje você consumiu ${calConsumed} calorias de uma meta de ${calTarget}. Em proteínas, foram ${protConsumed} gramas de ${protTarget}. ${
      protRemaining > 0
        ? `Ainda faltam ${protRemaining} gramas de proteína para fechar sua meta.`
        : 'Sua meta de proteína já foi batida com sucesso!'
    }`;

    const displayText = `**Balanço do Dia:**\n- 🔥 **Calorias:** ${calConsumed} / ${calTarget} kcal (${calRemaining > 0 ? `Restam ${calRemaining} kcal` : 'Meta atingida'})\n- 🥩 **Proteínas:** ${protConsumed}g / ${protTarget}g (${protRemaining > 0 ? `Faltam ${protRemaining}g` : 'Meta superada'})\n- 💧 **Água:** ${userContext?.waterIntakeMl || 0} ml`;

    return {
      spokenReply,
      displayText,
      intent: 'query_stats',
      action: { type: 'none' },
    };
  }

  // 4. MEAL & FOOD LOGGING DETECTION
  let mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper' | 'other' = 'lunch';
  let mealName = 'Almoço';

  if (
    lower.includes('café da manhã') ||
    lower.includes('cafe da manha') ||
    lower.includes('desjejum') ||
    lower.includes('manhã') ||
    lower.includes('manha')
  ) {
    mealType = 'breakfast';
    mealName = 'Café da Manhã';
  } else if (
    lower.includes('jantar') ||
    lower.includes('janta') ||
    lower.includes('jantei') ||
    lower.includes('noite')
  ) {
    mealType = 'dinner';
    mealName = 'Jantar';
  } else if (
    lower.includes('lanche') ||
    lower.includes('lanchei') ||
    lower.includes('merenda') ||
    lower.includes('tarde')
  ) {
    mealType = 'snack';
    mealName = 'Lanche';
  } else if (lower.includes('ceia')) {
    mealType = 'supper';
    mealName = 'Ceia';
  } else if (
    lower.includes('almoço') ||
    lower.includes('almoco') ||
    lower.includes('almocei')
  ) {
    mealType = 'lunch';
    mealName = 'Almoço';
  } else {
    // Infer based on current hour
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      mealType = 'breakfast';
      mealName = 'Café da Manhã';
    } else if (hour >= 11 && hour < 15) {
      mealType = 'lunch';
      mealName = 'Almoço';
    } else if (hour >= 15 && hour < 19) {
      mealType = 'snack';
      mealName = 'Lanche da Tarde';
    } else if (hour >= 19 && hour < 23) {
      mealType = 'dinner';
      mealName = 'Jantar';
    } else {
      mealType = 'supper';
      mealName = 'Ceia';
    }
  }

  // Pre-process text for food matching to prevent meal labels like "café da manhã" from falsely matching "café"
  let textForFoodMatching = lower
    .replace(/(no|do|para o|no meu|no nosso|de|em)?\s*(caf[eé]\s+da\s+manh[aã]|desjejum)/gi, ' ')
    .replace(/(no|do|para o|no meu|de|em)?\s*(almo[cç]o)/gi, ' ')
    .replace(/(no|do|para o|no meu|de|em)?\s*(jantar|janta)/gi, ' ')
    .replace(/(no|do|para o|no meu|de|em)?\s*(lanche|merenda)/gi, ' ')
    .replace(/(na|da|para a|na minha|de|em)?\s*(ceia)/gi, ' ')
    .replace(/(almocei|jantei|lanchei)/gi, ' ');

  // Detect food items from database
  const detectedItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }> = [];

  for (const food of FOOD_DATABASE) {
    // Sort aliases by length descending so longer compound terms match first (e.g. "pão integral" before "pão")
    const sortedAliases = [...food.aliases].sort((a, b) => b.length - a.length);

    for (const alias of sortedAliases) {
      const aliasIndex = textForFoodMatching.indexOf(alias);
      if (aliasIndex !== -1) {
        // Look for preceding quantity, e.g. "2 ovos", "150g de frango", "1 banana", "2 colheres de azeite"
        const beforeText = textForFoodMatching.slice(Math.max(0, aliasIndex - 25), aliasIndex);
        const qtyMatch = beforeText.match(/(\d+)\s*(g|gramas|gr|ml|scoop|scoops|fatia|fatias|unid|unidades|copo|copos|colher|colheres|xícara|xicaras)?\s*(de)?\s*$/i);

        let qty = food.defaultQty;
        if (qtyMatch) {
          const parsed = parseInt(qtyMatch[1], 10);
          if (parsed > 0 && parsed < 2500) {
            qty = parsed;
          }
        }

        // Calculate macros
        let cals = 0;
        let prot = 0;
        let carbs = 0;
        let fat = 0;

        if (food.unit === 'g' || food.unit === 'ml') {
          cals = Math.round(food.perQtyCals * qty);
          prot = Math.round(food.perQtyProt * qty * 10) / 10;
          carbs = Math.round(food.perQtyCarbs * qty * 10) / 10;
          fat = Math.round(food.perQtyFat * qty * 10) / 10;
        } else {
          cals = Math.round(food.perQtyCals * qty);
          prot = Math.round(food.perQtyProt * qty * 10) / 10;
          carbs = Math.round(food.perQtyCarbs * qty * 10) / 10;
          fat = Math.round(food.perQtyFat * qty * 10) / 10;
        }

        detectedItems.push({
          name: food.name,
          quantity: qty,
          unit: food.unit,
          calories: cals,
          protein: prot,
          carbs,
          fat,
        });

        // Mask the matched alias in textForFoodMatching so sub-aliases don't duplicate
        textForFoodMatching =
          textForFoodMatching.slice(0, aliasIndex) +
          ' '.repeat(alias.length) +
          textForFoodMatching.slice(aliasIndex + alias.length);

        // Avoid adding duplicate variations of the same food
        break;
      }
    }
  }

  // Check if transcript has food logging intentions
  const isExplicitLogCommand =
    lower.includes('registre') ||
    lower.includes('registrar') ||
    lower.includes('comi') ||
    lower.includes('adicione') ||
    lower.includes('adicionar') ||
    lower.includes('coloque') ||
    lower.includes('salve') ||
    lower.includes('salvar') ||
    lower.includes('anote') ||
    lower.includes('cadastre') ||
    lower.includes('tomei') ||
    lower.includes('ingeri') ||
    lower.includes('almocei') ||
    lower.includes('jantei') ||
    lower.includes('lanchei');

  if (detectedItems.length > 0 || isExplicitLogCommand) {
    // If no specific item was found in the database but user asked to log food
    if (detectedItems.length === 0) {
      // Try to clean up command words to get a custom food name
      const cleanFoodName = text
        .replace(/\b(registre|registrar|adicione|adicionar|coloque|salve|salvar|comi|tomei|bebi|ingeri|almocei|jantei|lanchei|no café da manhã|no cafe da manha|no almoço|no almoco|no lanche|no jantar|na ceia|hoje|por favor)\b/gi, '')
        .trim();

      detectedItems.push({
        name: cleanFoodName.length > 2 ? cleanFoodName.charAt(0).toUpperCase() + cleanFoodName.slice(1) : 'Refeição Personalizada',
        quantity: 1,
        unit: 'porção',
        calories: 320,
        protein: 22,
        carbs: 35,
        fat: 10,
      });
    }

    const totalCals = detectedItems.reduce((acc, it) => acc + it.calories, 0);
    const totalProt = Math.round(detectedItems.reduce((acc, it) => acc + it.protein, 0));

    const itemsSummary = detectedItems
      .map((it) => `${it.quantity} ${it.unit} de ${it.name}`)
      .join(' e ');

    const payload = {
      mealType,
      mealName,
      items: detectedItems,
    };

    return {
      spokenReply: `Registrado com sucesso! Adicionei ${itemsSummary} no seu ${mealName}, somando ${totalCals} calorias e ${totalProt} gramas de proteína.`,
      displayText: `✅ **Refeição registrada com sucesso no seu Diário!**\n\n**${mealName}**\n${detectedItems
        .map((it) => `- **${it.name}** (${it.quantity} ${it.unit}): **${it.calories} kcal** | ${it.protein}g Proteína | ${it.carbs}g Carboidrato | ${it.fat}g Gordura`)
        .join('\n')}\n\n🔥 **Total:** ${totalCals} kcal | 🥩 **Proteína:** ${totalProt}g\n*Você pode ver no seu diário de hoje ou desfazer a qualquer momento.*`,
      intent: 'log_meal',
      action: {
        type: 'log_meal_direct',
        mealData: payload,
        mealProposal: payload,
      },
    };
  }

  // 5. GENERAL COACHING / CONVERSATIONAL ADVICE
  const userName = userContext?.userName || 'Atleta';
  return {
    spokenReply: `Olá, ${userName}! Estou pronto para registrar tudo para você. Pode dizer por exemplo: Registre 2 ovos e 1 tapioca no café da manhã, ou bebi 500ml de água.`,
    displayText: `Olá, **${userName}**! Estou pronto para registrar seus alimentos e água por voz.\n\nExperimente dizer:\n- *"Registre 2 ovos e 1 tapioca no café da manhã"*\n- *"Comi 150g de frango e arroz no almoço"*\n- *"Bebi 500ml de água"*\n- *"Quanto comi de calorias e proteína hoje?"*\n- *"Abra a câmera para fotografar meu prato"*`,
    intent: 'general_advice',
    action: { type: 'none' },
  };
}

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  ru: `Ты AI Советник BizBox - помощник по выбору готовых бизнесов.

ТВОЯ ЗАДАЧА:
1. Определить есть ли у клиента уже бизнес
2. Узнать среднюю выручку в месяц
3. Выяснить бюджет для инвестирования
4. Понять главную боль в текущем бизнесе
5. Определить когда готов начать

ВЫД: (после анализа)
- READINESS_SCORE: 0-100 (готовность к новому бизнесу)
- STAGE: STARTUP | TRACTION | SCALING
- RECOMMENDED_PRODUCT: "cosmetics" | "healthcare" | "fintech"
- URGENCY: high | medium | low

СТИЛЬ: Дружелюбный, профессиональный, русский язык. Задавай вопросы последовательно. После 4-5 вопросов, рекомендуй продукт.`,

  uk: `Ти AI Радник BizBox - помічник з вибору готових бізнесів.

ТВОЯ ЗАДАЧА:
1. Визначити чи в клієнта вже є бізнес
2. Дізнатися про середній дохід на місяць
3. З'ясувати бюджет для інвестування
4. Зрозуміти головний біль у поточному бізнесі
5. Визначити коли готов почати

ВИСНОВОК: (після аналізу)
- READINESS_SCORE: 0-100
- STAGE: STARTUP | TRACTION | SCALING
- RECOMMENDED_PRODUCT: "cosmetics" | "healthcare" | "fintech"
- URGENCY: high | medium | low

СТИЛЬ: Дружелюбний, професійний, українська мова.`,

  en: `You are an AI Advisor for BizBox - helping clients choose ready-made businesses.

YOUR TASK:
1. Determine if they have an existing business
2. Learn about monthly revenue
3. Understand their investment budget
4. Identify main pain points
5. Determine when they want to start

OUTPUT: (after analysis)
- READINESS_SCORE: 0-100
- STAGE: STARTUP | TRACTION | SCALING
- RECOMMENDED_PRODUCT: "cosmetics" | "healthcare" | "fintech"
- URGENCY: high | medium | low

STYLE: Friendly, professional, English language.`,

  es: `Eres un Asesor AI para BizBox - ayudando a clientes a elegir negocios listos.

TU TAREA:
1. Determinar si tienen un negocio existente
2. Conocer ingresos mensuales
3. Entender presupuesto de inversión
4. Identificar puntos de dolor principales
5. Determinar cuándo quieren comenzar

RESULTADO: (después del análisis)
- READINESS_SCORE: 0-100
- STAGE: STARTUP | TRACTION | SCALING
- RECOMMENDED_PRODUCT: "cosmetics" | "healthcare" | "fintech"
- URGENCY: high | medium | low

ESTILO: Amable, profesional, español.`
};

async function aiChat(message, language = 'ru', history = []) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.ru;

    const messages = [...history, { role: 'user', content: message }];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });

    const reply = response.content[0].text;

    return {
      success: true,
      response: reply,
      history: [...messages, { role: 'assistant', content: reply }],
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    console.error('❌ AI Error:', error);
    return {
      success: false,
      error: error.message,
      response: 'Sorry, I encountered an error. Please try again.'
    };
  }
}

async function analyzeConversation(history, language = 'ru') {
  try {
    const analysisPrompt = `Analyze this conversation and extract:
1. READINESS_SCORE (0-100)
2. STAGE (STARTUP/TRACTION/SCALING)
3. RECOMMENDED_PRODUCT (cosmetics/healthcare/fintech)
4. URGENCY (high/medium/low)
5. BUDGET_RANGE

Conversation:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

Format: JSON`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: analysisPrompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {};
  } catch (error) {
    console.error('❌ Analysis Error:', error);
    return {};
  }
}

module.exports = {
  aiChat,
  analyzeConversation,
  SYSTEM_PROMPTS
};

export const summarizeResponseSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
  },
  required: ['summary'],
};

export const translateResponseSchema = {
  type: 'OBJECT',
  properties: {
    translatedText: { type: 'STRING' },
    detectedLanguage: { type: 'STRING' },
  },
  required: ['translatedText', 'detectedLanguage'],
};

export const analyzeResponseSchema = {
  type: 'OBJECT',
  properties: {
    analysis: { type: 'STRING' },
    suggestions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    severity: {
      type: 'STRING',
      enum: ['info', 'warning', 'error'],
    },
  },
  required: ['analysis', 'suggestions', 'severity'],
};

export const generateResponseSchema = {
  type: 'OBJECT',
  properties: {
    text: { type: 'STRING' },
  },
  required: ['text'],
};

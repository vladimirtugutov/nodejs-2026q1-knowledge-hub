export function buildTranslatePrompt(input: {
  title: string;
  content: string;
  targetLanguage: string;
  sourceLanguage?: string;
}): string {
  return `
You are an assistant for a Knowledge Hub API.
Translate the article content and return ONLY valid JSON.

JSON shape:
{
  "translatedText": "string",
  "detectedLanguage": "string"
}

Target language: ${input.targetLanguage}
Source language: ${input.sourceLanguage ?? 'auto-detect'}

Article title:
${input.title}

Article content:
${input.content}
`.trim();
}

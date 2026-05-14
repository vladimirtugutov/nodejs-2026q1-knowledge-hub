export function buildGeneratePrompt(input: {
  prompt: string;
  context: { role: 'user' | 'assistant'; text: string }[];
}): string {
  const history = input.context
    .map((item) => `${item.role.toUpperCase()}: ${item.text}`)
    .join('\n');

  return `
You are an assistant for the Knowledge Hub API.
Answer the user's request clearly and concisely.

Conversation context:
${history || 'No previous context'}

Current user prompt:
${input.prompt}
`.trim();
}

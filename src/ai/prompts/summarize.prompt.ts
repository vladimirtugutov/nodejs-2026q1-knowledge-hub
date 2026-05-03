import { SummaryLength } from '../dto/summarize-article.dto';

export function buildSummarizePrompt(input: {
  title: string;
  content: string;
  maxLength: SummaryLength;
}): string {
  return `
You are an assistant for a Knowledge Hub API.
Summarize the article and return ONLY valid JSON.

JSON shape:
{
  "summary": "string"
}

Summary length:
- short: 1-2 sentences
- medium: 1 short paragraph
- detailed: 2-3 short paragraphs

Requested length: ${input.maxLength}

Article title:
${input.title}

Article content:
${input.content}
`.trim();
}
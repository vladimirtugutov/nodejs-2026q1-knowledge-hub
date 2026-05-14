import { AnalyzeTask } from '../dto/analyze-article.dto';

export function buildAnalyzePrompt(input: {
  title: string;
  content: string;
  task: AnalyzeTask;
}): string {
  return `
You are an assistant for a Knowledge Hub API.
Analyze the article and return ONLY valid JSON.

JSON shape:
{
  "analysis": "string",
  "suggestions": ["string"],
  "severity": "info" | "warning" | "error"
}

Task: ${input.task}

Article title:
${input.title}

Article content:
${input.content}
`.trim();
}

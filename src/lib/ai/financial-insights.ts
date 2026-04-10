import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildFinancialInsightsPrompt,
  financialInsightsDeveloperPrompt,
  type FinancialInsightPromptContext,
} from "@/lib/ai/prompts/financial-insights";
import { appEnv } from "@/lib/env";
import { insightResponseSchema } from "@/lib/validations/finance";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return openaiClient;
}

export async function generateFinancialInsightsWithOpenAI(
  context: FinancialInsightPromptContext,
) {
  const client = getOpenAIClient();

  if (!client || !appEnv.hasOpenAI) {
    return null;
  }

  try {
    const response = await client.responses.parse({
      model: appEnv.openaiInsightsModel,
      input: [
        {
          role: "developer",
          content: financialInsightsDeveloperPrompt,
        },
        {
          role: "user",
          content: buildFinancialInsightsPrompt(context),
        },
      ],
      text: {
        format: zodTextFormat(insightResponseSchema, "financial_insights"),
      },
    });

    return response.output_parsed ?? null;
  } catch {
    return null;
  }
}

import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  buildMonthlyReportPrompt,
  monthlyReportDeveloperPrompt,
  type MonthlyReportPromptContext,
} from "@/lib/ai/prompts/monthly-report";
import { appEnv } from "@/lib/env";

const reportNarrativeSchema = z.object({
  highlights: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  narrative: z.string(),
});

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return openaiClient;
}

export async function generateMonthlyReportCopyWithOpenAI(
  context: MonthlyReportPromptContext,
) {
  const client = getOpenAIClient();

  if (!client || !appEnv.hasOpenAI) {
    return null;
  }

  try {
    const response = await client.responses.parse({
      model: appEnv.openaiReportModel,
      input: [
        {
          role: "developer",
          content: monthlyReportDeveloperPrompt,
        },
        {
          role: "user",
          content: buildMonthlyReportPrompt(context),
        },
      ],
      text: {
        format: zodTextFormat(reportNarrativeSchema, "monthly_report_copy"),
      },
    });

    return response.output_parsed ?? null;
  } catch {
    return null;
  }
}

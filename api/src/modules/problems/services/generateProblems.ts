import { generateJson, isLlmConfigured, LlmError } from "../../ai/llmClient.ts";
import { buildProblemTextPrompt, problemTextResponseSchema } from "../../ai/promptsAdapter.ts";
import type { ProblemSource } from "../constants.ts";
import type { IProblem } from "../db/definitions/problem.ts";
import {
  check,
  generateTemplate,
  randomParams,
  solve,
  type Difficulty,
  type ProblemKind,
  type ProblemText,
} from "../engineAdapter.ts";

export interface GenerateProblemsInput {
  topicId: string;
  kind: ProblemKind;
  count: number;
  difficulty: Difficulty;
  useAi: boolean;
}

export interface GeneratedProblems {
  problems: IProblem[];
  usedAi: boolean;
  notice: string | null;
}

// AI hints are unchecked text until check() runs, so not a 3-tuple yet.
interface Wording {
  statement: string;
  hints: string[];
  source: ProblemSource;
}

// One batched call for all items; any failure falls back to the code
// templates so generation never depends on the model being up.
const rewordWithAi = async (
  kind: ProblemKind,
  difficulty: Difficulty,
  templates: ProblemText[],
): Promise<{ wordings: Wording[]; notice: string | null }> => {
  const fallback = (notice: string) => ({
    wordings: templates.map((template) => ({ ...template, source: "template" as const })),
    notice,
  });

  if (!isLlmConfigured()) {
    return fallback("AI түлхүүр тохируулаагүй тул загвараар үүсгэлээ");
  }

  try {
    const { problems } = await generateJson(
      buildProblemTextPrompt({
        kind,
        difficulty,
        items: templates.map((template, index) => ({ index: index + 1, template })),
      }),
      problemTextResponseSchema,
    );
    let missing = 0;
    const wordings = templates.map((template, index): Wording => {
      const ai = problems.find((problem) => problem.index === index + 1);

      if (!ai) {
        missing++;

        return { ...template, source: "template" };
      }

      return { statement: ai.statement, hints: ai.hints, source: "gemma" };
    });

    return {
      wordings,
      notice: missing ? `Gemma ${missing} бодлогыг алгассан тул тэдгээрийг загвараар бичлээ` : null,
    };
  } catch (error) {
    return fallback(
      `${error instanceof LlmError ? error.message : "AI алдаа гарлаа"} — загвараар үүсгэлээ`,
    );
  }
};

// Params and answers always come from the engine; wording (template or
// Gemma) only passes when the deterministic check accepts it.
export const generateProblems = async ({
  topicId,
  kind,
  count,
  difficulty,
  useAi,
}: GenerateProblemsInput): Promise<GeneratedProblems> => {
  const seeds = Array.from({ length: count }, () => {
    const params = randomParams(kind, difficulty);

    return { params, answer: solve(kind, params), template: generateTemplate(kind, difficulty, params) };
  });
  const { wordings, notice } = useAi
    ? await rewordWithAi(
        kind,
        difficulty,
        seeds.map(({ template }) => template),
      )
    : {
        wordings: seeds.map(({ template }): Wording => ({ ...template, source: "template" })),
        notice: null,
      };

  const problems = seeds.map(({ params, answer, template }, index): IProblem => {
    const wording: Wording = wordings[index] ?? { ...template, source: "template" };
    const verification = check({
      kind,
      params,
      statement: wording.statement,
      answer,
      hints: wording.hints,
    });

    return {
      topicId,
      kind,
      difficulty,
      params,
      statement: wording.statement,
      answer,
      hints: wording.hints,
      status: verification.ok ? "draft" : "rejected",
      verification: verification.ok ? { ok: true } : { ok: false, reason: verification.reason },
      source: wording.source,
    };
  });

  return {
    problems,
    usedAi: wordings.some((wording) => wording.source === "gemma"),
    notice,
  };
};

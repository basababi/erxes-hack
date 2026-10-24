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

interface Wording {
  statement: string;
  hints: string[];
  source: ProblemSource;
}

// One batched call for all items. An unavailable model or malformed batch
// falls back completely; missing individual items fall back independently.
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
    const byIndex = new Map<number, (typeof problems)[number]>();

    for (const problem of problems) {
      if (!byIndex.has(problem.index)) byIndex.set(problem.index, problem);
    }

    let missing = 0;
    const wordings = templates.map((template, index): Wording => {
      const ai = byIndex.get(index + 1);

      if (!ai) {
        missing++;

        return { ...template, source: "template" };
      }

      return { statement: ai.statement, hints: ai.hints, source: "gemma" };
    });

    return {
      wordings,
      notice: missing ? `Gemma ${missing} бодлогыг алгассан тул загвараар нөхлөө` : null,
    };
  } catch (error) {
    return fallback(
      `${error instanceof LlmError ? error.message : "AI алдаа гарлаа"} — загвараар үүсгэлээ`,
    );
  }
};

export const generateProblems = async ({
  topicId,
  kind,
  count,
  difficulty,
  useAi,
}: GenerateProblemsInput): Promise<GeneratedProblems> => {
  const seeds = Array.from({ length: count }, () => {
    const params = randomParams(kind, difficulty);

    return {
      params,
      answer: solve(kind, params),
      template: generateTemplate(kind, difficulty, params),
    };
  });
  const generated = useAi
    ? await rewordWithAi(
        kind,
        difficulty,
        seeds.map(({ template }) => template),
      )
    : {
        wordings: seeds.map(({ template }): Wording => ({ ...template, source: "template" })),
        notice: null,
      };
  let invalidAi = 0;

  const problems = seeds.map(({ params, answer, template }, index): IProblem => {
    let wording: Wording = generated.wordings[index] ?? { ...template, source: "template" };
    let verification = check({
      kind,
      params,
      statement: wording.statement,
      answer,
      hints: wording.hints,
    });

    // Invalid model text never becomes broken teacher data. Keep the
    // deterministic template for this one item and report the fallback.
    if (!verification.ok && wording.source === "gemma") {
      invalidAi++;
      wording = { ...template, source: "template" };
      verification = check({
        kind,
        params,
        statement: wording.statement,
        answer,
        hints: wording.hints,
      });
    }

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
  const notices = [
    generated.notice,
    invalidAi ? `Шалгагч Gemma-ийн ${invalidAi} найруулгыг зогсоож, загвараар сольсон` : null,
  ].filter((notice): notice is string => Boolean(notice));

  return {
    problems,
    usedAi: problems.some((problem) => problem.source === "gemma"),
    notice: notices.length ? notices.join(". ") : null,
  };
};

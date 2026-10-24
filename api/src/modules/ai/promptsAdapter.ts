import { z } from "zod";
import type { Difficulty, ProblemKind, ProblemText } from "../problems/engineAdapter.ts";

// Temporary stand-in for ./prompts (owned by another developer). Re-export
// from there once it is merged; callers only use the names below.

export interface ProblemTextPromptItem {
  index: number;
  template: ProblemText;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "хялбар",
  medium: "дунд",
  hard: "хэцүү",
};

// The model only rewords: params, the equation and the answer come from code,
// and the model is never told the answer.
export const buildProblemTextPrompt = ({
  kind,
  difficulty,
  items,
}: {
  kind: ProblemKind;
  difficulty: Difficulty;
  items: ProblemTextPromptItem[];
}) =>
  [
    "You help a Mongolian math teacher. Rewrite each problem below for a student in clear, friendly Mongolian.",
    `Topic kind: ${kind}. Difficulty: ${DIFFICULTY_LABELS[difficulty]}.`,
    "Rules:",
    '- Keep the equation exactly as given, written with digits (for example "3x + 5 = 20"). You may add one short real-life sentence around it.',
    "- Never solve the problem and never write the value of x, not even in the hints.",
    "- Write exactly 3 hints, from a gentle nudge to a concrete last step. The 3rd hint may show the last operation but not its result.",
    '- Reply with JSON only: {"problems":[{"index":1,"statement":"...","hints":["...","...","..."]}]}',
    "",
    "Problems:",
    ...items.map(
      ({ index, template }) =>
        `${index}. ${template.statement}\n   Template hints: ${template.hints.join(" | ")}`,
    ),
  ].join("\n");

export const problemTextResponseSchema = z.object({
  problems: z.array(
    z.object({
      index: z.number().int(),
      statement: z.string().trim().min(1).max(600),
      hints: z.array(z.string().trim().max(300)),
    }),
  ),
});

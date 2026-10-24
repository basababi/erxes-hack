import { z } from "zod";
import type { Difficulty, ProblemKind, ProblemText } from "../problems/engineAdapter.ts";

export interface ProblemTextPromptItem {
  index: number;
  template: ProblemText;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "хялбар",
  medium: "дунд",
  hard: "хэцүү",
};

const KIND_LABELS: Record<ProblemKind, string> = {
  linear_equation: "шугаман тэгшитгэл",
  percent_of: "тооны хувь олох",
  fraction_add: "бутархай нэмэх",
};

// The model only rewords. Parameters and answers stay in the deterministic
// engine, and the answer is never included in this prompt.
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
    `Topic: ${KIND_LABELS[kind]}. Difficulty: ${DIFFICULTY_LABELS[difficulty]}.`,
    "Rules:",
    "- Preserve every number, fraction, percent sign, variable and mathematical operator exactly. Do not change what is being asked.",
    "- Never solve the problem or reveal its final answer, including in a hint.",
    "- Write exactly 3 non-empty hints, from a gentle nudge to a concrete final operation. Leave that operation unevaluated.",
    "- Keep each statement under 600 characters and each hint under 300 characters.",
    '- Reply with JSON only: {"problems":[{"index":1,"statement":"...","hints":["...","...","..."]}]}',
    "",
    "Problems:",
    ...items.map(
      ({ index, template }) =>
        `${index}. ${template.statement}\n   Template hints: ${template.hints.join(" | ")}`,
    ),
  ].join("\n");

export const problemTextResponseSchema = z.object({
  problems: z
    .array(
      z.object({
        index: z.number().int().positive(),
        statement: z.string().trim().min(10).max(600),
        hints: z.array(z.string().trim().min(1).max(300)).length(3),
      }),
    )
    .max(5),
});

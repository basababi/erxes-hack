import type { IProblem } from "../../problems/db/definitions/problem.ts";
import { MAX_HINTS } from "../constants.ts";

type SolvableProblem = Pick<IProblem, "kind" | "params" | "answer">;

const number = (params: IProblem["params"], key: string) => {
  const value = params[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid problem parameter: ${key}`);
  }

  return value;
};

const gcd = (left: number, right: number): number => {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b) [a, b] = [b, a % b];

  return a || 1;
};

const formatSigned = (value: number) =>
  value < 0 ? `− ${Math.abs(value)}` : `+ ${value}`;

export const workedSolution = (problem: SolvableProblem) => {
  const { kind, params, answer } = problem;

  if (kind === "linear_equation") {
    const a = number(params, "a");
    const b = number(params, "b");
    const c = number(params, "c");
    const difference = c - b;

    return {
      answer,
      steps: [
        `${a}x ${formatSigned(b)} = ${c}`,
        `${a}x = ${c} ${b < 0 ? "+" : "−"} ${Math.abs(b)} = ${difference}`,
        `x = ${difference} ÷ ${a} = ${answer}`,
      ],
    };

  }

  if (kind === "percent_of") {
    const whole = number(params, "whole");
    const percent = number(params, "percent");

    return {
      answer,
      steps: [
        `${percent}% = ${percent} ÷ 100 = ${percent / 100}`,
        `${whole} × ${percent / 100} = ${answer}`,
      ],
    };
  }

  const leftNumerator = number(params, "leftNumerator");
  const leftDenominator = number(params, "leftDenominator");
  const rightNumerator = number(params, "rightNumerator");
  const rightDenominator = number(params, "rightDenominator");
  const commonDenominator =
    (leftDenominator * rightDenominator) / gcd(leftDenominator, rightDenominator);
  const scaledLeft = leftNumerator * (commonDenominator / leftDenominator);
  const scaledRight = rightNumerator * (commonDenominator / rightDenominator);

  return {
    answer,
    steps: [
      `Ерөнхий хуваарь: ${commonDenominator}`,
      `${leftNumerator}/${leftDenominator} = ${scaledLeft}/${commonDenominator}, ${rightNumerator}/${rightDenominator} = ${scaledRight}/${commonDenominator}`,
      `${scaledLeft}/${commonDenominator} + ${scaledRight}/${commonDenominator} = ${scaledLeft + scaledRight}/${commonDenominator} = ${answer}`,
    ],
  };
};

export const revealedSolution = (
  problem: SolvableProblem,
  hintsUsed: number,
  correct: boolean,
) => (hintsUsed >= MAX_HINTS && !correct ? workedSolution(problem) : null);

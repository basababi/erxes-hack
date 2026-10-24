import * as integrated from "./engine/index.ts";
import * as stable from "./engineStub.ts";

export type {
  CheckInput,
  CheckResult,
  Difficulty,
  Misconception,
  Params,
  ProblemKind,
  ProblemText,
} from "./engineStub.ts";

import type {
  CheckInput,
  CheckResult,
  Difficulty,
  Params,
  ProblemKind,
} from "./engineStub.ts";

// GraphQL and persisted problems use descriptive string difficulties and
// parameter names. The independently developed engine uses numeric levels and
// short mathematical names, so this file is the compatibility boundary.
const ENGINE_DIFFICULTY: Record<Difficulty, integrated.Difficulty> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const numberFrom = (...values: unknown[]) => {
  const value = values.find((candidate) => typeof candidate === "number");

  return typeof value === "number" ? value : Number.NaN;
};

const toEngineParams = (kind: ProblemKind, params: Params): integrated.Params => {
  if (kind === "linear_equation") {
    return {
      a: numberFrom(params.a),
      b: numberFrom(params.b),
      c: numberFrom(params.c),
    };
  }

  if (kind === "percent_of") {
    return {
      n: numberFrom(params.whole, params.n),
      p: numberFrom(params.percent, params.p),
    };
  }

  return {
    a: numberFrom(params.leftNumerator, params.a),
    b: numberFrom(params.leftDenominator, params.b),
    c: numberFrom(params.rightNumerator, params.c),
    d: numberFrom(params.rightDenominator, params.d),
  };
};

const fromEngineParams = (kind: ProblemKind, params: integrated.Params): Params => {
  if (kind === "linear_equation") {
    return { a: numberFrom(params.a), b: numberFrom(params.b), c: numberFrom(params.c) };
  }

  if (kind === "percent_of") {
    return { whole: numberFrom(params.n), percent: numberFrom(params.p) };
  }

  return {
    leftNumerator: numberFrom(params.a),
    leftDenominator: numberFrom(params.b),
    rightNumerator: numberFrom(params.c),
    rightDenominator: numberFrom(params.d),
  };
};

export const MISCONCEPTIONS = stable.MISCONCEPTIONS;

export const randomParams = (
  kind: ProblemKind,
  difficulty: Difficulty,
  random: () => number = Math.random,
): Params => {
  // Seeded callers rely on deterministic output. The integrated engine uses
  // Math.random internally, so retain the stable generator for those tests.
  if (random !== Math.random) return stable.randomParams(kind, difficulty, random);

  // The stable checker also prevents an input number that happens to equal the
  // answer from being mistaken for an answer leak in the displayed statement.
  for (let attempt = 0; attempt < 200; attempt++) {
    const params = fromEngineParams(
      kind,
      integrated.randomParams(kind, ENGINE_DIFFICULTY[difficulty]),
    );
    const answer = integrated.solve(kind, toEngineParams(kind, params));
    const template = stable.generateTemplate(kind, difficulty, params);

    if (stable.check({ kind, params, answer, ...template }).ok) return params;
  }

  return stable.randomParams(kind, difficulty, random);
};

export const solve = (kind: ProblemKind, params: Params) =>
  integrated.solve(kind, toEngineParams(kind, params));

export const isCorrect = (kind: ProblemKind, params: Params, answer: string) =>
  integrated.isCorrect(
    kind,
    toEngineParams(kind, params),
    answer.trim().replace(/^x\s*=\s*/i, ""),
  );

// Existing lesson chapters and attempts persist these stable misconception
// identifiers, so diagnosis remains on that contract.
export const diagnose = stable.diagnose;

export const generateTemplate = stable.generateTemplate;

export const check = (input: CheckInput): CheckResult => {
  // Preserve the stricter UI-facing rules (length, full expression, and answer
  // leakage in both statement and hints), then apply the integrated engine's
  // independent mathematical and parameter validation.
  const stableResult = stable.check(input);

  if (!stableResult.ok) return stableResult;

  return integrated.check({ ...input, params: toEngineParams(input.kind, input.params) });
};

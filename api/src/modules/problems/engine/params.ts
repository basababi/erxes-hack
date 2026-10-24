// Түвшин бүрт тохирох параметрийг санамсаргүйгээр сонгоно. Гол шаардлага:
// нэг буруу хариу хоёр өөр алдааны дүрэмд хамаарахгүй байх.

import { hasUniqueDiagnoses } from "./misconceptions.ts";
import { gcd, randomInt } from "./math.ts";
import type { Difficulty, Params, ProblemKind } from "./types.ts";
import { validateParams } from "./validate.ts";

const MAX_ATTEMPTS = 2_000;

function nonzeroBetween(min: number, max: number): number {
  let value = randomInt(min, max);
  while (value === 0) {
    value = randomInt(min, max);
  }
  return value;
}

function linearParams(difficulty: Difficulty): Params {
  const ranges: Record<Difficulty, { aMin: number; aMax: number; xMin: number; xMax: number; bMin: number; bMax: number }> = {
    1: { aMin: 2, aMax: 5, xMin: 1, xMax: 6, bMin: 1, bMax: 10 },
    2: { aMin: 2, aMax: 9, xMin: -10, xMax: 10, bMin: -20, bMax: 20 },
    3: { aMin: 3, aMax: 12, xMin: -15, xMax: 15, bMin: -40, bMax: 40 },
  };
  const range = ranges[difficulty];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const a = randomInt(range.aMin, range.aMax);
    const x = nonzeroBetween(range.xMin, range.xMax);
    const b = nonzeroBetween(range.bMin, range.bMax);
    const c = a * x + b;
    const params: Params = { a, b, c, x };

    if (c === 0) {
      continue;
    }
    if (validateParams("linear_equation", params).ok && hasUniqueDiagnoses("linear_equation", params)) {
      return params;
    }
  }

  throw new Error("linear_equation-д тохирох параметр олдсонгүй.");
}

function percentParams(difficulty: Difficulty): Params {
  const pools: Record<Difficulty, readonly number[]> = {
    1: [5, 20, 25, 50],
    2: [5, 15, 20, 25, 40, 50, 60, 75, 80],
    3: [5, 12, 15, 20, 25, 35, 40, 45, 50, 60, 65, 75, 80, 90],
  };
  const multiples: Record<Difficulty, { min: number; max: number }> = {
    1: { min: 2, max: 20 },
    2: { min: 4, max: 40 },
    3: { min: 6, max: 80 },
  };
  const pool = pools[difficulty];
  const multiple = multiples[difficulty];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const p = pool[randomInt(0, pool.length - 1)];
    if (p === undefined) {
      continue;
    }

    // n * p нь 50-д хуваагдахын тулд n-ийг 50/gcd(p, 50)-ийн үржвэрээр сонгоно.
    const step = 50 / gcd(p, 50);
    const n = step * randomInt(multiple.min, multiple.max);
    const params: Params = { n, p };

    if (validateParams("percent_of", params).ok && hasUniqueDiagnoses("percent_of", params)) {
      return params;
    }
  }

  throw new Error("percent_of-д тохирох параметр олдсонгүй.");
}

function fractionParams(difficulty: Difficulty): Params {
  const maxDenominators: Record<Difficulty, number> = { 1: 6, 2: 9, 3: 12 };
  const maxDenominator = maxDenominators[difficulty];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const b = randomInt(2, maxDenominator);
    const d = randomInt(2, maxDenominator);
    if (b === d) {
      // Ижил хуваагчтай үед "same_denominator" дүрэм зөв хариутай давхцана.
      continue;
    }

    const a = randomInt(1, b - 1);
    const c = randomInt(1, d - 1);
    const params: Params = { a, b, c, d };

    if (validateParams("fraction_add", params).ok && hasUniqueDiagnoses("fraction_add", params)) {
      return params;
    }
  }

  throw new Error("fraction_add-д тохирох параметр олдсонгүй.");
}

export function randomParams(kind: ProblemKind, difficulty: Difficulty): Params {
  if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) {
    throw new Error("Түвшин 1, 2 эсвэл 3 байх ёстой.");
  }

  switch (kind) {
    case "linear_equation":
      return linearParams(difficulty);
    case "percent_of":
      return percentParams(difficulty);
    case "fraction_add":
      return fractionParams(difficulty);
  }
}

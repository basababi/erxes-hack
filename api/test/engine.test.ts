import assert from "node:assert/strict";
import test from "node:test";
import {
  check,
  diagnose,
  generateTemplate,
  isCorrect,
  randomParams,
  solve,
  type Difficulty,
  type ProblemKind,
} from "../src/modules/problems/engineAdapter.ts";

const kinds: ProblemKind[] = ["linear_equation", "percent_of", "fraction_add"];
const difficulties: Difficulty[] = ["easy", "medium", "hard"];

const seededRandom = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
};

test("every topic kind generates verifiable templates at every difficulty", () => {
  const random = seededRandom(42);

  for (const kind of kinds) {
    for (const difficulty of difficulties) {
      for (let index = 0; index < 100; index++) {
        const params = randomParams(kind, difficulty, random);
        const answer = solve(kind, params);
        const template = generateTemplate(kind, difficulty, params);

        assert.equal(isCorrect(kind, params, answer), true, `${kind}/${difficulty}: ${answer}`);
        assert.deepEqual(
          check({ kind, params, answer, ...template }),
          { ok: true },
          `${kind}/${difficulty}: ${template.statement}`,
        );
      }
    }
  }
});

test("equivalent numeric answer formats are accepted", () => {
  assert.equal(isCorrect("linear_equation", { a: 3, b: 2, c: 14 }, "x = 4"), true);
  assert.equal(isCorrect("percent_of", { percent: 25, whole: 80 }, "20,0"), true);
  assert.equal(
    isCorrect(
      "fraction_add",
      { leftNumerator: 1, leftDenominator: 4, rightNumerator: 1, rightDenominator: 2 },
      "0.75",
    ),
    true,
  );
});

test("known wrong methods map to a specific misconception", () => {
  assert.equal(
    diagnose("linear_equation", { a: 3, b: 2, c: 14 }, "36")?.id,
    "linear_multiply_instead",
  );
  assert.equal(diagnose("percent_of", { percent: 25, whole: 80 }, "60")?.id, "percent_remainder");
  assert.equal(
    diagnose(
      "fraction_add",
      { leftNumerator: 1, leftDenominator: 2, rightNumerator: 1, rightDenominator: 3 },
      "2/5",
    )?.id,
    "fraction_add_both",
  );
});

test("the deterministic checker blocks leaked answers and altered expressions", () => {
  const params = { percent: 25, whole: 80 };
  const template = generateTemplate("percent_of", "easy", params);

  assert.equal(
    check({
      kind: "percent_of",
      params,
      answer: "20",
      statement: `${template.statement} Ð¥Ð°Ñ€Ð¸Ñƒ 20.`,
      hints: template.hints,
    }).ok,
    false,
  );
  assert.equal(
    check({
      kind: "percent_of",
      params,
      answer: "20",
      statement: "90 Ñ‚Ð¾Ð¾Ð½Ñ‹ 25%-Ð¸Ð¹Ð³ Ð¾Ð».",
      hints: template.hints,
    }).ok,
    false,
  );
});

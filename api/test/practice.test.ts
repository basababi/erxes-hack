import assert from "node:assert/strict";
import test from "node:test";
import type { IAttemptItem } from "../src/modules/practice/db/definitions/attempt.ts";
import {
  calculatePracticeSummary,
  calculatePracticeXp,
  practiceBadges,
  selectPracticeProblemIds,
} from "../src/modules/practice/services/practice.ts";

const fixedRandom = () => 0.5;

test("practice selection prefers up to sixty percent weak items without duplicates", () => {
  const selected = selectPracticeProblemIds(
    ["a", "b", "c", "d", "e", "f", "g"],
    ["a", "b", "c", "missing", "a"],
    5,
    fixedRandom,
  );

  assert.equal(selected.length, 5);
  assert.equal(new Set(selected).size, 5);
  assert.equal(selected.filter((id) => ["a", "b", "c"].includes(id)).length, 3);
});

test("practice selection refuses an undersized approved pool", () => {
  assert.deepEqual(selectPracticeProblemIds(["a", "b"], [], 5, fixedRandom), []);
});

test("summary rewards first-try work and applies bounded hint penalties", () => {
  const items: IAttemptItem[] = [
    { problemId: "a", answer: "1", correct: true, firstTry: true, hintsUsed: 0 },
    { problemId: "b", answer: "2", correct: true, firstTry: false, hintsUsed: 2 },
    { problemId: "c", answer: "3", correct: false, firstTry: false, hintsUsed: 3 },
  ];

  assert.deepEqual(calculatePracticeSummary(items), {
    correctCount: 2,
    total: 3,
    score: 67,
    mastery: 55,
  });
});

test("practice XP rewards completion, correctness, and first-try answers without hint penalties", () => {
  const items: IAttemptItem[] = [
    { problemId: "a", answer: "1", correct: true, firstTry: true, hintsUsed: 2 },
    { problemId: "b", answer: "2", correct: true, firstTry: false, hintsUsed: 3 },
    { problemId: "c", answer: "3", correct: false, firstTry: false, hintsUsed: 1 },
    { problemId: "d", hintsUsed: 0 },
  ];

  assert.equal(calculatePracticeXp(items), 27);
  assert.deepEqual(practiceBadges(149), [
    { id: "xp_50", title: "Эхний алхам", description: "50 XP цуглууллаа" },
  ]);
  assert.equal(practiceBadges(150).length, 2);
  assert.deepEqual(
    practiceBadges(0, [
      {
        problemId: "sign",
        answer: "x=2",
        correct: true,
        firstTry: false,
        misconception: "linear_sign_flip",
        hintsUsed: 1,
      },
    ]),
    [
      {
        id: "sign_mistake_winner",
        title: "Тэмдгийн алдааг ялагч",
        description: "Тэмдгийн алдаагаа засаж бодлоо",
      },
    ],
  );
});

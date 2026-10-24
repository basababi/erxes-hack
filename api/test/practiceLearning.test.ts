import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackPracticeFeedback,
  generatePracticeFeedback,
} from "../src/modules/practice/services/feedback.ts";
import { revealedSolution, workedSolution } from "../src/modules/practice/services/solution.ts";

const linearProblem = {
  kind: "linear_equation" as const,
  params: { a: 4, b: -6, c: 14 },
  answer: "5",
};

test("worked solution explains a linear equation in ordered steps", () => {
  assert.deepEqual(workedSolution(linearProblem), {
    answer: "5",
    steps: ["4x − 6 = 14", "4x = 14 + 6 = 20", "x = 20 ÷ 4 = 5"],
  });
});

test("worked answer is withheld until all hints are used and while the student can solve it", () => {
  assert.equal(revealedSolution(linearProblem, 2, false), null);
  assert.equal(revealedSolution(linearProblem, 3, true), null);
  assert.deepEqual(revealedSolution(linearProblem, 3, false), workedSolution(linearProblem));
});

test("worked solution shows percentage and fraction calculations", () => {
  assert.deepEqual(
    workedSolution({
      kind: "percent_of",
      params: { whole: 80, percent: 25 },
      answer: "20",
    }).steps,
    ["25% = 25 ÷ 100 = 0.25", "80 × 0.25 = 20"],
  );
  assert.deepEqual(
    workedSolution({
      kind: "fraction_add",
      params: { leftNumerator: 1, leftDenominator: 3, rightNumerator: 1, rightDenominator: 6 },
      answer: "1/2",
    }).steps,
    ["Ерөнхий хуваарь: 6", "1/3 = 2/6, 1/6 = 1/6", "2/6 + 1/6 = 3/6 = 1/2"],
  );
});

test("fallback topic feedback names strong and weak topics from measured scores", () => {
  assert.deepEqual(
    fallbackPracticeFeedback(
      [
        { name: "Тэгшитгэл", attempts: 2, averageScore: 90 },
        { name: "Хувь олох", attempts: 1, averageScore: 40 },
      ],
      "AI unavailable",
    ),
    {
      strengths: ["Тэгшитгэл — 90%"],
      needsPractice: ["Хувь олох — 40%"],
      recommendation: "Хувь олох сэдвээр дахин дадлага хийгээд, алдсан алхмаа тайлбарлаж үзээрэй.",
      parentAdvice:
        "Хувь олох сэдвээр өдөрт 10 минут хамт бодож, хариунаас илүү ямар алхам сонгосныг нь асуугаарай.",
      careerGuidance: [
        {
          title: "Өгөгдөл ба тоон сэтгэлгээ",
          rationale:
            "Тэгшитгэл сэдвийн 90% дундаж нь тоон мэдээлэлтэй ажиллах чиглэлийг сонирхон судлах эхлэл байж болно. Энэ нь авьяасын үнэлгээ биш.",
          tryNext:
            "Өдөр тутмын нэг жижиг мэдээллийг хүснэгт эсвэл графикаар үзүүлж, юуг анзаарснаа ярилцаарай.",
        },
      ],
      generatedByAi: false,
      notice: "AI unavailable",
    },
  );
});

test("Gemma guidance is accepted only when its classifications and career rationale match progress", async () => {
  const originalKey = process.env.EDUTUTOR_LLM_API_KEY;
  const originalModel = process.env.EDUTUTOR_LLM_MODEL;
  const originalFetch = globalThis.fetch;
  process.env.EDUTUTOR_LLM_API_KEY = "test-key";
  process.env.EDUTUTOR_LLM_MODEL = "test-model";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    strengths: ["Тэгшитгэл — тогтвортой ахицтай"],
                    needsPractice: ["Хувь олох — дахин давтаарай"],
                    recommendation: "Хувь олох нэг дасгал дахин бод.",
                    parentAdvice: "Алхам бүрийг нь тайлбарлуулахад туслаарай.",
                    careerGuidance: [
                      {
                        title: "Өгөгдөл шинжлэх",
                        rationale: "Тэгшитгэл сэдвийн ахиц нь тоон мэдээллийг судлахтай холбоотой.",
                        tryNext: "Энгийн өгөгдлийг графикаар дүрслээрэй.",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const feedback = await generatePracticeFeedback([
      { name: "Тэгшитгэл", attempts: 2, averageScore: 90 },
      { name: "Хувь олох", attempts: 1, averageScore: 40 },
    ]);

    assert.equal(feedback.generatedByAi, true);
    assert.equal(feedback.parentAdvice, "Алхам бүрийг нь тайлбарлуулахад туслаарай.");
    assert.equal(feedback.careerGuidance[0]?.title, "Өгөгдөл шинжлэх");

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      strengths: ["Тэгшитгэл — тогтвортой ахицтай"],
                      needsPractice: ["Хувь олох — дахин давтаарай"],
                      recommendation: "Хувь олох нэг дасгал дахин бод.",
                      parentAdvice: "Ахицад нь урам өгөөрэй.",
                      careerGuidance: [
                        {
                          title: "Өгөгдөл шинжлэх",
                          rationale: "Сурагч энэ чиглэлд төрөлхийн авьяастай.",
                          tryNext: "Өгөгдлийг судлаарай.",
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const rejected = await generatePracticeFeedback([
      { name: "Тэгшитгэл", attempts: 2, averageScore: 90 },
      { name: "Хувь олох", attempts: 1, averageScore: 40 },
    ]);

    assert.equal(rejected.generatedByAi, false);
    assert.match(rejected.notice ?? "", /ангиллыг баталгаажуулж чадсангүй/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.EDUTUTOR_LLM_API_KEY;
    else process.env.EDUTUTOR_LLM_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.EDUTUTOR_LLM_MODEL;
    else process.env.EDUTUTOR_LLM_MODEL = originalModel;
  }
});

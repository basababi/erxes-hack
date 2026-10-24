import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MISCONCEPTIONS,
  check,
  diagnose,
  generateTemplate,
  isCorrect,
  randomParams,
  solve,
} from "../index.ts";
import type { Difficulty, Params, ProblemKind } from "../index.ts";

function num(params: Params, key: string): number {
  const value = params[key];
  if (typeof value !== "number") {
    throw new Error(`Тестэд "${key}" параметр дутуу байна.`);
  }
  return value;
}

type WrongAnswer = readonly [code: string, answer: string];

function wrongAnswers(kind: ProblemKind, params: Params): WrongAnswer[] {
  switch (kind) {
    case "linear_equation": {
      const a = num(params, "a");
      const b = num(params, "b");
      const c = num(params, "c");
      return [
        ["b_added", String((c + b) / a)],
        ["forgot_divide", String(c - b)],
        ["sign_error", String(-(c - b) / a)],
      ];
    }
    case "percent_of": {
      const n = num(params, "n");
      const p = num(params, "p");
      return [
        ["no_divide_100", String(p * n)],
        ["inverted", String(n / p)],
        ["divided_by_p", String((n * 100) / p)],
      ];
    }
    case "fraction_add": {
      const a = num(params, "a");
      const b = num(params, "b");
      const c = num(params, "c");
      const d = num(params, "d");
      return [
        ["add_across", `${a + c}/${b + d}`],
        ["same_denominator", `${a + c}/${b}`],
        ["multiplied", `${a * c}/${b * d}`],
      ];
    }
  }
}

describe("solve", () => {
  it("linear_equation-ийг бүхэл шийдээр бодно", () => {
    assert.equal(solve("linear_equation", { a: 2, b: 4, c: 14, x: 5 }), "5");
    assert.equal(solve("linear_equation", { a: 5, b: -3, c: 12 }), "3");
  });

  it("a = 1, b = 0, x = 0, c = 0 зэрэг захын утгыг хүлээнэ", () => {
    assert.equal(solve("linear_equation", { a: 1, b: 4, c: 14, x: 10 }), "10");
    assert.equal(solve("linear_equation", { a: 3, b: 0, c: 12 }), "4");
    assert.equal(solve("linear_equation", { a: 3, b: 0, c: 0 }), "0");
    assert.equal(solve("linear_equation", { a: 2, b: 3, c: 3 }), "0");
  });

  it("бүхэл бус шийдтэй тэгшитгэлийг ч бодно", () => {
    assert.equal(solve("linear_equation", { a: 2, b: 1, c: 4 }), "1.5");
  });

  it("percent_of-ийн хариуг бүхэл эсвэл .5 хэлбэрээр буцаана", () => {
    assert.equal(solve("percent_of", { n: 200, p: 25 }), "50");
    assert.equal(solve("percent_of", { n: 50, p: 15 }), "7.5");
    assert.equal(solve("percent_of", { n: 1, p: 50 }), "0.5");
  });

  it("10%, 100% болон тэг нийт тоог хүлээнэ", () => {
    assert.equal(solve("percent_of", { n: 200, p: 10 }), "20");
    assert.equal(solve("percent_of", { n: 37, p: 100 }), "37");
    assert.equal(solve("percent_of", { n: 0, p: 25 }), "0");
    assert.equal(solve("percent_of", { n: 4, p: 3 }), "0.12");
  });

  it("fraction_add-ийн хариуг хураангуйлна", () => {
    assert.equal(solve("fraction_add", { a: 1, b: 2, c: 1, d: 3 }), "5/6");
    assert.equal(solve("fraction_add", { a: 1, b: 2, c: 1, d: 2 }), "1");
    assert.equal(solve("fraction_add", { a: 2, b: 3, c: 1, d: 6 }), "5/6");
  });

  it("зөв бус бутархай, тэг хүртэгчийг хүлээнэ", () => {
    assert.equal(solve("fraction_add", { a: 3, b: 2, c: 1, d: 2 }), "2");
    assert.equal(solve("fraction_add", { a: 0, b: 3, c: 1, d: 6 }), "1/6");
    assert.equal(solve("fraction_add", { a: -1, b: 2, c: 1, d: 3 }), "-1/6");
  });

  it("мужаас гарсан параметрийг татгалзана", () => {
    assert.throws(() => solve("linear_equation", { a: 0, b: 4, c: 14 }), /a нь/);
    assert.throws(() => solve("percent_of", { n: 10, p: 0 }), /p нь/);
    assert.throws(() => solve("fraction_add", { a: 1, b: 0, c: 1, d: 3 }), /b нь/);
    assert.throws(() => solve("linear_equation", { a: 1.5, b: 4, c: 14 }), /a нь/);
    assert.throws(() => solve("fraction_add", { a: 1, b: 2, c: 1 }), /d нь/);
  });
});

describe("isCorrect", () => {
  const linear = { a: 2, b: 4, c: 14, x: 5 };

  it("бүхэл ба аравтын тэнцүү хэлбэрийг хүлээнэ", () => {
    for (const answer of ["5", "5.0", " 5 ", "5,0", "10/2"]) {
      assert.equal(isCorrect("linear_equation", linear, answer), true, answer);
    }
  });

  it("бутархайн тэнцүү хэлбэрийг хүлээнэ", () => {
    const half = { a: 1, b: 4, c: 1, d: 4 };
    assert.equal(isCorrect("fraction_add", half, "2/4"), true);
    assert.equal(isCorrect("fraction_add", half, "0.5"), true);
    assert.equal(isCorrect("fraction_add", half, "0,5"), true);
  });

  it("0,5 ба 0.5-ыг ижил гэж үзнэ", () => {
    const halfPercent = { n: 1, p: 50 };
    assert.equal(isCorrect("percent_of", halfPercent, "0,5"), true);
    assert.equal(isCorrect("percent_of", halfPercent, "0.5"), true);
  });

  it("хоосон, тэмдэгт, тэг хуваагчтай хариуг татгалзана", () => {
    for (const answer of ["", "   ", "abc", "1/0", "5..0", "5/"]) {
      assert.equal(isCorrect("linear_equation", linear, answer), false, answer);
    }
  });
});

describe("diagnose", () => {
  it("linear_equation-ийн гурван алдааг ялгана", () => {
    const params = { a: 2, b: 4, c: 14 };
    assert.equal(diagnose("linear_equation", params, "9")?.code, "b_added");
    assert.equal(diagnose("linear_equation", params, "10")?.code, "forgot_divide");
    assert.equal(diagnose("linear_equation", params, "-5")?.code, "sign_error");
    assert.equal(diagnose("linear_equation", params, "5"), null);
  });

  it("percent_of-ийн гурван алдааг ялгана", () => {
    const params = { n: 200, p: 25 };
    assert.equal(diagnose("percent_of", params, "5000")?.code, "no_divide_100");
    assert.equal(diagnose("percent_of", params, "8")?.code, "inverted");
    assert.equal(diagnose("percent_of", params, "800")?.code, "divided_by_p");
    assert.equal(diagnose("percent_of", params, "50"), null);
  });

  it("fraction_add-ийн гурван алдааг ялгана", () => {
    const params = { a: 1, b: 2, c: 1, d: 3 };
    assert.equal(diagnose("fraction_add", params, "2/5")?.code, "add_across");
    assert.equal(diagnose("fraction_add", params, "1")?.code, "same_denominator");
    assert.equal(diagnose("fraction_add", params, "1/6")?.code, "multiplied");
    assert.equal(diagnose("fraction_add", params, "5/6"), null);
  });

  it("утгаараа тэнцэх бутархай ба аравтын хариуг оношлоно", () => {
    const params = { a: 1, b: 2, c: 1, d: 3 };
    assert.equal(diagnose("fraction_add", params, "0.4")?.code, "add_across");
    assert.equal(diagnose("fraction_add", params, "4/10")?.code, "add_across");
  });

  it("тоо биш хариу болон мужаас гарсан параметрт null буцаана", () => {
    assert.equal(diagnose("linear_equation", { a: 2, b: 4, c: 14 }, "abc"), null);
    assert.equal(diagnose("linear_equation", { a: 0, b: 4, c: 14 }, "5"), null);
  });

  it("алдааны сан яг шаардсан кодтой", () => {
    assert.deepEqual(
      MISCONCEPTIONS.linear_equation.map((item) => item.code),
      ["b_added", "forgot_divide", "sign_error"],
    );
    assert.deepEqual(
      MISCONCEPTIONS.percent_of.map((item) => item.code),
      ["no_divide_100", "inverted", "divided_by_p"],
    );
    assert.deepEqual(
      MISCONCEPTIONS.fraction_add.map((item) => item.code),
      ["add_across", "same_denominator", "multiplied"],
    );
    for (const items of Object.values(MISCONCEPTIONS)) {
      for (const item of items) {
        assert.ok(item.title.length > 0);
        assert.ok(item.message.length > 0);
      }
    }
  });
});

describe("check", () => {
  const valid = {
    kind: "linear_equation" as const,
    params: { a: 2, b: 4, c: 14, x: 5 },
    statement: "2x + (4) = 14",
    answer: "5",
    hints: ["тогтмолыг шилжүүл", "коэффициентэд хуваа", "анхны тэгшитгэлд шалга"],
  };

  it("зөв бодлогыг хүлээнэ", () => {
    assert.deepEqual(check(valid), { ok: true });
    assert.deepEqual(check({ ...valid, answer: "5.0" }), { ok: true });
  });

  it("хариу кодоор бодсон хариутай тохирохгүй бол татгалзана", () => {
    const result = check({ ...valid, answer: "6" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Хариу/);
    }
  });

  it("мужаас гарсан параметрийг татгалзана", () => {
    const result = check({ ...valid, params: { a: 0, b: 4, c: 14 } });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Параметр/);
    }
  });

  it("гурван сэжүүлэгчгүй бол татгалзана", () => {
    const result = check({ ...valid, hints: ["нэг", "хоёр"] });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /3/);
    }
  });

  it("сэжүүлэгчид зөв хариу орсон бол татгалзана", () => {
    const result = check({ ...valid, hints: ["хариу 5", "хоёр", "гурав"] });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Сэжүүлэгч/);
    }
  });

  it("утгаараа ижил бутархай хэлбэрээр хариу алдсан ч татгалзана", () => {
    const result = check({
      kind: "fraction_add",
      params: { a: 1, b: 4, c: 1, d: 4 },
      statement: "1/4 + 1/4",
      answer: "1/2",
      hints: ["2/4", "хоёр", "гурав"],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Сэжүүлэгч/);
    }
  });

  it("бодлогын текстэд параметрийн тоо байхгүй бол татгалзана", () => {
    const result = check({ ...valid, statement: "Энэ бодлого тоогүй байна." });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /тоо/);
    }
  });
});

describe("randomParams ба generateTemplate", () => {
  const kinds: readonly ProblemKind[] = [
    "linear_equation",
    "percent_of",
    "fraction_add",
  ];

  it("300 үүсгэсэн бодлого бүгд check-ийг давж, онош давхцахгүй", () => {
    for (const kind of kinds) {
      for (let index = 0; index < 100; index += 1) {
        const difficulty = ((index % 3) + 1) as Difficulty;
        const template = generateTemplate(kind, difficulty);

        // randomParams нь generateTemplate-ийн дотор ажилладаг; энд шууд
        // дуудаж, буцаасан параметрүүд нь дахин хүчинтэй эсэхийг батална.
        const params = randomParams(kind, difficulty);
        const direct = solve(kind, params);
        assert.equal(typeof direct, "string");

        assert.deepEqual(check({ kind, ...template }), { ok: true });
        assert.equal(template.answer, solve(kind, template.params));
        assert.equal(template.hints.length, 3);
        for (const hint of template.hints) {
          assert.equal(typeof hint, "string");
        }

        assert.equal(diagnose(kind, template.params, template.answer), null);

        const wrong = wrongAnswers(kind, template.params);
        const codes = wrong.map(([, answer]) => diagnose(kind, template.params, answer)?.code);
        assert.equal(new Set(codes).size, 3, `${kind}: ${codes.join(",")}`);
        for (const [code, answer] of wrong) {
          assert.equal(
            diagnose(kind, template.params, answer)?.code,
            code,
            `${kind} / ${code} / ${answer}`,
          );
        }
      }
    }
  });

  it("үүсгэсэн сэжүүлэгчид хариуны тоо агуулаагүй", () => {
    for (const kind of kinds) {
      const template = generateTemplate(kind, 2);
      const answerValue = template.answer;
      for (const hint of template.hints) {
        assert.equal(hint.includes(answerValue), false);
      }
    }
  });
});

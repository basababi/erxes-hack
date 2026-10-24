export type ProblemKind = "linear_equation" | "percent_of" | "fraction_add";

export type Difficulty = "easy" | "medium" | "hard";

export type Params = Record<string, number>;

export interface Misconception {
  id: string;
  kind: ProblemKind;
  title: string;
  message: string;
}

export interface ProblemText {
  statement: string;
  hints: [string, string, string];
}

export interface CheckInput {
  kind: ProblemKind;
  params: Params;
  statement: string;
  answer: string;
  hints: string[];
}

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

export const MISCONCEPTIONS: Misconception[] = [
  {
    id: "linear_sign_flip",
    kind: "linear_equation",
    title: "Шилжүүлэхэд тэмдэг солиогүй",
    message:
      "Гишүүнийг тэнцүүгийн нөгөө тал руу шилжүүлэхдээ тэмдгийг нь эсрэгээр соль: +b нь −b болно.",
  },
  {
    id: "linear_no_divide",
    kind: "linear_equation",
    title: "Коэффициентод хуваахаа мартсан",
    message: "ax = d болсны дараа x-ийг олохын тулд хоёр талыг a-д хуваах ёстой.",
  },
  {
    id: "linear_multiply_instead",
    kind: "linear_equation",
    title: "Хуваахын оронд үржүүлсэн",
    message: "ax = d тэгшитгэлд x = d ÷ a. a-аар үржүүлбэл x-ийн утга биш, өөр тоо гарна.",
  },
  {
    id: "linear_divide_first",
    kind: "linear_equation",
    title: "Хасахаас өмнө хуваасан",
    message: "Эхлээд x-гүй гишүүнийг шилжүүлж, дараа нь коэффициентод хуваа.",
  },
  {
    id: "percent_no_hundred",
    kind: "percent_of",
    title: "100-д хуваахаа мартсан",
    message: "Хувийг эхлээд 100-д хувааж, дараа нь өгөгдсөн тоогоор үржүүлнэ.",
  },
  {
    id: "percent_remainder",
    kind: "percent_of",
    title: "Үлдэх хувийг олсон",
    message: "Асуусан хувийг олно. 100%-аас хассан үлдэгдлийг бодох шаардлагагүй.",
  },
  {
    id: "percent_reversed",
    kind: "percent_of",
    title: "Харьцааг урвуулсан",
    message: "Өгөгдсөн тоог хувьд хуваахгүй; хувь ÷ 100 × тоо гэсэн дарааллаар бодно.",
  },
  {
    id: "fraction_add_both",
    kind: "fraction_add",
    title: "Хүртвэр, хуваарийг шууд нэмсэн",
    message: "Өөр хуваарьтай бутархайг шууд нэмэхгүй. Эхлээд ижил хуваарьтай болгоно.",
  },
  {
    id: "fraction_no_cross_scale",
    kind: "fraction_add",
    title: "Хүртвэрүүдийг ижил хэмжээгээр үржүүлээгүй",
    message: "Хуваарийг үржүүлэхдээ хүртвэр бүрийг нөгөө бутархайн хуваариар мөн үржүүлнэ.",
  },
  {
    id: "fraction_wrong_denominator",
    kind: "fraction_add",
    title: "Шинэ хуваарийг буруу сонгосон",
    message: "Нийлбэрийн хуваарь нь хоёр хуваарийн ерөнхий хуваагдагч байх ёстой.",
  },
];

const LINEAR_RANGES: Record<
  Difficulty,
  { a: [number, number]; x: [number, number]; b: [number, number] }
> = {
  easy: { a: [2, 5], x: [1, 10], b: [1, 10] },
  medium: { a: [2, 9], x: [-10, 10], b: [-20, 20] },
  hard: { a: [-12, 12], x: [-15, 15], b: [-50, 50] },
};

const PERCENT_VALUES: Record<Difficulty, readonly number[]> = {
  easy: [10, 20, 25, 50, 75],
  medium: [5, 10, 15, 20, 25, 30, 40, 60, 75],
  hard: [4, 5, 8, 12, 15, 18, 24, 35, 45, 60, 72],
};

const FRACTION_LIMITS: Record<Difficulty, { denominator: [number, number]; multiplier: number }> = {
  easy: { denominator: [2, 6], multiplier: 1 },
  medium: { denominator: [3, 10], multiplier: 1 },
  hard: { denominator: [4, 14], multiplier: 2 },
};

const pick = ([min, max]: [number, number], random: () => number, exclude: number[] = []) => {
  for (;;) {
    const value = min + Math.floor(random() * (max - min + 1));

    if (!exclude.includes(value)) return value;
  }
};

const pickFrom = <T>(values: readonly T[], random: () => number) =>
  values[Math.min(values.length - 1, Math.floor(random() * values.length))] as T;

const requiredNumber = (params: Params, name: string) => {
  const value = params[name];

  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid problem parameter: ${name}`);
  }

  return value;
};

const linear = (params: Params) => {
  const a = requiredNumber(params, "a");
  const b = requiredNumber(params, "b");
  const c = requiredNumber(params, "c");

  if (a === 0) throw new Error("linear_equation needs a non-zero coefficient");

  return { a, b, c };
};

const percent = (params: Params) => {
  const percentValue = requiredNumber(params, "percent");
  const whole = requiredNumber(params, "whole");

  if (percentValue <= 0 || percentValue >= 100 || whole <= 0) {
    throw new Error("percent_of needs 0 < percent < 100 and a positive whole");
  }

  return { percent: percentValue, whole };
};

const fraction = (params: Params) => {
  const leftNumerator = requiredNumber(params, "leftNumerator");
  const leftDenominator = requiredNumber(params, "leftDenominator");
  const rightNumerator = requiredNumber(params, "rightNumerator");
  const rightDenominator = requiredNumber(params, "rightDenominator");

  if (leftDenominator <= 0 || rightDenominator <= 0) {
    throw new Error("fraction_add needs positive denominators");
  }

  return { leftNumerator, leftDenominator, rightNumerator, rightDenominator };
};

const gcd = (left: number, right: number) => {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b) [a, b] = [b, a % b];

  return a || 1;
};

const fractionText = (numerator: number, denominator: number) => {
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator);
  const top = (sign * numerator) / divisor;
  const bottom = Math.abs(denominator) / divisor;

  return bottom === 1 ? String(top) : `${top}/${bottom}`;
};

const parseNumber = (value: string): number | null => {
  const normalized = value
    .trim()
    .replace(/^x\s*=\s*/i, "")
    .replace(/[−–]/g, "-")
    .replace(/,/g, ".")
    .replace(/\s+/g, "");
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?$/);

  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = match[2] === undefined ? 1 : Number(match[2]);

  return denominator === 0 ? null : numerator / denominator;
};

const sameNumber = (left: number, right: number) => Math.abs(left - right) < 1e-9;

const uniqueValues = (values: number[]) =>
  values.every(
    (value, index) =>
      Number.isFinite(value) && values.findIndex((other) => sameNumber(other, value)) === index,
  );

const clearDiagnosis = (correct: number, inputs: number[], wrongAnswers: number[]) =>
  uniqueValues([correct, ...wrongAnswers]) &&
  inputs.every((input) => !sameNumber(Math.abs(input), Math.abs(correct)));

const linearWrongAnswers = ({ a, b, c }: { a: number; b: number; c: number }) => ({
  linear_sign_flip: (c + b) / a,
  linear_no_divide: c - b,
  linear_multiply_instead: (c - b) * a,
  linear_divide_first: c / a - b,
});

const percentWrongAnswers = ({ percent: part, whole }: { percent: number; whole: number }) => ({
  percent_no_hundred: part * whole,
  percent_remainder: (whole * (100 - part)) / 100,
  percent_reversed: (whole / part) * 100,
});

const fractionWrongAnswers = ({
  leftNumerator: a,
  leftDenominator: b,
  rightNumerator: c,
  rightDenominator: d,
}: ReturnType<typeof fraction>) => ({
  fraction_add_both: (a + c) / (b + d),
  fraction_no_cross_scale: (a + c) / (b * d),
  fraction_wrong_denominator: (a * d + c * b) / (b + d),
});

const wrongAnswers = (kind: ProblemKind, params: Params): Record<string, number> => {
  if (kind === "linear_equation") return linearWrongAnswers(linear(params));
  if (kind === "percent_of") return percentWrongAnswers(percent(params));

  return fractionWrongAnswers(fraction(params));
};

const equationText = (params: Params) => {
  const { a, b, c } = linear(params);

  return `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${c}`;
};

const fractionExpression = (params: Params) => {
  const {
    leftNumerator: a,
    leftDenominator: b,
    rightNumerator: c,
    rightDenominator: d,
  } = fraction(params);

  return `${a}/${b} + ${c}/${d}`;
};

export const randomParams = (
  kind: ProblemKind,
  difficulty: Difficulty,
  random: () => number = Math.random,
): Params => {
  for (let attempt = 0; attempt < 2_000; attempt++) {
    if (kind === "linear_equation") {
      const range = LINEAR_RANGES[difficulty];
      const a = pick(range.a, random, [-1, 0, 1]);
      const x = pick(range.x, random, [0]);
      const b = pick(range.b, random, [0]);
      const params = { a, b, c: a * x + b };

      if (clearDiagnosis(x, Object.values(params), Object.values(linearWrongAnswers(params)))) {
        return params;
      }
    } else if (kind === "percent_of") {
      const part = pickFrom(PERCENT_VALUES[difficulty], random);
      const answerRange: [number, number] =
        difficulty === "easy" ? [1, 30] : difficulty === "medium" ? [2, 80] : [3, 180];
      const answer = pick(answerRange, random);
      const whole = (answer * 100) / part;

      if (!Number.isInteger(whole)) continue;

      const params = { percent: part, whole };
      const inputs = [part, whole, 100];

      if (clearDiagnosis(answer, inputs, Object.values(percentWrongAnswers(params)))) {
        return params;
      }
    } else {
      const range = FRACTION_LIMITS[difficulty];
      const leftDenominator = pick(range.denominator, random);
      const rightDenominator = pick(range.denominator, random, [leftDenominator]);
      const leftNumerator = pick([1, leftDenominator * range.multiplier], random);
      const rightNumerator = pick([1, rightDenominator * range.multiplier], random);
      const params = {
        leftNumerator,
        leftDenominator,
        rightNumerator,
        rightDenominator,
      };
      const correct = leftNumerator / leftDenominator + rightNumerator / rightDenominator;
      const inputs = [
        leftNumerator,
        leftDenominator,
        rightNumerator,
        rightDenominator,
        leftNumerator / leftDenominator,
        rightNumerator / rightDenominator,
      ];

      if (clearDiagnosis(correct, inputs, Object.values(fractionWrongAnswers(fraction(params))))) {
        return params;
      }
    }
  }

  throw new Error(`Unable to generate an unambiguous ${kind} problem`);
};

export const solve = (kind: ProblemKind, params: Params): string => {
  if (kind === "linear_equation") {
    const { a, b, c } = linear(params);

    return String((c - b) / a);
  }
  if (kind === "percent_of") {
    const { percent: part, whole } = percent(params);

    return String((part * whole) / 100);
  }

  const {
    leftNumerator: a,
    leftDenominator: b,
    rightNumerator: c,
    rightDenominator: d,
  } = fraction(params);

  return fractionText(a * d + c * b, b * d);
};

export const isCorrect = (kind: ProblemKind, params: Params, answer: string) => {
  const submitted = parseNumber(answer);
  const expected = parseNumber(solve(kind, params));

  return submitted !== null && expected !== null && sameNumber(submitted, expected);
};

export const diagnose = (
  kind: ProblemKind,
  params: Params,
  answer: string,
): Misconception | null => {
  const submitted = parseNumber(answer);

  if (submitted === null || isCorrect(kind, params, answer)) return null;

  const id = Object.entries(wrongAnswers(kind, params)).find(([, candidate]) =>
    sameNumber(candidate, submitted),
  )?.[0];

  return MISCONCEPTIONS.find((misconception) => misconception.id === id) ?? null;
};

export const generateTemplate = (
  kind: ProblemKind,
  _difficulty: Difficulty,
  params: Params,
): ProblemText => {
  if (kind === "linear_equation") {
    const { a, b, c } = linear(params);
    const bTerm = `${b < 0 ? "-" : "+"}${Math.abs(b)}`;

    return {
      statement: `Тэгшитгэлийг бод: ${equationText(params)}`,
      hints: [
        `Эхлээд x-гүй гишүүнийг (${bTerm}) тэнцүүгийн баруун тал руу шилжүүл, тэмдгийг нь эсрэгээр соль.`,
        `Одоо ${a}x = ${c - b} боллоо. x-ийг ганцааранг нь үлдээхийн тулд юу хийх вэ?`,
        `Хоёр талыг x-ийн коэффициентод хуваа: x = ${c - b} ÷ ${a}. Хуваалтаа өөрөө гүйцээ.`,
      ],
    };
  }
  if (kind === "percent_of") {
    const { percent: part, whole } = percent(params);

    return {
      statement: `${whole} тооны ${part}%-ийг ол.`,
      hints: [
        "Хувь гэдэг нь 100 хэсгээс хэдэн хэсгийг авч байгааг санаарай.",
        `${part}%-ийг 100-гийн бутархай болгоод өгөгдсөн тоогоор үржүүлнэ.`,
        `(${part} × ${whole}) ÷ 100 гэж бичээд үйлдлийг өөрөө гүйцээ.`,
      ],
    };
  }

  const {
    leftNumerator: a,
    leftDenominator: b,
    rightNumerator: c,
    rightDenominator: d,
  } = fraction(params);

  return {
    statement: `Бутархайг нэм: ${fractionExpression(params)}`,
    hints: [
      "Хоёр бутархайг ижил хуваарьтай болгосны дараа л хүртвэрүүдийг нэмнэ.",
      `${b} ба ${d}-ийн ерөнхий хуваарь олоод бутархай бүрийг түүнд шилжүүл.`,
      `${a}/${b}-ийн хүртвэрийг ${d}-оор, ${c}/${d}-ийн хүртвэрийг ${b}-ээр үржүүлээд нэм. Дараа нь хураа.`,
    ],
  };
};

const compact = (text: string) =>
  text
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "")
    .toLowerCase();

const valuesIn = (text: string) =>
  (text.replace(/[−–]/g, "-").match(/-?\d+(?:[.,]\d+)?(?:\s*\/\s*-?\d+(?:[.,]\d+)?)?/g) ?? [])
    .map(parseNumber)
    .filter((value): value is number => value !== null);

const includesValue = (text: string, expected: number) =>
  valuesIn(text).some((value) => sameNumber(value, expected));

const hasProblemExpression = (kind: ProblemKind, params: Params, statement: string) => {
  if (kind === "linear_equation") {
    return compact(statement).includes(compact(equationText(params)));
  }
  if (kind === "percent_of") {
    const { percent: part, whole } = percent(params);

    return compact(statement).includes(`${part}%`) && includesValue(statement, whole);
  }

  return compact(statement).includes(compact(fractionExpression(params)));
};

export const check = ({ kind, params, statement, answer, hints }: CheckInput): CheckResult => {
  const expected = parseNumber(solve(kind, params));
  const supplied = parseNumber(answer);

  if (expected === null || supplied === null || !sameNumber(expected, supplied)) {
    return { ok: false, reason: "Хариу параметрээс гарах утгатай таарахгүй байна" };
  }
  if (statement.trim().length < 10 || statement.length > 600) {
    return { ok: false, reason: "Нөхцөлийн урт 10–600 тэмдэгт байх ёстой" };
  }
  if (!hasProblemExpression(kind, params, statement)) {
    return { ok: false, reason: "Нөхцөлд бодлогын өгөгдөл, математик илэрхийлэл бүтнээрээ алга" };
  }
  if (includesValue(statement, expected)) {
    return { ok: false, reason: "Нөхцөл хариуг агуулж байна" };
  }
  if (hints.length !== 3 || hints.some((hint) => !hint.trim() || hint.length > 300)) {
    return { ok: false, reason: "1–300 тэмдэгттэй 3 шатны сэжүүр шаардлагатай" };
  }

  const leaking = hints.findIndex((hint) => includesValue(hint, expected));

  if (leaking !== -1) {
    return { ok: false, reason: `${leaking + 1}-р сэжүүр хариуг задалж байна` };
  }

  return { ok: true };
};

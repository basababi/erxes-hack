// Temporary stand-in for `./engine` (owned by another developer) until it is
// merged; reach it only through engineAdapter.ts. Implements linear_equation
// only (a·x + b = c with an integer root). Pure: no erxes-api-shared imports,
// because print-schema loads everything the resolvers import.

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
];

const RANGES: Record<Difficulty, { a: [number, number]; x: [number, number]; b: [number, number] }> =
  {
    easy: { a: [2, 5], x: [1, 10], b: [1, 10] },
    medium: { a: [2, 9], x: [-10, 10], b: [-20, 20] },
    hard: { a: [-12, 12], x: [-15, 15], b: [-50, 50] },
  };

const unsupported = (kind: ProblemKind) =>
  new Error(`Problem kind "${kind}" is not supported until the problem engine is merged`);

const pick = ([min, max]: [number, number], random: () => number, exclude: number[]) => {
  for (;;) {
    const value = min + Math.floor(random() * (max - min + 1));

    if (!exclude.includes(value)) return value;
  }
};

const linear = (params: Params) => {
  const { a, b, c } = params;

  if (a === undefined || b === undefined || c === undefined || a === 0) {
    throw new Error("linear_equation needs non-zero a and numeric b, c");
  }

  return { a, b, c };
};

const equationText = (params: Params) => {
  const { a, b, c } = linear(params);

  return `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${c}`;
};

// The wrong answer each misconception produces.
const misconceptionAnswers = ({ a, b, c }: { a: number; b: number; c: number }) => ({
  linear_sign_flip: (c + b) / a,
  linear_no_divide: c - b,
  linear_multiply_instead: (c - b) * a,
  linear_divide_first: c / a - b,
});

// Rejects params where a diagnosis would be ambiguous (two misconceptions,
// or one and the correct answer, give the same number) or where the answer
// equals a number in the problem, so any hint that contains it is a leak.
const isClear = (a: number, b: number, x: number) => {
  const c = a * x + b;
  const values = [x, ...Object.values(misconceptionAnswers({ a, b, c }))];
  const distinct = values.every(
    (value, index) => values.findIndex((other) => sameNumber(other, value)) === index,
  );

  return distinct && ![a, b, c].some((number) => Math.abs(number) === Math.abs(x));
};

export const randomParams = (
  kind: ProblemKind,
  difficulty: Difficulty,
  random: () => number = Math.random,
): Params => {
  if (kind !== "linear_equation") throw unsupported(kind);

  const range = RANGES[difficulty];

  for (;;) {
    const a = pick(range.a, random, [-1, 0, 1]);
    const x = pick(range.x, random, [0]);
    const b = pick(range.b, random, [0]);

    if (isClear(a, b, x)) return { a, b, c: a * x + b };
  }
};

export const solve = (kind: ProblemKind, params: Params): string => {
  if (kind !== "linear_equation") throw unsupported(kind);

  const { a, b, c } = linear(params);

  return String((c - b) / a);
};

const toNumber = (answer: string) => {
  const normalized = answer
    .trim()
    .replace(/^x\s*=\s*/i, "")
    .replace(/[−–]/g, "-")
    .replace(",", ".")
    .replace(/\s+/g, "");

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;

  return Number(normalized);
};

const sameNumber = (left: number, right: number) => Math.abs(left - right) < 1e-9;

export const isCorrect = (kind: ProblemKind, params: Params, answer: string) => {
  const value = toNumber(answer);

  return value !== null && sameNumber(value, Number(solve(kind, params)));
};

export const diagnose = (
  kind: ProblemKind,
  params: Params,
  answer: string,
): Misconception | null => {
  if (kind !== "linear_equation") throw unsupported(kind);

  const value = toNumber(answer);

  if (value === null || isCorrect(kind, params, answer)) return null;

  const id = Object.entries(misconceptionAnswers(linear(params))).find(([, candidate]) =>
    sameNumber(candidate, value),
  )?.[0];

  return MISCONCEPTIONS.find((misconception) => misconception.id === id) ?? null;
};

export const generateTemplate = (
  kind: ProblemKind,
  _difficulty: Difficulty,
  params: Params,
): ProblemText => {
  if (kind !== "linear_equation") throw unsupported(kind);

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
};

const numbersIn = (text: string) =>
  (text.replace(/[−–]/g, "-").match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

const compact = (text: string) => text.replace(/[−–]/g, "-").replace(/\s+/g, "").toLowerCase();

const statesAnswer = (text: string, answer: string) =>
  new RegExp(
    `x\\s*=\\s*${answer.replace(".", "\\.").replace("-", "[-−–]\\s*")}(?![\\d.,])`,
    "i",
  ).test(text);

// Deterministic gate for any wording (template or AI): the answer must follow
// from the params, the statement must carry the exact equation, and no text
// may give the answer away. randomParams keeps the answer out of a, b and c,
// so the answer's number appearing in a hint is always a leak.
export const check = ({ kind, params, statement, answer, hints }: CheckInput): CheckResult => {
  if (kind !== "linear_equation") throw unsupported(kind);

  if (answer !== solve(kind, params)) {
    return { ok: false, reason: "Хариу параметрээс гарах утгатай таарахгүй байна" };
  }
  if (statement.trim().length < 10 || statement.length > 600) {
    return { ok: false, reason: "Нөхцөлийн урт 10–600 тэмдэгт байх ёстой" };
  }
  if (!compact(statement).includes(compact(equationText(params)))) {
    return {
      ok: false,
      reason: `Нөхцөлд тэгшитгэл (${equationText(params)}) тоогоор, бүтнээрээ алга`,
    };
  }
  if (statesAnswer(statement, answer)) {
    return { ok: false, reason: "Нөхцөл хариуг агуулж байна" };
  }
  if (hints.length !== 3 || hints.some((hint) => !hint.trim() || hint.length > 300)) {
    return { ok: false, reason: "1–300 тэмдэгттэй 3 шатны сэжүүр шаардлагатай" };
  }

  const value = Number(answer);
  const leaking = hints.findIndex(
    (hint) =>
      statesAnswer(hint, answer) || numbersIn(hint).some((number) => sameNumber(number, value)),
  );

  if (leaking !== -1) {
    return { ok: false, reason: `${leaking + 1}-р сэжүүр хариуг задалж байна` };
  }

  return { ok: true };
};

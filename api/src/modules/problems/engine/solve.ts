// Бодолт, хариу шалгах, алдаа оношлох үндсэн функцууд.

import { MISCONCEPTIONS, correctValue, misconceptionValues } from "./misconceptions.ts";
import { formatFraction, formatNumber, nearlyEqual, parseNumericAnswer, readNumber } from "./math.ts";
import type { Misconception, Params, ProblemKind } from "./types.ts";
import { validateParams } from "./validate.ts";

/** Бодлогын зөв хариуг канон хэлбэрээр буцаана. */
export function solve(kind: ProblemKind, params: Params): string {
  const validation = validateParams(kind, params);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  switch (kind) {
    case "linear_equation": {
      const a = readNumber(params, "a");
      const b = readNumber(params, "b");
      const c = readNumber(params, "c");
      return String((c - b) / a);
    }
    case "percent_of": {
      const n = readNumber(params, "n");
      const p = readNumber(params, "p");
      return formatNumber((n * p) / 100);
    }
    case "fraction_add": {
      const a = readNumber(params, "a");
      const b = readNumber(params, "b");
      const c = readNumber(params, "c");
      const d = readNumber(params, "d");
      return formatFraction(a * d + c * b, b * d);
    }
  }
}

/**
 * Сурагчийн хариу зөв эсэх. "2/4" = "1/2", "5" = "5.0" = " 5 ",
 * "0,5" = "0.5" гэсэн утгын тэнцүү байдлыг хүлээнэ. Хоосон эсвэл
 * тоо биш хариу үргэлж false.
 */
export function isCorrect(kind: ProblemKind, params: Params, answer: string): boolean {
  if (!validateParams(kind, params).ok) {
    return false;
  }

  const parsed = parseNumericAnswer(answer);
  if (parsed === null) {
    return false;
  }

  const expected = parseNumericAnswer(solve(kind, params));
  return expected !== null && nearlyEqual(parsed, expected);
}

/**
 * Буруу хариунаас яг аль алдааны дүрэм гарсаныг олно. Зөв хариу, тоо биш
 * хариу, эсвэл хэд хэдэн дүрэмд нэгэн зэрэг тохирох хариу бол null.
 */
export function diagnose(
  kind: ProblemKind,
  params: Params,
  answer: string,
): Misconception | null {
  if (!validateParams(kind, params).ok) {
    return null;
  }

  const parsed = parseNumericAnswer(answer);
  if (parsed === null) {
    return null;
  }

  if (nearlyEqual(parsed, correctValue(kind, params))) {
    return null;
  }

  const matches = misconceptionValues(kind, params).filter((item) =>
    nearlyEqual(item.value, parsed),
  );
  if (matches.length !== 1) {
    return null;
  }

  const matched = matches[0];
  if (matched === undefined) {
    return null;
  }

  return MISCONCEPTIONS[kind].find((item) => item.code === matched.code) ?? null;
}

// Тооны жижиг туслах функцууд. Энд ямар ч гадаад сан ашиглахгүй: тест болон
// сервер хоёулаа ижил төгсгөлтэй үр дүн авахын тулд бүх тооцоо нэг дор.

import type { Params } from "./types.ts";

export function readNumber(params: Params, key: string): number {
  const value = params[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Параметр "${key}" нь төгсгөлтэй тоо байх ёстой.`);
  }
  return value;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function gcd(a: number, b: number): number {
  let left = Math.abs(a);
  let right = Math.abs(b);
  while (right !== 0) {
    const next = left % right;
    left = right;
    right = next;
  }
  return left;
}

/** Бутархайг хураангуйлж, хуваагчийг эерэг байлгана. */
export function formatFraction(numerator: number, denominator: number): string {
  if (denominator === 0) {
    throw new Error("Бутархайн хуваагч тэг байж болохгүй.");
  }

  let num = numerator;
  let den = denominator;
  if (den < 0) {
    num = -num;
    den = -den;
  }

  const divisor = gcd(num, den) || 1;
  num /= divisor;
  den /= divisor;

  return den === 1 ? String(num) : `${num}/${den}`;
}

/** Аравтын хэсгийг хэт урт бичихгүй, төгсгөлийн тэгийг хасна. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Хариу төгсгөлтэй тоо байх ёстой.");
  }
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return String(rounded);
}

/** Хөвөгч тооны алдааг үл харгалзан утгаараа тэнцүү эсэхийг шалгана. */
export function nearlyEqual(left: number, right: number): boolean {
  if (left === right) {
    return true;
  }
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 1e-9 * scale;
}

/**
 * Сурагчийн хариуг тоо болгоно. Дараах хэлбэрүүдийг хүлээнэ:
 * "5", "5.0", " 5 ", "0,5", "1/2", "-3/4".
 * Хоосон, тэмдэгт, тэг хуваагчтай бутархай бол null.
 */
export function parseNumericAnswer(raw: string): number | null {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.trim().replace(/[−–—]/g, "-").replace(/\s+/g, "");
  if (normalized === "") {
    return null;
  }

  const fraction = /^([+-]?\d+)\/([+-]?\d+)$/.exec(normalized);
  if (fraction !== null) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }
    return numerator / denominator;
  }

  // Зөвхөн бүхэл эсвэл аравтын бутархай; "5." болон "1.2.3" зэргийг алгасна.
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

const NUMBER_TOKEN_PATTERN = /-?\d+(?:[.,]\d+)?(?:\s*\/\s*-?\d+(?:[.,]\d+)?)?/g;

/**
 * Текстээс тоон утгуудыг ялгаж авна. Бутархай "1/2" бол 0.5, 1, 2 гэсэн
 * гурван утга буцаана: бодлогын текстэд 1 ба 2 гэсэн параметрүүд орсон эсэхийг
 * шалгах, сэжүүлэгчид хариу алдаагүй эсэхийг шалгах хоёуланд хэрэгтэй.
 */
export function numericTokens(text: string): number[] {
  const values: number[] = [];
  const normalized = text.replace(/[−–—]/g, "-");

  for (const match of normalized.matchAll(NUMBER_TOKEN_PATTERN)) {
    const token = match[0].replace(/\s+/g, "");
    if (token.includes("/")) {
      const [rawNumerator, rawDenominator] = token.split("/");
      const numerator = rawNumerator === undefined ? null : parseNumericAnswer(rawNumerator);
      const denominator = rawDenominator === undefined ? null : parseNumericAnswer(rawDenominator);
      if (numerator !== null && denominator !== null && denominator !== 0) {
        values.push(numerator / denominator, numerator, denominator);
      }
      continue;
    }

    const value = parseNumericAnswer(token);
    if (value !== null) {
      values.push(value);
    }
  }

  return values;
}

export function textContainsNumber(text: string, expected: number): boolean {
  return numericTokens(text).some((value) => nearlyEqual(value, expected));
}

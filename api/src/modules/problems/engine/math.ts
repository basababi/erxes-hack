// Ð¢Ð¾Ð¾Ð½Ñ‹ Ð¶Ð¸Ð¶Ð¸Ð³ Ñ‚ÑƒÑÐ»Ð°Ñ… Ñ„ÑƒÐ½ÐºÑ†ÑƒÑƒÐ´. Ð­Ð½Ð´ ÑÐ¼Ð°Ñ€ Ñ‡ Ð³Ð°Ð´Ð°Ð°Ð´ ÑÐ°Ð½ Ð°ÑˆÐ¸Ð³Ð»Ð°Ñ…Ð³Ò¯Ð¹: Ñ‚ÐµÑÑ‚ Ð±Ð¾Ð»Ð¾Ð½
// ÑÐµÑ€Ð²ÐµÑ€ Ñ…Ð¾Ñ‘ÑƒÐ»Ð°Ð° Ð¸Ð¶Ð¸Ð» Ñ‚Ó©Ð³ÑÐ³Ó©Ð»Ñ‚ÑÐ¹ Ò¯Ñ€ Ð´Ò¯Ð½ Ð°Ð²Ð°Ñ…Ñ‹Ð½ Ñ‚ÑƒÐ»Ð´ Ð±Ò¯Ñ… Ñ‚Ð¾Ð¾Ñ†Ð¾Ð¾ Ð½ÑÐ³ Ð´Ð¾Ñ€.

import type { Params } from "./types.ts";

export function readNumber(params: Params, key: string): number {
  const value = params[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`ÐŸÐ°Ñ€Ð°Ð¼ÐµÑ‚Ñ€ "${key}" Ð½ÑŒ Ñ‚Ó©Ð³ÑÐ³Ó©Ð»Ñ‚ÑÐ¹ Ñ‚Ð¾Ð¾ Ð±Ð°Ð¹Ñ… Ñ‘ÑÑ‚Ð¾Ð¹.`);
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

/** Ð‘ÑƒÑ‚Ð°Ñ€Ñ…Ð°Ð¹Ð³ Ñ…ÑƒÑ€Ð°Ð°Ð½Ð³ÑƒÐ¹Ð»Ð¶, Ñ…ÑƒÐ²Ð°Ð°Ð³Ñ‡Ð¸Ð¹Ð³ ÑÐµÑ€ÑÐ³ Ð±Ð°Ð¹Ð»Ð³Ð°Ð½Ð°. */
export function formatFraction(numerator: number, denominator: number): string {
  if (denominator === 0) {
    throw new Error("Ð‘ÑƒÑ‚Ð°Ñ€Ñ…Ð°Ð¹Ð½ Ñ…ÑƒÐ²Ð°Ð°Ð³Ñ‡ Ñ‚ÑÐ³ Ð±Ð°Ð¹Ð¶ Ð±Ð¾Ð»Ð¾Ñ…Ð³Ò¯Ð¹.");
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

/** ÐÑ€Ð°Ð²Ñ‚Ñ‹Ð½ Ñ…ÑÑÐ³Ð¸Ð¹Ð³ Ñ…ÑÑ‚ ÑƒÑ€Ñ‚ Ð±Ð¸Ñ‡Ð¸Ñ…Ð³Ò¯Ð¹, Ñ‚Ó©Ð³ÑÐ³Ó©Ð»Ð¸Ð¹Ð½ Ñ‚ÑÐ³Ð¸Ð¹Ð³ Ñ…Ð°ÑÐ½Ð°. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Ð¥Ð°Ñ€Ð¸Ñƒ Ñ‚Ó©Ð³ÑÐ³Ó©Ð»Ñ‚ÑÐ¹ Ñ‚Ð¾Ð¾ Ð±Ð°Ð¹Ñ… Ñ‘ÑÑ‚Ð¾Ð¹.");
  }
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return String(rounded);
}

/** Ð¥Ó©Ð²Ó©Ð³Ñ‡ Ñ‚Ð¾Ð¾Ð½Ñ‹ Ð°Ð»Ð´Ð°Ð°Ð³ Ò¯Ð» Ñ…Ð°Ñ€Ð³Ð°Ð»Ð·Ð°Ð½ ÑƒÑ‚Ð³Ð°Ð°Ñ€Ð°Ð° Ñ‚ÑÐ½Ñ†Ò¯Ò¯ ÑÑÑÑ…Ð¸Ð¹Ð³ ÑˆÐ°Ð»Ð³Ð°Ð½Ð°. */
export function nearlyEqual(left: number, right: number): boolean {
  if (left === right) {
    return true;
  }
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 1e-9 * scale;
}

/**
 * Ð¡ÑƒÑ€Ð°Ð³Ñ‡Ð¸Ð¹Ð½ Ñ…Ð°Ñ€Ð¸ÑƒÐ³ Ñ‚Ð¾Ð¾ Ð±Ð¾Ð»Ð³Ð¾Ð½Ð¾. Ð”Ð°Ñ€Ð°Ð°Ñ… Ñ…ÑÐ»Ð±ÑÑ€Ò¯Ò¯Ð´Ð¸Ð¹Ð³ Ñ…Ò¯Ð»ÑÑÐ½Ñ:
 * "5", "5.0", " 5 ", "0,5", "1/2", "-3/4".
 * Ð¥Ð¾Ð¾ÑÐ¾Ð½, Ñ‚ÑÐ¼Ð´ÑÐ³Ñ‚, Ñ‚ÑÐ³ Ñ…ÑƒÐ²Ð°Ð°Ð³Ñ‡Ñ‚Ð°Ð¹ Ð±ÑƒÑ‚Ð°Ñ€Ñ…Ð°Ð¹ Ð±Ð¾Ð» null.
 */
export function parseNumericAnswer(raw: string): number | null {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.trim().replace(/[âˆ’â€“â€”]/g, "-").replace(/\s+/g, "");
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

  // Ð—Ó©Ð²Ñ…Ó©Ð½ Ð±Ò¯Ñ…ÑÐ» ÑÑÐ²ÑÐ» Ð°Ñ€Ð°Ð²Ñ‚Ñ‹Ð½ Ð±ÑƒÑ‚Ð°Ñ€Ñ…Ð°Ð¹; "5." Ð±Ð¾Ð»Ð¾Ð½ "1.2.3" Ð·ÑÑ€Ð³Ð¸Ð¹Ð³ Ð°Ð»Ð³Ð°ÑÐ½Ð°.
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

// Allow spaces between an arithmetic sign and a number. A rendered equation
// such as `3x - 15 = 3` still contains the parameter b = -15.
const NUMBER_TOKEN_PATTERN =
  /[+-]?\s*\d+(?:[.,]\d+)?(?:\s*\/\s*[+-]?\s*\d+(?:[.,]\d+)?)?/g;

/**
 * Ð¢ÐµÐºÑÑ‚ÑÑÑ Ñ‚Ð¾Ð¾Ð½ ÑƒÑ‚Ð³ÑƒÑƒÐ´Ñ‹Ð³ ÑÐ»Ð³Ð°Ð¶ Ð°Ð²Ð½Ð°. Ð‘ÑƒÑ‚Ð°Ñ€Ñ…Ð°Ð¹ "1/2" Ð±Ð¾Ð» 0.5, 1, 2 Ð³ÑÑÑÐ½
 * Ð³ÑƒÑ€Ð²Ð°Ð½ ÑƒÑ‚Ð³Ð° Ð±ÑƒÑ†Ð°Ð°Ð½Ð°: Ð±Ð¾Ð´Ð»Ð¾Ð³Ñ‹Ð½ Ñ‚ÐµÐºÑÑ‚ÑÐ´ 1 Ð±Ð° 2 Ð³ÑÑÑÐ½ Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ò¯Ò¯Ð´ Ð¾Ñ€ÑÐ¾Ð½ ÑÑÑÑ…Ð¸Ð¹Ð³
 * ÑˆÐ°Ð»Ð³Ð°Ñ…, ÑÑÐ¶Ò¯Ò¯Ð»ÑÐ³Ñ‡Ð¸Ð´ Ñ…Ð°Ñ€Ð¸Ñƒ Ð°Ð»Ð´Ð°Ð°Ð³Ò¯Ð¹ ÑÑÑÑ…Ð¸Ð¹Ð³ ÑˆÐ°Ð»Ð³Ð°Ñ… Ñ…Ð¾Ñ‘ÑƒÐ»Ð°Ð½Ð´ Ñ…ÑÑ€ÑÐ³Ñ‚ÑÐ¹.
 */
export function numericTokens(text: string): number[] {
  const values: number[] = [];
  const normalized = text.replace(/[âˆ’â€“â€”]/g, "-");

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

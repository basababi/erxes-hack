// check() нь кодоос үүссэн бодлогыг хүлээн авах эцсийн хаалт. AI зөвхөн
// текст бичдэг тул тоо, хариу, сэжүүлэгчийн аюулгүй байдлыг энд шалгана.

import { nearlyEqual, numericTokens, parseNumericAnswer, readNumber } from "./math.ts";
import { solve } from "./solve.ts";
import type { Params, ProblemKind } from "./types.ts";
import { requiredParamKeys, validateParams } from "./validate.ts";

export interface ProblemDraft {
  kind: ProblemKind;
  params: Params;
  statement: string;
  answer: string;
  hints: string[];
}

export type CheckResult = { ok: true } | { ok: false; reason: string };

export function check(p: ProblemDraft): CheckResult {
  const paramsValidation = validateParams(p.kind, p.params);
  if (!paramsValidation.ok) {
    return { ok: false, reason: `Параметр мужаас гарсан: ${paramsValidation.reason}` };
  }

  const expected = parseNumericAnswer(solve(p.kind, p.params));
  const given = parseNumericAnswer(p.answer);
  if (expected === null || given === null || !nearlyEqual(given, expected)) {
    return { ok: false, reason: "Хариу кодоор бодсон хариутай тохирохгүй байна." };
  }

  if (!Array.isArray(p.hints) || p.hints.length !== 3) {
    return { ok: false, reason: "Сэжүүлэгч яг 3 байх ёстой." };
  }
  if (p.hints.some((hint) => typeof hint !== "string")) {
    return { ok: false, reason: "Сэжүүлэгч бүр текст байх ёстой." };
  }

  const leaksAnswer = p.hints.some((hint) =>
    numericTokens(hint).some((value) => nearlyEqual(value, expected)),
  );
  if (leaksAnswer) {
    return { ok: false, reason: "Сэжүүлэгчид зөв хариу орсон байна." };
  }

  if (typeof p.statement !== "string" || p.statement.trim() === "") {
    return { ok: false, reason: "Бодлогын текст хоосон байна." };
  }

  const missing = requiredParamKeys(p.kind).filter((key) => {
    const value = readNumber(p.params, key);
    return !numericTokens(p.statement).some((token) => nearlyEqual(token, value));
  });
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Бодлогын текстэд шаардлагатай тоо ороогүй байна: ${missing.join(", ")}.`,
    };
  }

  return { ok: true };
}

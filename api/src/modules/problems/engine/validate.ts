// Параметрүүд математикийн хувьд утгатай эсэхийг шалгана.
// Энд зөвхөн бодолт хийхэд саад болох нөхцлийг тавьдаг: тэгээр хуваах,
// дутуу параметр, бүхэл бус утга зэрэг. Бодлого үүсгэх нарийн муж,
// алдааны давхцал зэрэг нь randomParams-ийн хариуцлага.

import type { Params, ProblemKind } from "./types.ts";

export type ParamsValidation = { ok: true } | { ok: false; reason: string };

function integerParam(params: Params, key: string): number | null {
  const value = params[key];
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

export function requiredParamKeys(kind: ProblemKind): readonly string[] {
  switch (kind) {
    case "linear_equation":
      return ["a", "b", "c"];
    case "percent_of":
      return ["n", "p"];
    case "fraction_add":
      return ["a", "b", "c", "d"];
    default:
      return [];
  }
}

export function validateParams(kind: ProblemKind, params: Params): ParamsValidation {
  switch (kind) {
    case "linear_equation": {
      const a = integerParam(params, "a");
      const b = integerParam(params, "b");
      const c = integerParam(params, "c");

      // a = 0 үед тэгшитгэл шийдгүй эсвэл тодорхойгүй болно.
      if (a === null || a === 0) {
        return { ok: false, reason: "a нь тэгээс ялгаатай бүхэл тоо байх ёстой." };
      }
      if (b === null) {
        return { ok: false, reason: "b нь бүхэл тоо байх ёстой." };
      }
      if (c === null) {
        return { ok: false, reason: "c нь бүхэл тоо байх ёстой." };
      }

      // x нь нэмэлт шалгалтын параметр: өгсөн бол шийдтэйгээ таарах ёстой.
      const x = (c - b) / a;
      if (params["x"] !== undefined && params["x"] !== x) {
        return { ok: false, reason: "x параметр тэгшитгэлийн шийдтэй тохирохгүй байна." };
      }

      return { ok: true };
    }
    case "percent_of": {
      const n = integerParam(params, "n");
      const p = integerParam(params, "p");

      // n нь нийт тоо: сөрөг байх утгагүй, 0 бол зөвхөн 0 гарна.
      if (n === null || n < 0) {
        return { ok: false, reason: "n нь 0 буюу түүнээс их бүхэл тоо байх ёстой." };
      }
      // p = 0 үед урвуу хуваалтын алдаа тодорхойгүй болно.
      if (p === null || p <= 0) {
        return { ok: false, reason: "p нь 0-ээс их бүхэл тоо байх ёстой." };
      }

      return { ok: true };
    }
    case "fraction_add": {
      const a = integerParam(params, "a");
      const b = integerParam(params, "b");
      const c = integerParam(params, "c");
      const d = integerParam(params, "d");

      if (a === null) {
        return { ok: false, reason: "a нь бүхэл тоо байх ёстой." };
      }
      if (b === null || b <= 0) {
        return { ok: false, reason: "b нь 0-ээс их бүхэл тоо байх ёстой." };
      }
      if (c === null) {
        return { ok: false, reason: "c нь бүхэл тоо байх ёстой." };
      }
      if (d === null || d <= 0) {
        return { ok: false, reason: "d нь 0-ээс их бүхэл тоо байх ёстой." };
      }

      return { ok: true };
    }
    default:
      return { ok: false, reason: "Бодлогын төрөл танигдсангүй." };
  }
}

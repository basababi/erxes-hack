// Алдааны сан: сурагчийн буруу хариуг AI-аар таамаглахгүй, харин яг ямар
// буруу дүрмээр гарсан хариу болохыг кодоор тодорхойлно.

import { nearlyEqual, readNumber } from "./math.ts";
import type { Misconception, Params, ProblemKind } from "./types.ts";

export const MISCONCEPTIONS: Record<ProblemKind, Misconception[]> = {
  linear_equation: [
    {
      code: "b_added",
      title: "Тогтмолыг нэмсэн",
      message:
        "Тэгшитгэлийн нэг талаас нөгөө тал руу шилжүүлэхдээ тэмдгийг нь солих ёстой. Та b-г хасахын оронд нэмж бодсон байна.",
    },
    {
      code: "forgot_divide",
      title: "Хуваахаа мартсан",
      message:
        "Үл мэдэгдэгчийн өмнөх коэффициентоор хоёр талыг хуваах шат дутуу байна. Ингэснээр x-ийн утга биш, зөрүү нь л гарсан байна.",
    },
    {
      code: "sign_error",
      title: "Тэмдгийн алдаа",
      message:
        "Гишүүнийг нөгөө тал руу шилжүүлэхдээ тэмдгийг нь өөрчлөх ёстой. Энд тэмдэг буруу болсон байна.",
    },
  ],
  percent_of: [
    {
      code: "no_divide_100",
      title: "100-д хуваагаагүй",
      message:
        "Хувийг тоо болгон ашиглахын тулд эхлээд 100-д хуваах ёстой. Та хувийн тоог шууд үржүүлсэн байна.",
    },
    {
      code: "inverted",
      title: "Урвуу хуваалт",
      message:
        "Хувийг олохдоо нийт тоог хувьд хуваах биш, хувийг зуутын нэгжээр илэрхийлж нийт тоогоор үржүүлнэ.",
    },
    {
      code: "divided_by_p",
      title: "Хувьд хуваасан",
      message:
        "Нийт тоог хувьд хуваасан байна. Хувь нь үржүүлэх хэмжээ, хуваах хэмжээ биш гэдгийг санаарай.",
    },
  ],
  fraction_add: [
    {
      code: "add_across",
      title: "Хүртэгч, хуваагчийг тус тусад нь нэмсэн",
      message:
        "Бутархай нэмэхдээ хүртэгч ба хуваагчийг шууд нэмж болохгүй. Эхлээд хуваагчдыг тэнцүүлэх хэрэгтэй.",
    },
    {
      code: "same_denominator",
      title: "Ижил хуваагч ашигласан",
      message:
        "Хуваагчид өөр байхад нэг хуваагчийг шууд ашигласан байна. Эхлээд ерөнхий хуваагч олох ёстой.",
    },
    {
      code: "multiplied",
      title: "Үржүүлсэн",
      message:
        "Нэмэх үйлдлийг үржүүлэхтэй андуурсан байна. Бутархай нэмэхэд хүртэгчдийг нэмнэ, хуваагчдыг үржүүлэхгүй.",
    },
  ],
};

export interface MisconceptionValue {
  code: string;
  value: number;
}

/** Бодлогын зөв хариуны тоон утга. */
export function correctValue(kind: ProblemKind, params: Params): number {
  switch (kind) {
    case "linear_equation": {
      const a = readNumber(params, "a");
      const b = readNumber(params, "b");
      const c = readNumber(params, "c");
      return (c - b) / a;
    }
    case "percent_of": {
      const n = readNumber(params, "n");
      const p = readNumber(params, "p");
      return (n * p) / 100;
    }
    case "fraction_add": {
      const a = readNumber(params, "a");
      const b = readNumber(params, "b");
      const c = readNumber(params, "c");
      const d = readNumber(params, "d");
      return a / b + c / d;
    }
  }
}

/** Алдааны дүрэм бүрийн гаргах буруу хариу. */
export function misconceptionValues(kind: ProblemKind, params: Params): MisconceptionValue[] {
  switch (kind) {
    case "linear_equation": {
      const a = readNumber(params, "a");
      const b = readNumber(params, "b");
      const c = readNumber(params, "c");
      return [
        { code: "b_added", value: (c + b) / a },
        { code: "forgot_divide", value: c - b },
        { code: "sign_error", value: -(c - b) / a },
      ];
    }
    case "percent_of": {
      const n = readNumber(params, "n");
      const p = readNumber(params, "p");
      return [
        { code: "no_divide_100", value: p * n },
        { code: "inverted", value: n / p },
        { code: "divided_by_p", value: (n * 100) / p },
      ];
    }
    case "fraction_add": {
      const a = readNumber(params, "a");
      const b = readNumber(params, "b");
      const c = readNumber(params, "c");
      const d = readNumber(params, "d");
      return [
        { code: "add_across", value: (a + c) / (b + d) },
        { code: "same_denominator", value: (a + c) / b },
        { code: "multiplied", value: (a * c) / (b * d) },
      ];
    }
  }
}

/**
 * Зөв хариу болон бүх алдааны хариу хоорондоо утгаараа ялгаатай эсэх.
 * randomParams үүнийг ашиглан "нэг буруу хариу хоёр алдаанд хамаарах"
 * төлөвийг үүсгэхгүй.
 */
export function hasUniqueDiagnoses(kind: ProblemKind, params: Params): boolean {
  const correct = correctValue(kind, params);
  const values = misconceptionValues(kind, params);

  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (current === undefined || nearlyEqual(current.value, correct)) {
      return false;
    }
    for (let other = index + 1; other < values.length; other += 1) {
      const candidate = values[other];
      if (candidate !== undefined && nearlyEqual(current.value, candidate.value)) {
        return false;
      }
    }
  }

  return true;
}

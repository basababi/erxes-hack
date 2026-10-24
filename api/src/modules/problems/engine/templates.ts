// Бэлэн бодлого үүсгэгч. Бодлогын тоо, хариу, сэжүүлэгчийг код өгөх тул
// AI-ийн бичсэн текст буруу хариутай байх боломжгүй; check() эцэст нь батална.

import { check } from "./check.ts";
import { randomParams } from "./params.ts";
import { solve } from "./solve.ts";
import type { Difficulty, Params, ProblemKind } from "./types.ts";

const HINTS: Record<ProblemKind, readonly [string, string, string]> = {
  linear_equation: [
    "Эхлээд юуг тэгшитгэлийн нөгөө тал руу шилжүүлэх вэ? Тогтмол гишүүнийг шилжүүлэхдээ тэмдгийг нь соль.",
    "Дараа нь үл мэдэгдэгч үлдсэн талыг үл мэдэгдэгчийн өмнөх коэффициентэд хуваа.",
    "Гарсан утгыг анхны тэгшитгэлд тавьж, хоёр тал тэнцэж байгаа эсэхийг шалга.",
  ],
  percent_of: [
    "Эхлээд хувийг зуутын нэгжээр бич: хувийн тоог зуугаар хуваа.",
    "Дараа нь гарсан бутархайг өгөгдсөн нийт тоогоор үржүүл.",
    "Үржвэрийнхээ бутархай хэсгийг бодож, хариуг бүхэл эсвэл аравтын бутархайгаар бич.",
  ],
  fraction_add: [
    "Эхлээд хоёр хуваагчийн хамгийн бага ерөнхий хуваагчийг ол.",
    "Хүртэгч бүрийг ерөнхий хуваагч хүртэл өргөжүүлээд, хүртэгчдийг нэм.",
    "Гарсан бутархайг хураангуйл; хуваагч нь нэг болсон бол бүхэл тоогоор бич.",
  ],
};

function linearStatement(params: Params, difficulty: Difficulty): string {
  const a = params["a"] ?? 0;
  const b = params["b"] ?? 0;
  const c = params["c"] ?? 0;
  const equation = `(${a}x + (${b}) = ${c})`;

  if (difficulty === 1) {
    const extra =
      b > 0 ? `${b} ном нэмэхэд` : `${Math.abs(b)} ном хасахад`;
    return `Сургалтын төвийн номын санд ижил тооны номтой ${a} хайрцаг байв. Хайрцаг бүрийн ном дээр ${extra} нийт ${c} ном болов. Нэг хайрцагт хэдэн ном байсан бэ? ${equation}`;
  }

  if (difficulty === 2) {
    const extra =
      b > 0 ? `${b} оноо нэмэхэд` : `${Math.abs(b)} оноо хасахад`;
    return `Дугуйлангийн тэмцээнд ижил тооны оноотой ${a} баг оролцов. Баг бүрийн онооноос ${extra} нийт ${c} оноо болов. Баг бүр хэдэн оноо авсан бэ? ${equation}`;
  }

  const extra =
    b > 0 ? `${b} төгрөг нэмж төлөхөд` : `${Math.abs(b)} төгрөг хямдруулахад`;
  return `Кафетерид ижил үнэтэй ${a} ундаа авч, ${extra} нийт ${c} төгрөг төлөв. Нэг ундааны үнэ хэд вэ? ${equation}`;
}

function percentStatement(params: Params, difficulty: Difficulty): string {
  const n = params["n"] ?? 0;
  const p = params["p"] ?? 0;

  if (difficulty === 1) {
    return `Сургалтын төвийн номын санд ${n} хуудастай ном байв. Сурагч номынхоо ${p}%-ийг уншжээ. Хэдэн хуудас уншсан бэ?`;
  }

  if (difficulty === 2) {
    return `Дэлгүүрт ${n} төгрөгийн үнэтэй дэвтэр ${p}% хямдарлаа. Хямдралын хэмжээ хэдэн төгрөг болов?`;
  }

  return `Сургалтын төвийн ${n} сурагчийн ${p}% нь дугуйланд бүртгүүлжээ. Хэдэн сурагч бүртгүүлсэн бэ?`;
}

function fractionStatement(params: Params, difficulty: Difficulty): string {
  const a = params["a"] ?? 0;
  const b = params["b"] ?? 0;
  const c = params["c"] ?? 0;
  const d = params["d"] ?? 0;

  if (difficulty === 1) {
    return `Гэр бүл нэг талхны ${a}/${b} хэсгийг өглөө, ${c}/${d} хэсгийг орой идэв. Тэд нийт хэдэн талх идсэн бэ?`;
  }

  if (difficulty === 2) {
    return `Сургалтын төвийн үдэшлэгт нэг бялууны ${a}/${b} хэсгийг эхний бүлэг, ${c}/${d} хэсгийг хоёр дахь бүлэг идэв. Нийт хэдэн бялуу идсэн бэ?`;
  }

  return `Аялалд нэг лонх усны ${a}/${b} хэсгийг өглөө, ${c}/${d} хэсгийг үдээс хойш уув. Нийт хэдэн лонх ус уусан бэ?`;
}

function statementFor(kind: ProblemKind, params: Params, difficulty: Difficulty): string {
  switch (kind) {
    case "linear_equation":
      return linearStatement(params, difficulty);
    case "percent_of":
      return percentStatement(params, difficulty);
    case "fraction_add":
      return fractionStatement(params, difficulty);
  }
}

export function generateTemplate(
  kind: ProblemKind,
  difficulty: Difficulty,
): { params: Params; statement: string; answer: string; hints: [string, string, string] } {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const params = randomParams(kind, difficulty);
    const answer = solve(kind, params);
    const statement = statementFor(kind, params, difficulty);
    const hints = HINTS[kind];
    const draft = {
      kind,
      params,
      statement,
      answer,
      hints: [hints[0], hints[1], hints[2]],
    };

    if (check(draft).ok) {
      return {
        params,
        statement,
        answer,
        hints: [hints[0], hints[1], hints[2]],
      };
    }
  }

  throw new Error("check()-ийг давах бодлого үүсгэж чадсангүй.");
}

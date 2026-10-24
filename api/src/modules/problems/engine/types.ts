// Бодлогын хөдөлгүүрийн нийтэд нээлттэй төрлүүд.
// Эдгээр нь GraphQL, MongoDB эсвэл erxes-ээс бүрэн хамааралгүй: зөвхөн тоо
// бодож, сурагчийн алдааг кодоор оношлоход зориулагдсан.

export type ProblemKind = "linear_equation" | "percent_of" | "fraction_add";

export type Difficulty = 1 | 2 | 3;

/**
 * Бодлогын параметрүүд. kind бүр өөрийн түлхүүрүүдтэй:
 * - linear_equation: a, b, c, x  (a * x + b = c)
 * - percent_of: n, p            (n-ийн p%)
 * - fraction_add: a, b, c, d    (a/b + c/d)
 */
export type Params = Record<string, number>;

export interface Misconception {
  code: string;
  title: string;
  message: string;
}

import type { IAttemptItem } from "../db/definitions/attempt.ts";

export const newAttemptItems = (problemIds: string[]): IAttemptItem[] =>
  problemIds.map((problemId) => ({ problemId, hintsUsed: 0 }));

const unique = (values: string[]) => [...new Set(values)];

const shuffled = (values: string[], random: () => number) => {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target] as string, result[index] as string];
  }

  return result;
};

// Up to 60% of a new set revisits questions the student missed on the first
// try. The remainder stays fresh, with no duplicate problem ids.
export const selectPracticeProblemIds = (
  approvedIds: string[],
  weakIds: string[],
  count: number,
  random: () => number = Math.random,
) => {
  const approved = unique(approvedIds);

  if (approved.length < count) return [];

  const approvedSet = new Set(approved);
  const weak = shuffled(
    unique(weakIds).filter((id) => approvedSet.has(id)),
    random,
  );
  const weakCount = Math.min(weak.length, Math.ceil(count * 0.6));
  const selected = weak.slice(0, weakCount);
  const selectedSet = new Set(selected);
  const fresh = shuffled(
    approved.filter((id) => !selectedSet.has(id)),
    random,
  );

  return [...selected, ...fresh.slice(0, count - selected.length)];
};

export const calculatePracticeSummary = (items: IAttemptItem[]) => {
  const total = items.length;
  const correctCount = items.filter((item) => item.correct).length;
  const score = total ? Math.round((correctCount / total) * 100) : 0;
  const mastery = total
    ? Math.round(
        items.reduce((sum, item) => {
          if (!item.correct) return sum;

          const firstTryPenalty = item.firstTry === false ? 15 : 0;
          const hintPenalty = item.hintsUsed * 10;

          return sum + Math.max(40, 100 - firstTryPenalty - hintPenalty);
        }, 0) / total,
      )
    : 0;

  return { correctCount, total, score, mastery };
};

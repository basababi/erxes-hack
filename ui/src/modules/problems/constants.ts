import type {
  EdututorDifficulty,
  EdututorProblemSource,
  EdututorProblemStatus,
} from "~/gql/graphql";

export const PROBLEM_STATUSES = [
  "draft",
  "approved",
  "rejected",
] as const satisfies readonly EdututorProblemStatus[];

export const PROBLEM_STATUS_LABELS: Record<EdututorProblemStatus, string> = {
  draft: "Ноорог",
  approved: "Батлагдсан",
  rejected: "Татгалзсан",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const satisfies readonly EdututorDifficulty[];

export const DIFFICULTY_LABELS: Record<EdututorDifficulty, string> = {
  easy: "Хялбар",
  medium: "Дунд",
  hard: "Хэцүү",
};

export const PROBLEM_SOURCE_LABELS: Record<EdututorProblemSource, string> = {
  gemma: "Gemma",
  template: "Загвар",
};

// Mirrors the API cap on one generation request.
export const MAX_GENERATE_COUNT = 5;

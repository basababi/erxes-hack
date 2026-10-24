export const ATTEMPT_STATUSES = ["active", "finished"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const PRACTICE_PROBLEM_COUNT = 5;
export const MAX_HINTS = 3;

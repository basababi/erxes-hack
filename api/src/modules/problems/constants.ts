// Kept free of erxes-api-shared imports: print-schema loads the resolvers,
// and the shared utils bundle opens Redis on import.
export const PROBLEM_STATUSES = ["draft", "approved", "rejected"] as const;
export const PROBLEM_SOURCES = ["template", "gemma"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];
export type ProblemSource = (typeof PROBLEM_SOURCES)[number];

export const MAX_GENERATE_COUNT = 5;

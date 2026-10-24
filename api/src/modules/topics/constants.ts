// Kept free of erxes-api-shared imports: print-schema loads the resolvers,
// and the shared utils bundle opens Redis on import.
// Each kind maps to a deterministic solver, so the set is closed.
export const TOPIC_KINDS = ["linear_equation", "percent_of", "fraction_add"] as const;

export type TopicKind = (typeof TOPIC_KINDS)[number];

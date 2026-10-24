import type { EdututorTopicKind } from "~/gql/graphql";

export const TOPIC_KINDS = [
  "linear_equation",
  "percent_of",
  "fraction_add",
] as const satisfies readonly EdututorTopicKind[];

// Typed by the generated enum, so a new API kind fails the build until labelled.
export const TOPIC_KIND_LABELS: Record<EdututorTopicKind, string> = {
  linear_equation: "Шугаман тэгшитгэл",
  percent_of: "Хувь олох",
  fraction_add: "Бутархай нэмэх",
};

export const TOPICS_PAGE_SIZE = 50;

// URL query keys, so a sheet survives reloads and can be linked to.
export const TOPIC_CREATE_PARAM = "createTopic";
export const TOPIC_EDIT_PARAM = "topicId";

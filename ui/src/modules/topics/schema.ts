import { z } from "zod";
import type { EdututorTopicDetailQuery, EdututorTopicInput } from "~/gql/graphql";
import { TOPIC_KINDS } from "./constants";

// Mirrors the API's topic input validation so errors show inline first.
export const topicFormSchema = z.object({
  name: z.string().trim().min(1, "Нэр заавал").max(120, "120 тэмдэгтээс ихгүй"),
  description: z.string().trim().max(1000, "1000 тэмдэгтээс ихгүй"),
  // Text input value; empty means "not set".
  gradeLevel: z
    .string()
    .trim()
    .refine((value) => value === "" || /^(?:[1-9]|1[0-2])$/.test(value), "1–12 анги"),
  kind: z.enum(TOPIC_KINDS, { errorMap: () => ({ message: "Төрөл сонгоно уу" }) }),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

export const TOPIC_FORM_DEFAULTS: TopicFormValues = {
  name: "",
  description: "",
  gradeLevel: "",
  kind: "linear_equation",
};

export const toTopicFormValues = (
  topic: EdututorTopicDetailQuery["edututorTopicDetail"],
): TopicFormValues => ({
  name: topic.name,
  description: topic.description ?? "",
  gradeLevel: topic.gradeLevel == null ? "" : String(topic.gradeLevel),
  kind: topic.kind,
});

export const toTopicInput = (values: TopicFormValues): EdututorTopicInput => ({
  name: values.name,
  description: values.description || null,
  gradeLevel: values.gradeLevel ? Number(values.gradeLevel) : null,
  kind: values.kind,
});

import { z } from "zod";
import type { EdututorLessonInput, EdututorTopicDetailQuery } from "~/gql/graphql";
import { formatTimestamp, parseTimestamp, videoEmbedUrl } from "./utils";

// Mirrors the API's lesson validation so errors show inline first.
export const lessonFormSchema = z.object({
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || videoEmbedUrl(value) !== null,
      "YouTube эсвэл Google Drive-ийн https холбоос оруулна уу",
    ),
  chapters: z
    .array(
      z.object({
        misconception: z.string().min(1, "Алдаа сонгоно уу"),
        time: z
          .string()
          .refine((value) => {
            const seconds = parseTimestamp(value);

            return seconds !== null && seconds <= 21_600;
          }, '"0:45" хэлбэрээр оруулна уу'),
        title: z.string().trim().min(1, "Гарчиг заавал").max(120, "120 тэмдэгтээс ихгүй"),
      }),
    )
    .max(20)
    .superRefine((chapters, context) => {
      const seen = new Set<string>();

      chapters.forEach(({ misconception }, index) => {
        if (misconception && seen.has(misconception)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Энэ алдаанд аль хэдийн хэсэг холбосон",
            path: [index, "misconception"],
          });
        }
        seen.add(misconception);
      });
    }),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

type Lesson = NonNullable<EdututorTopicDetailQuery["edututorTopicDetail"]["lesson"]>;

export const toLessonFormValues = (lesson: Lesson | null | undefined): LessonFormValues => ({
  videoUrl: lesson?.videoUrl ?? "",
  chapters: (lesson?.chapters ?? []).map((chapter) => ({
    misconception: chapter.misconception,
    time: formatTimestamp(chapter.atSeconds),
    title: chapter.title,
  })),
});

export const toLessonInput = (values: LessonFormValues): EdututorLessonInput => ({
  videoUrl: values.videoUrl || null,
  chapters: values.chapters.map((chapter) => ({
    misconception: chapter.misconception,
    atSeconds: parseTimestamp(chapter.time) ?? 0,
    title: chapter.title,
  })),
});

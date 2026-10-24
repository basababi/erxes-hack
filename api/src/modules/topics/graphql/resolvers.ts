import { z } from "zod";
import type { Context } from "../../../connectionResolvers.ts";
import { authorize, badInput, isoDate, pageSchema, parse } from "../../../graphql/guards.ts";
import { TOPICS_MANAGE, TOPICS_SHOW } from "../../../permissions.ts";
import { MISCONCEPTIONS } from "../../problems/engineAdapter.ts";
import { TOPIC_KINDS } from "../constants.ts";
import type { ILesson, ITopic, ITopicDocument } from "../db/definitions/topic.ts";

const topicInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => value || undefined),
  gradeLevel: z
    .number()
    .int()
    .min(1)
    .max(12)
    .nullish()
    .transform((value) => value ?? undefined),
  kind: z.enum(TOPIC_KINDS),
});

const VIDEO_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "drive.google.com"];

const lessonInputSchema = z.object({
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => value || undefined)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);

        return url.protocol === "https:" && VIDEO_HOSTS.includes(url.hostname);
      } catch {
        return false;
      }
    }, "Видео нь YouTube эсвэл Google Drive-ийн https холбоос байх ёстой"),
  chapters: z
    .array(
      z.object({
        misconception: z.string().trim().min(1),
        // Up to six hours into the video.
        atSeconds: z.number().int().min(0).max(21_600),
        title: z.string().trim().min(1, "Хэсгийн гарчиг заавал").max(120),
      }),
    )
    .max(20),
});

const toGraphql = (topic: ITopicDocument) => ({
  ...topic,
  lesson: topic.lesson ? { videoUrl: null, ...topic.lesson } : null,
  createdAt: isoDate(topic.createdAt),
});

export const topicResolvers = {
  Query: {
    edututorTopics: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: Context,
    ) => {
      await authorize(context, TOPICS_SHOW);
      const page = parse(pageSchema, { limit: args.limit ?? 50, offset: args.offset ?? 0 });

      return (await context.models.Topics.list(page)).map(toGraphql);
    },
    edututorTopicDetail: async (_parent: unknown, { _id }: { _id: string }, context: Context) => {
      await authorize(context, TOPICS_SHOW);

      return toGraphql(await context.models.Topics.getTopic(_id));
    },
  },
  Mutation: {
    edututorTopicAdd: async (_parent: unknown, { input }: { input: ITopic }, context: Context) => {
      await authorize(context, TOPICS_MANAGE);

      return toGraphql(await context.models.Topics.createTopic(parse(topicInputSchema, input)));
    },
    edututorTopicEdit: async (
      _parent: unknown,
      { _id, input }: { _id: string; input: ITopic },
      context: Context,
    ) => {
      await authorize(context, TOPICS_MANAGE);

      return toGraphql(
        await context.models.Topics.updateTopic(_id, parse(topicInputSchema, input)),
      );
    },
    edututorTopicLessonSave: async (
      _parent: unknown,
      { _id, lesson }: { _id: string; lesson: ILesson },
      context: Context,
    ) => {
      await authorize(context, TOPICS_MANAGE);
      const topic = await context.models.Topics.getTopic(_id);
      const input = parse(lessonInputSchema, lesson);
      const known = new Set(
        MISCONCEPTIONS.filter((item) => item.kind === topic.kind).map((item) => item.id),
      );
      const seen = new Set<string>();

      for (const { misconception } of input.chapters) {
        if (!known.has(misconception)) {
          throw badInput(`"${misconception}" алдаа энэ сэдвийн төрөлд байхгүй`);
        }
        if (seen.has(misconception)) {
          throw badInput("Нэг алдаанд нэг л хэсэг холбоно");
        }
        seen.add(misconception);
      }

      return toGraphql(await context.models.Topics.saveLesson(_id, input));
    },
    edututorTopicRemove: async (_parent: unknown, { _id }: { _id: string }, context: Context) => {
      await authorize(context, TOPICS_MANAGE);

      return context.models.Topics.removeTopic(_id);
    },
  },
};

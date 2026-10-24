import { GraphQLError } from "graphql";
import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import { type ITopic, type ITopicDocument, topicSchema } from "../definitions/topic.ts";

export interface ITopicModel extends Model<ITopicDocument> {
  list(page: { limit: number; offset: number }): Promise<ITopicDocument[]>;
  getTopic(_id: string): Promise<ITopicDocument>;
  createTopic(doc: ITopic): Promise<ITopicDocument>;
  updateTopic(_id: string, doc: ITopic): Promise<ITopicDocument>;
  removeTopic(_id: string): Promise<string>;
}

const notFound = () => new GraphQLError("Topic not found", { extensions: { code: "NOT_FOUND" } });

// Model statics live on the schema class, matching the monorepo's
// loadXClass(models) convention.
export const loadTopicClass = (models: IModels) => {
  class Topic {
    public static list({ limit, offset }: { limit: number; offset: number }) {
      return models.Topics.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean<ITopicDocument[]>();
    }

    public static async getTopic(_id: string) {
      const topic = await models.Topics.findOne({ _id }).lean<ITopicDocument>();

      if (!topic) {
        throw notFound();
      }

      return topic;
    }

    public static async createTopic(doc: ITopic) {
      const topic = await models.Topics.create(doc);

      return topic.toObject<ITopicDocument>();
    }

    public static async updateTopic(_id: string, doc: ITopic) {
      // Unset optional fields the form cleared instead of storing null.
      const $unset: Partial<Record<keyof ITopic, 1>> = {};

      if (doc.description === undefined) $unset.description = 1;
      if (doc.gradeLevel === undefined) $unset.gradeLevel = 1;

      const topic = await models.Topics.findOneAndUpdate(
        { _id },
        { $set: doc, $unset },
        { new: true, runValidators: true },
      ).lean<ITopicDocument>();

      if (!topic) {
        throw notFound();
      }

      return topic;
    }

    public static async removeTopic(_id: string) {
      const { deletedCount } = await models.Topics.deleteOne({ _id });

      if (!deletedCount) {
        throw notFound();
      }

      return _id;
    }
  }

  topicSchema.loadClass(Topic);

  return topicSchema;
};

import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import type { IParentGoal, IParentGoalDocument } from "../definitions/parentGoal.ts";
import { parentGoalSchema } from "../definitions/parentGoal.ts";

export interface IParentGoalModel extends Model<IParentGoalDocument> {
  listByCustomer(customerId: string): Promise<IParentGoalDocument[]>;
  goalExists(customerId: string, topicId: string): Promise<boolean>;
  goalCount(customerId: string): Promise<number>;
  saveGoal(input: Omit<IParentGoal, "createdAt">): Promise<IParentGoalDocument>;
  deleteGoal(_id: string, customerId: string): Promise<boolean>;
  deleteByTopic(topicId: string): Promise<void>;
}

export const loadParentGoalClass = (models: IModels) => {
  class ParentGoal {
    public static listByCustomer(customerId: string) {
      return models.ParentGoals.find({ customerId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(100)
        .lean<IParentGoalDocument[]>();
    }

    public static goalCount(customerId: string) {
      return models.ParentGoals.countDocuments({ customerId });
    }

    public static async goalExists(customerId: string, topicId: string) {
      return Boolean(await models.ParentGoals.exists({ customerId, topicId }));
    }

    public static async saveGoal(input: Omit<IParentGoal, "createdAt">) {
      const goal = await models.ParentGoals.findOneAndUpdate(
        { customerId: input.customerId, topicId: input.topicId },
        {
          $set: { targetMastery: input.targetMastery },
          $setOnInsert: { customerId: input.customerId, topicId: input.topicId },
        },
        { upsert: true, new: true, runValidators: true },
      );

      return goal.toObject<IParentGoalDocument>();
    }

    public static async deleteGoal(_id: string, customerId: string) {
      const { deletedCount } = await models.ParentGoals.deleteOne({ _id, customerId });

      return deletedCount > 0;
    }

    public static async deleteByTopic(topicId: string) {
      await models.ParentGoals.deleteMany({ topicId });
    }
  }

  parentGoalSchema.loadClass(ParentGoal);

  return parentGoalSchema;
};

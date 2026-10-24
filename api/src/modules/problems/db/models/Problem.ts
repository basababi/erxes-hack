import { GraphQLError } from "graphql";
import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import type { ProblemStatus } from "../../constants.ts";
import { type IProblem, type IProblemDocument, problemSchema } from "../definitions/problem.ts";

export interface IProblemModel extends Model<IProblemDocument> {
  listByTopic(query: {
    topicId: string;
    status?: ProblemStatus;
    limit: number;
    offset: number;
  }): Promise<IProblemDocument[]>;
  listApprovedByTopic(topicId: string, limit: number): Promise<IProblemDocument[]>;
  findByIds(ids: string[]): Promise<IProblemDocument[]>;
  getProblem(_id: string): Promise<IProblemDocument>;
  createProblems(docs: IProblem[]): Promise<IProblemDocument[]>;
  approveProblem(_id: string): Promise<IProblemDocument>;
  rejectProblem(_id: string): Promise<IProblemDocument>;
}

const notFound = () => new GraphQLError("Problem not found", { extensions: { code: "NOT_FOUND" } });

export const loadProblemClass = (models: IModels) => {
  class Problem {
    public static listByTopic({
      topicId,
      status,
      limit,
      offset,
    }: {
      topicId: string;
      status?: ProblemStatus;
      limit: number;
      offset: number;
    }) {
      return models.Problems.find(status ? { topicId, status } : { topicId })
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean<IProblemDocument[]>();
    }

    public static listApprovedByTopic(topicId: string, limit: number) {
      return models.Problems.find({ topicId, status: "approved", "verification.ok": true })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .lean<IProblemDocument[]>();
    }

    public static findByIds(ids: string[]) {
      if (ids.length === 0) return Promise.resolve([]);

      return models.Problems.find({ _id: { $in: ids } }).lean<IProblemDocument[]>();
    }

    public static async getProblem(_id: string) {
      const problem = await models.Problems.findOne({ _id }).lean<IProblemDocument>();

      if (!problem) throw notFound();

      return problem;
    }

    public static async createProblems(docs: IProblem[]) {
      const problems = await models.Problems.insertMany(docs);

      return problems.map((problem) => problem.toObject<IProblemDocument>());
    }

    // Only a problem the checker passed can reach students.
    public static async approveProblem(_id: string) {
      const problem = await models.Problems.findOneAndUpdate(
        { _id, "verification.ok": true },
        { $set: { status: "approved" } },
        { new: true },
      ).lean<IProblemDocument>();

      if (problem) return problem;

      await models.Problems.getProblem(_id);

      throw new GraphQLError("Шалгагч баталгаажуулаагүй бодлогыг батлах боломжгүй", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    public static async rejectProblem(_id: string) {
      const problem = await models.Problems.findOneAndUpdate(
        { _id },
        { $set: { status: "rejected" } },
        { new: true },
      ).lean<IProblemDocument>();

      if (!problem) throw notFound();

      return problem;
    }
  }

  problemSchema.loadClass(Problem);

  return problemSchema;
};

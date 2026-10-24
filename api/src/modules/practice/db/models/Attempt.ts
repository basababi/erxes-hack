import { GraphQLError } from "graphql";
import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import { calculatePracticeSummary } from "../../services/practice.ts";
import { attemptSchema, type IAttempt, type IAttemptDocument } from "../definitions/attempt.ts";

export interface IAttemptModel extends Model<IAttemptDocument> {
  createAttempt(doc: Pick<IAttempt, "customerId" | "topicId" | "items">): Promise<IAttemptDocument>;
  getAttempt(_id: string): Promise<IAttemptDocument>;
  recordAnswer(input: {
    attemptId: string;
    problemId: string;
    answer: string;
    correct: boolean;
    misconception?: string;
  }): Promise<IAttemptDocument>;
  takeHint(attemptId: string, problemId: string): Promise<IAttemptDocument>;
  finishAttempt(_id: string): Promise<IAttemptDocument>;
  recentWeakProblemIds(customerId: string, topicId: string): Promise<string[]>;
  deleteByTopic(topicId: string): Promise<void>;
}

const notFound = () =>
  new GraphQLError("Practice attempt not found", { extensions: { code: "NOT_FOUND" } });

const badInput = (message: string) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

const itemFor = (attempt: IAttemptDocument, problemId: string) => {
  const item = attempt.items.find((candidate) => candidate.problemId === problemId);

  if (!item) throw badInput("Энэ бодлого тухайн дадлагад байхгүй");

  return item;
};

const asObject = (attempt: IAttemptDocument) => attempt.toObject<IAttemptDocument>();

export const loadAttemptClass = (models: IModels) => {
  class Attempt {
    public static async createAttempt(doc: Pick<IAttempt, "customerId" | "topicId" | "items">) {
      const attempt = await models.Attempts.create({ ...doc, score: 0, status: "active" });

      return asObject(attempt);
    }

    public static async getAttempt(_id: string) {
      const attempt = await models.Attempts.findOne({ _id });

      if (!attempt) throw notFound();

      return attempt;
    }

    public static async recordAnswer({
      attemptId,
      problemId,
      answer,
      correct,
      misconception,
    }: {
      attemptId: string;
      problemId: string;
      answer: string;
      correct: boolean;
      misconception?: string;
    }) {
      const attempt = await models.Attempts.getAttempt(attemptId);

      if (attempt.status !== "active") throw badInput("Дууссан дадлагын хариуг өөрчлөхгүй");

      const item = itemFor(attempt, problemId);

      if (item.correct) throw badInput("Зөв бодсон бодлогыг дахин илгээх шаардлагагүй");

      const isFirstAnswer = item.answer === undefined;
      item.answer = answer;
      item.correct = correct;
      if (isFirstAnswer) item.firstTry = correct;
      if (misconception) item.misconception = misconception;

      attempt.score = calculatePracticeSummary(attempt.items).score;
      attempt.markModified("items");
      await attempt.save();

      return asObject(attempt);
    }

    public static async takeHint(attemptId: string, problemId: string) {
      const attempt = await models.Attempts.getAttempt(attemptId);

      if (attempt.status !== "active") throw badInput("Дууссан дадлагаас сэжүүр авахгүй");

      const item = itemFor(attempt, problemId);

      if (item.correct) throw badInput("Энэ бодлогыг аль хэдийн зөв бодсон байна");
      if (item.hintsUsed >= 3) throw badInput("Энэ бодлогын бүх сэжүүрийг ашигласан байна");

      item.hintsUsed += 1;
      attempt.markModified("items");
      await attempt.save();

      return asObject(attempt);
    }

    public static async finishAttempt(_id: string) {
      const attempt = await models.Attempts.getAttempt(_id);

      if (attempt.status === "finished") return asObject(attempt);
      if (attempt.items.some((item) => item.answer === undefined)) {
        throw badInput("Дадлагыг дуусгахын өмнө бүх бодлогод хариулна уу");
      }

      attempt.score = calculatePracticeSummary(attempt.items).score;
      attempt.status = "finished";
      attempt.finishedAt = new Date();
      await attempt.save();

      return asObject(attempt);
    }

    public static async recentWeakProblemIds(customerId: string, topicId: string) {
      const attempts = await models.Attempts.find({ customerId, topicId, status: "finished" })
        .sort({ startedAt: -1 })
        .limit(20)
        .lean<IAttemptDocument[]>();
      const ids = attempts.flatMap((attempt) =>
        attempt.items.filter((item) => item.firstTry === false).map((item) => item.problemId),
      );

      return [...new Set(ids)];
    }

    public static async deleteByTopic(topicId: string) {
      await models.Attempts.deleteMany({ topicId });
    }
  }

  attemptSchema.loadClass(Attempt);

  return attemptSchema;
};

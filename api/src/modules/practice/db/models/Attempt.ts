import { GraphQLError } from "graphql";
import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import { MAX_HINTS } from "../../constants.ts";
import type { PracticeFeedback } from "../../services/feedback.ts";
import { calculatePracticeSummary, calculatePracticeXp } from "../../services/practice.ts";
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
  revealSolution(attemptId: string, problemId: string): Promise<IAttemptDocument>;
  finishAttempt(_id: string): Promise<IAttemptDocument>;
  saveFeedback(_id: string, feedback: PracticeFeedback): Promise<IAttemptDocument>;
  totalXp(customerId: string): Promise<number>;
  latestFeedback(customerId: string): Promise<PracticeFeedback | null>;
  overallProgress(customerId: string): Promise<{ completedSessions: number; averageScore: number }>;
  topicProgressForGoals(
    customerId: string,
    topicIds: string[],
  ): Promise<Array<{ topicId: string; averageMastery: number }>>;
  topicProgress(
    customerId: string,
    currentTopicId: string,
  ): Promise<Array<{ topicId: string; attempts: number; averageScore: number }>>;
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
      if (item.solutionViewed) throw badInput("Бодолт үзсэн бодлогын хариуг өөрчлөхгүй");

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
      if (item.solutionViewed) throw badInput("Бодолт үзсэн бодлогод сэжүүр авахгүй");
      if (item.hintsUsed >= MAX_HINTS) {
        throw badInput("Энэ бодлогын бүх сэжүүрийг ашигласан байна");
      }

      item.hintsUsed += 1;
      attempt.markModified("items");
      await attempt.save();

      return asObject(attempt);
    }

    public static async revealSolution(attemptId: string, problemId: string) {
      const attempt = await models.Attempts.getAttempt(attemptId);

      if (attempt.status !== "active") throw badInput("Дууссан дадлагын бодолтыг үзэхгүй");

      const item = itemFor(attempt, problemId);

      if (item.correct) throw badInput("Энэ бодлогыг аль хэдийн зөв бодсон байна");
      if (item.hintsUsed < MAX_HINTS) {
        throw badInput("Бүх 3 сэжүүрийг ашигласны дараа бодолтыг үзнэ");
      }

      item.solutionViewed = true;
      attempt.markModified("items");
      await attempt.save();

      return asObject(attempt);
    }

    public static async finishAttempt(_id: string) {
      const attempt = await models.Attempts.getAttempt(_id);

      if (attempt.status === "finished") return asObject(attempt);
      if (attempt.items.some((item) => item.answer === undefined && !item.solutionViewed)) {
        throw badInput("Дадлагыг дуусгахын өмнө бүх бодлогод хариулна уу");
      }

      const summary = calculatePracticeSummary(attempt.items);
      attempt.score = summary.score;
      attempt.mastery = summary.mastery;
      attempt.xpEarned = calculatePracticeXp(attempt.items);
      attempt.status = "finished";
      attempt.finishedAt = new Date();
      await attempt.save();

      return asObject(attempt);
    }

    public static async saveFeedback(_id: string, feedback: PracticeFeedback) {
      const attempt = await models.Attempts.findOneAndUpdate(
        { _id, status: "finished" },
        { $set: { aiFeedback: feedback } },
        { new: true },
      );

      if (!attempt) throw notFound();

      return asObject(attempt);
    }

    public static async totalXp(customerId: string) {
      const [result] = await models.Attempts.aggregate<{ totalXp: number }>([
        { $match: { customerId, status: "finished" } },
        { $group: { _id: null, totalXp: { $sum: "$xpEarned" } } },
      ]);

      return result?.totalXp ?? 0;
    }

    public static async latestFeedback(customerId: string) {
      const attempt = await models.Attempts.findOne({
        customerId,
        status: "finished",
        aiFeedback: { $exists: true },
      })
        .sort({ finishedAt: -1 })
        .lean<IAttemptDocument>();

      return attempt?.aiFeedback ?? null;
    }

    public static async overallProgress(customerId: string) {
      const [result] = await models.Attempts.aggregate<{
        completedSessions: number;
        averageScore: number;
      }>([
        { $match: { customerId, status: "finished" } },
        {
          $group: {
            _id: null,
            completedSessions: { $sum: 1 },
            averageScore: { $avg: "$score" },
          },
        },
        {
          $project: {
            _id: 0,
            completedSessions: 1,
            averageScore: { $round: ["$averageScore", 0] },
          },
        },
      ]);

      return result ?? { completedSessions: 0, averageScore: 0 };
    }

    public static topicProgressForGoals(customerId: string, topicIds: string[]) {
      if (topicIds.length === 0) return Promise.resolve([]);

      return models.Attempts.aggregate<{ topicId: string; averageMastery: number }>([
        { $match: { customerId, status: "finished", topicId: { $in: topicIds } } },
        {
          $project: {
            topicId: 1,
            mastery: {
              $ifNull: [
                "$mastery",
                {
                  $round: [
                    {
                      $avg: {
                        $map: {
                          input: "$items",
                          as: "item",
                          in: {
                            $cond: [
                              { $eq: ["$$item.correct", true] },
                              {
                                $max: [
                                  40,
                                  {
                                    $subtract: [
                                      100,
                                      {
                                        $add: [
                                          {
                                            $cond: [{ $eq: ["$$item.firstTry", false] }, 15, 0],
                                          },
                                          { $multiply: [{ $ifNull: ["$$item.hintsUsed", 0] }, 10] },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              0,
                            ],
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$topicId",
            averageMastery: { $avg: "$mastery" },
          },
        },
        {
          $project: {
            _id: 0,
            topicId: "$_id",
            averageMastery: { $round: ["$averageMastery", 0] },
          },
        },
      ]);
    }

    public static async topicProgress(customerId: string, currentTopicId: string) {
      return models.Attempts.aggregate<{
        topicId: string;
        attempts: number;
        averageScore: number;
      }>([
        { $match: { customerId, status: "finished" } },
        {
          $group: {
            _id: "$topicId",
            attempts: { $sum: 1 },
            averageScore: { $avg: "$score" },
          },
        },
        { $set: { isCurrentTopic: { $eq: ["$_id", currentTopicId] } } },
        { $sort: { isCurrentTopic: -1, attempts: -1, _id: 1 } },
        { $limit: 100 },
        {
          $project: {
            _id: 0,
            topicId: "$_id",
            attempts: 1,
            averageScore: { $round: ["$averageScore", 0] },
          },
        },
      ]);
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

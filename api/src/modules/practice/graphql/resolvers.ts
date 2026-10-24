import { GraphQLError } from "graphql";
import { createRequire } from "node:module";
import { z } from "zod";
import type { Context } from "../../../connectionResolvers.ts";
import { authorize, badInput, isoDate, parse } from "../../../graphql/guards.ts";
import { PRACTICE_MANAGE } from "../../../permissions.ts";
import type { IProblemDocument } from "../../problems/db/definitions/problem.ts";
import {
  diagnose,
  isCorrect,
  MISCONCEPTIONS,
  type Misconception,
} from "../../problems/engineAdapter.ts";
import { PRACTICE_PROBLEM_COUNT } from "../constants.ts";
import type { IAttempt, IAttemptDocument } from "../db/definitions/attempt.ts";
import {
  calculatePracticeSummary,
  practiceBadges,
  newAttemptItems,
  selectPracticeProblemIds,
} from "../services/practice.ts";
import { generatePracticeFeedback } from "../services/feedback.ts";
import { revealedSolution } from "../services/solution.ts";
import type { PracticeFeedback } from "../services/feedback.ts";

const idSchema = z.string().trim().min(1).max(100);
const startSchema = z.object({ customerId: idSchema, topicId: idSchema });
const parentGoalInputSchema = z.object({
  customerId: idSchema,
  topicId: idSchema,
  targetMastery: z.number().int().min(50).max(100),
});
const parentGoalRemoveSchema = z.object({ customerId: idSchema, goalId: idSchema });
const itemSchema = z.object({ attemptId: idSchema, problemId: idSchema });
const answerSchema = itemSchema.extend({ answer: z.string().trim().min(1).max(100) });
const customerSchema = z.object({ _id: z.string().min(1) });
const requireFromPlugin = createRequire(__filename);

type AttemptLike = Pick<
  IAttempt,
  | "customerId"
  | "topicId"
  | "items"
  | "score"
  | "xpEarned"
  | "aiFeedback"
  | "status"
  | "startedAt"
  | "finishedAt"
> & { _id: unknown };

const ensureCustomer = async (context: Context, customerId: string) => {
  const { sendTRPCMessage } = requireFromPlugin("erxes-api-shared/utils") as Pick<
    typeof import("erxes-api-shared/utils"),
    "sendTRPCMessage"
  >;
  const customer: unknown = await sendTRPCMessage({
    subdomain: context.subdomain,
    pluginName: "core",
    method: "query",
    module: "customers",
    action: "findOne",
    input: { query: { _id: customerId } },
    defaultValue: null,
  });

  if (!customerSchema.safeParse(customer).success) {
    throw badInput("Сонгосон сурагч энэ байгууллагын Contacts-д олдсонгүй");
  }
};

const studentProblem = (problem: IProblemDocument) => ({
  _id: String(problem._id),
  topicId: problem.topicId,
  difficulty: problem.difficulty,
  statement: problem.statement,
});

const sessionFor = async (context: Context, attempt: AttemptLike) => {
  const ids = attempt.items.map((item) => item.problemId);
  const problems = await context.models.Problems.findByIds(ids);
  const byId = new Map(problems.map((problem) => [String(problem._id), problem]));
  const topic = attempt.items.some((item) => item.misconception)
    ? await context.models.Topics.getTopic(attempt.topicId)
    : null;
  const items = attempt.items.map((item) => {
    const problem = byId.get(item.problemId);

    if (!problem) {
      throw new GraphQLError("Дадлагын бодлого устсан байна. Шинэ дадлага эхлүүлнэ үү", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const misconception = item.misconception
      ? MISCONCEPTIONS.find(
          (candidate) => candidate.kind === problem.kind && candidate.id === item.misconception,
        )
      : undefined;
    const chapter = topic?.lesson?.chapters.find(
      (candidate) => candidate.misconception === item.misconception,
    );

    return {
      problem: studentProblem(problem),
      answered: item.answer !== undefined || Boolean(item.solutionViewed),
      correct: item.answer === undefined ? null : Boolean(item.correct),
      hintsUsed: item.hintsUsed,
      solutionViewed: Boolean(item.solutionViewed),
      firstTry: item.firstTry ?? null,
      revealedHints: problem.hints.slice(0, item.hintsUsed),
      solution: revealedSolution(problem, item.hintsUsed, Boolean(item.correct)),
      misconception: misconception
        ? {
            id: misconception.id,
            kind: problem.kind,
            title: misconception.title,
            message: misconception.message,
          }
        : null,
      lessonMoment:
        chapter && topic?.lesson?.videoUrl
          ? {
              videoUrl: topic.lesson.videoUrl,
              atSeconds: chapter.atSeconds,
              title: chapter.title,
            }
          : null,
    };
  });
  const summary = calculatePracticeSummary(attempt.items);
  const totalXp = await context.models.Attempts.totalXp(attempt.customerId);

  return {
    attemptId: String(attempt._id),
    customerId: attempt.customerId,
    topicId: attempt.topicId,
    items,
    answeredCount: items.filter((item) => item.answered).length,
    correctCount: summary.correctCount,
    total: items.length,
    score: attempt.score,
    mastery: summary.mastery,
    xpEarned: attempt.xpEarned ?? 0,
    totalXp,
    badges: practiceBadges(totalXp, attempt.items),
    aiFeedback: attempt.aiFeedback ?? null,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    finishedAt: isoDate(attempt.finishedAt),
  };
};

const attemptItem = (attempt: IAttemptDocument, problemId: string) => {
  const item = attempt.items.find((candidate) => candidate.problemId === problemId);

  if (!item) throw badInput("Энэ бодлого тухайн дадлагад байхгүй");

  return item;
};

const misconceptionPayload = (misconception: Misconception | null) =>
  misconception
    ? {
        id: misconception.id,
        kind: misconception.kind,
        title: misconception.title,
        message: misconception.message,
      }
    : null;

const lessonMomentFor = async (
  context: Context,
  topicId: string,
  misconception: Misconception | null,
) => {
  if (!misconception) return null;

  const topic = await context.models.Topics.getTopic(topicId);
  const chapter = topic.lesson?.chapters.find(
    (candidate) => candidate.misconception === misconception.id,
  );

  if (!chapter || !topic.lesson?.videoUrl) return null;

  return {
    videoUrl: topic.lesson.videoUrl,
    atSeconds: chapter.atSeconds,
    title: chapter.title,
  };
};

export const practiceResolvers = {
  Query: {
    edututorPracticeAttempt: async (
      _parent: unknown,
      { _id }: { _id: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const attemptId = parse(idSchema, _id);

      return sessionFor(context, await context.models.Attempts.getAttempt(attemptId));
    },
    edututorParentProgress: async (
      _parent: unknown,
      { customerId }: { customerId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const id = parse(idSchema, customerId);
      await ensureCustomer(context, id);

      const progress = await context.models.Attempts.topicProgress(id, "");
      const topics = await Promise.all(
        progress.map(async ({ topicId, attempts, averageScore }) => ({
          topicId,
          name: (await context.models.Topics.getTopic(topicId)).name,
          attempts,
          averageScore,
        })),
      );
      const [overallProgress, totalXp, latestFeedback, goals] = await Promise.all([
        context.models.Attempts.overallProgress(id),
        context.models.Attempts.totalXp(id),
        context.models.Attempts.latestFeedback(id),
        context.models.ParentGoals.listByCustomer(id),
      ]);
      const goalProgress = await context.models.Attempts.topicProgressForGoals(
        id,
        goals.map((goal) => goal.topicId),
      );
      const masteryByTopic = new Map(
        goalProgress.map((item) => [item.topicId, item.averageMastery]),
      );
      const parentGoals = await Promise.all(
        goals.map(async (goal) => {
          const currentMastery = masteryByTopic.get(goal.topicId) ?? 0;

          return {
            id: String(goal._id),
            topicId: goal.topicId,
            topicName: (await context.models.Topics.getTopic(goal.topicId)).name,
            targetMastery: goal.targetMastery,
            currentMastery,
            completed: currentMastery >= goal.targetMastery,
          };
        }),
      );

      return {
        customerId: id,
        ...overallProgress,
        totalXp,
        topics,
        goals: parentGoals,
        latestFeedback,
      };
    },
  },
  Mutation: {
    edututorParentGoalSave: async (
      _parent: unknown,
      args: { customerId: string; topicId: string; targetMastery: number },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(parentGoalInputSchema, args);
      await Promise.all([
        ensureCustomer(context, input.customerId),
        context.models.Topics.getTopic(input.topicId),
      ]);

      if (
        !(await context.models.ParentGoals.goalExists(input.customerId, input.topicId)) &&
        (await context.models.ParentGoals.goalCount(input.customerId)) >= 100
      ) {
        throw badInput("Нэг сурагчид хамгийн ихдээ 100 зорилт тохируулна");
      }

      const saved = await context.models.ParentGoals.saveGoal(input);

      return String(saved._id);
    },
    edututorParentGoalRemove: async (
      _parent: unknown,
      args: { customerId: string; goalId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(parentGoalRemoveSchema, args);
      await ensureCustomer(context, input.customerId);

      if (!(await context.models.ParentGoals.deleteGoal(input.goalId, input.customerId))) {
        throw badInput("Зорилт олдсонгүй");
      }

      return input.goalId;
    },
    edututorPracticeStart: async (
      _parent: unknown,
      args: { customerId: string; topicId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(startSchema, args);
      await Promise.all([
        ensureCustomer(context, input.customerId),
        context.models.Topics.getTopic(input.topicId),
      ]);

      const approved = await context.models.Problems.listApprovedByTopic(input.topicId, 100);

      if (approved.length < PRACTICE_PROBLEM_COUNT) {
        throw badInput(
          `Дадлага эхлүүлэхийн өмнө дор хаяж ${PRACTICE_PROBLEM_COUNT} бодлого батална уу`,
        );
      }

      const weakIds = await context.models.Attempts.recentWeakProblemIds(
        input.customerId,
        input.topicId,
      );
      const selected = selectPracticeProblemIds(
        approved.map((problem) => String(problem._id)),
        weakIds,
        PRACTICE_PROBLEM_COUNT,
      );
      const attempt = await context.models.Attempts.createAttempt({
        ...input,
        items: newAttemptItems(selected),
      });

      return sessionFor(context, attempt);
    },
    edututorPracticeAnswer: async (
      _parent: unknown,
      args: { attemptId: string; problemId: string; answer: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(answerSchema, args);
      const attempt = await context.models.Attempts.getAttempt(input.attemptId);
      attemptItem(attempt, input.problemId);

      const problem = await context.models.Problems.getProblem(input.problemId);

      if (problem.topicId !== attempt.topicId) {
        throw badInput("Бодлого болон дадлагын сэдэв таарахгүй байна");
      }

      const correct = isCorrect(problem.kind, problem.params, input.answer);
      const misconception = correct ? null : diagnose(problem.kind, problem.params, input.answer);
      const saved = await context.models.Attempts.recordAnswer({
        ...input,
        correct,
        misconception: misconception?.id,
      });

      return {
        correct,
        misconception: misconceptionPayload(misconception),
        lessonMoment: correct
          ? null
          : await lessonMomentFor(context, attempt.topicId, misconception),
        session: await sessionFor(context, saved),
      };
    },
    edututorPracticeHint: async (
      _parent: unknown,
      args: { attemptId: string; problemId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(itemSchema, args);
      const attempt = await context.models.Attempts.getAttempt(input.attemptId);
      attemptItem(attempt, input.problemId);

      const problem = await context.models.Problems.getProblem(input.problemId);
      const saved = await context.models.Attempts.takeHint(input.attemptId, input.problemId);
      const item = saved.items.find((candidate) => candidate.problemId === input.problemId);
      const level = item?.hintsUsed ?? 0;
      const hint = problem.hints[level - 1];

      if (!hint) throw badInput("Сэжүүр олдсонгүй");

      return {
        level,
        hint,
        remaining: Math.max(0, problem.hints.length - level),
        session: await sessionFor(context, saved),
      };
    },
    edututorPracticeRevealSolution: async (
      _parent: unknown,
      args: { attemptId: string; problemId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(itemSchema, args);
      const attempt = await context.models.Attempts.getAttempt(input.attemptId);
      attemptItem(attempt, input.problemId);
      const problem = await context.models.Problems.getProblem(input.problemId);

      if (problem.topicId !== attempt.topicId) {
        throw badInput("Бодлого болон дадлагын сэдэв таарахгүй байна");
      }

      return sessionFor(
        context,
        await context.models.Attempts.revealSolution(input.attemptId, input.problemId),
      );
    },
    edututorPracticeFinish: async (
      _parent: unknown,
      { attemptId }: { attemptId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const id = parse(idSchema, attemptId);
      const attempt = await context.models.Attempts.finishAttempt(id);
      const summary = calculatePracticeSummary(attempt.items);
      let feedback: PracticeFeedback;
      let completed = attempt;

      if (attempt.aiFeedback) {
        feedback = attempt.aiFeedback;
      } else {
        const progress = await context.models.Attempts.topicProgress(
          attempt.customerId,
          attempt.topicId,
        );
        const topicProgress = await Promise.all(
          progress.map(async ({ topicId, attempts, averageScore }) => ({
            name: (await context.models.Topics.getTopic(topicId)).name,
            attempts,
            averageScore,
          })),
        );
        feedback = await generatePracticeFeedback(topicProgress);
        completed = await context.models.Attempts.saveFeedback(id, feedback);
      }

      return {
        session: await sessionFor(context, completed),
        correctCount: summary.correctCount,
        total: summary.total,
        mastery: summary.mastery,
        feedback,
      };
    },
  },
};

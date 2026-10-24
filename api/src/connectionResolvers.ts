import type { IMainContext } from "erxes-api-shared/core-types";
import { createGenerateModels } from "erxes-api-shared/utils";
import type { Connection } from "mongoose";
import type { IProblemDocument } from "./modules/problems/db/definitions/problem.ts";
import { type IProblemModel, loadProblemClass } from "./modules/problems/db/models/Problem.ts";
import type { IAttemptDocument } from "./modules/practice/db/definitions/attempt.ts";
import { type IAttemptModel, loadAttemptClass } from "./modules/practice/db/models/Attempt.ts";
import type { IParentGoalDocument } from "./modules/practice/db/definitions/parentGoal.ts";
import {
  type IParentGoalModel,
  loadParentGoalClass,
} from "./modules/practice/db/models/ParentGoal.ts";
import type { ITopicDocument } from "./modules/topics/db/definitions/topic.ts";
import { type ITopicModel, loadTopicClass } from "./modules/topics/db/models/Topic.ts";

export interface IModels {
  Topics: ITopicModel;
  Problems: IProblemModel;
  Attempts: IAttemptModel;
  ParentGoals: IParentGoalModel;
}

/**
 * GraphQL resolver context: what `apolloServerContext` in main.ts returns.
 * `subdomain` is the tenant, `models` are bound to that tenant's database.
 */
// IMainContext declares `models?: any`, which would absorb the typed IModels
// in a plain intersection — Omit it first so resolvers get real types.
export type Context = Omit<IMainContext, "models"> & {
  subdomain: string;
  models: IModels;
};

// Every model must come from this factory: createGenerateModels binds the
// connection for the request's tenant (Mongo `useDb` per organization on
// SaaS), so resolvers never touch another tenant's collections.
const loadClasses = (db: Connection) => {
  const models = {} as IModels;

  models.Problems = db.model<IProblemDocument, IProblemModel>(
    "edututor_problems",
    loadProblemClass(models),
  );
  models.Attempts = db.model<IAttemptDocument, IAttemptModel>(
    "edututor_attempts",
    loadAttemptClass(models),
  );
  models.ParentGoals = db.model<IParentGoalDocument, IParentGoalModel>(
    "edututor_parent_goals",
    loadParentGoalClass(models),
  );
  models.Topics = db.model<ITopicDocument, ITopicModel>("edututor_topics", loadTopicClass(models));

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);

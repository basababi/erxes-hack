import type { IMainContext } from "erxes-api-shared/core-types";
import { createGenerateModels } from "erxes-api-shared/utils";
import type { Connection } from "mongoose";
import { type ITopicModel, loadTopicClass } from "./modules/topics/db/models/Topic.ts";
import type { ITopicDocument } from "./modules/topics/db/definitions/topic.ts";

export interface IModels {
  Topics: ITopicModel;
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

  models.Topics = db.model<ITopicDocument, ITopicModel>("edututor_topics", loadTopicClass(models));

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);

import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";

export interface IParentGoal {
  customerId: string;
  topicId: string;
  targetMastery: number;
  createdAt: Date;
}

export interface IParentGoalDocument extends IParentGoal, Document<string> {}

export const parentGoalSchema = schemaWrapper(
  new Schema({
    customerId: { type: String, required: true, index: true },
    topicId: { type: String, required: true, index: true },
    targetMastery: { type: Number, required: true, min: 50, max: 100 },
    createdAt: { type: Date, required: true, default: Date.now },
  }).index({ customerId: 1, topicId: 1 }, { unique: true }),
);

import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";
import { ATTEMPT_STATUSES, type AttemptStatus, MAX_HINTS } from "../../constants.ts";

export interface IAttemptItem {
  problemId: string;
  answer?: string;
  correct?: boolean;
  misconception?: string;
  hintsUsed: number;
  firstTry?: boolean;
}

export interface IAttempt {
  customerId: string;
  topicId: string;
  items: IAttemptItem[];
  score: number;
  status: AttemptStatus;
  startedAt: Date;
  finishedAt?: Date;
}

export interface IAttemptDocument extends IAttempt, Document<string> {}

const attemptItemSchema = new Schema(
  {
    problemId: { type: String, required: true },
    answer: { type: String, trim: true, maxlength: 100 },
    correct: Boolean,
    misconception: String,
    hintsUsed: { type: Number, required: true, default: 0, min: 0, max: MAX_HINTS },
    firstTry: Boolean,
  },
  { _id: false },
);

export const attemptSchema = schemaWrapper(
  new Schema({
    customerId: { type: String, required: true, index: true },
    topicId: { type: String, required: true, index: true },
    items: {
      type: [attemptItemSchema],
      required: true,
      validate: {
        validator: (items: IAttemptItem[]) => items.length > 0,
        message: "Practice attempt needs at least one problem",
      },
    },
    score: { type: Number, required: true, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: "active" },
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: Date,
  })
    .index({ customerId: 1, topicId: 1, startedAt: -1 })
    .index({ topicId: 1, status: 1 }),
);

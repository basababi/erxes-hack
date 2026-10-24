import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";
import { TOPIC_KINDS } from "../../../topics/constants.ts";
import {
  DIFFICULTIES,
  PROBLEM_SOURCES,
  PROBLEM_STATUSES,
  type ProblemSource,
  type ProblemStatus,
} from "../../constants.ts";
import type { Difficulty, Params, ProblemKind } from "../../engineAdapter.ts";

export interface IProblemVerification {
  ok: boolean;
  reason?: string;
}

export interface IProblem {
  topicId: string;
  kind: ProblemKind;
  difficulty: Difficulty;
  params: Params;
  statement: string;
  // Computed by the engine, never by the model; teacher-only.
  answer: string;
  hints: string[];
  status: ProblemStatus;
  verification: IProblemVerification;
  source: ProblemSource;
}

export interface IProblemDocument extends IProblem, Document<string> {
  createdAt: Date;
}

export const problemSchema = schemaWrapper(
  new Schema({
    topicId: { type: String, required: true },
    kind: { type: String, enum: TOPIC_KINDS, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    params: { type: Schema.Types.Mixed, required: true },
    statement: { type: String, required: true },
    answer: { type: String, required: true },
    hints: {
      type: [String],
      validate: { validator: (hints: string[]) => hints.length === 3, message: "3 hints required" },
    },
    status: { type: String, enum: PROBLEM_STATUSES, required: true },
    verification: {
      type: new Schema({ ok: { type: Boolean, required: true }, reason: String }, { _id: false }),
      required: true,
    },
    source: { type: String, enum: PROBLEM_SOURCES, required: true },
    createdAt: { type: Date, default: Date.now },
  }).index({ topicId: 1, status: 1, createdAt: -1 }),
);

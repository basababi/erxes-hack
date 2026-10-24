import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";
import { TOPIC_KINDS, type TopicKind } from "../../constants.ts";

export interface ITopic {
  name: string;
  description?: string;
  gradeLevel?: number;
  kind: TopicKind;
}

// schemaWrapper generates string ids, not ObjectIds.
export interface ITopicDocument extends ITopic, Document<string> {
  createdAt: Date;
}

export const topicSchema = schemaWrapper(
  new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    gradeLevel: { type: Number, min: 1, max: 12 },
    kind: { type: String, enum: TOPIC_KINDS, required: true },
    createdAt: { type: Date, default: Date.now },
  }),
);

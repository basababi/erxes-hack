import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";
import { TOPIC_KINDS, type TopicKind } from "../../constants.ts";

// A moment in the lesson video that explains one misconception.
export interface ILessonChapter {
  misconception: string;
  atSeconds: number;
  title: string;
}

export interface ILesson {
  videoUrl?: string;
  chapters: ILessonChapter[];
}

export interface ITopic {
  name: string;
  description?: string;
  gradeLevel?: number;
  kind: TopicKind;
}

// schemaWrapper generates string ids, not ObjectIds.
export interface ITopicDocument extends ITopic, Document<string> {
  lesson?: ILesson;
  createdAt: Date;
}

const lessonSchema = new Schema(
  {
    videoUrl: { type: String, trim: true },
    chapters: [
      new Schema(
        {
          misconception: { type: String, required: true },
          atSeconds: { type: Number, required: true, min: 0 },
          title: { type: String, required: true, trim: true },
        },
        { _id: false },
      ),
    ],
  },
  { _id: false },
);

export const topicSchema = schemaWrapper(
  new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    gradeLevel: { type: Number, min: 1, max: 12 },
    kind: { type: String, enum: TOPIC_KINDS, required: true },
    lesson: { type: lessonSchema },
    createdAt: { type: Date, default: Date.now },
  }),
);

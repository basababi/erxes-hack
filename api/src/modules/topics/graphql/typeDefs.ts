import { gql } from "graphql-tag";

export const topicTypeDefs = gql`
  enum EdututorTopicKind {
    linear_equation
    percent_of
    fraction_add
  }

  type EdututorLessonChapter {
    misconception: String!
    atSeconds: Int!
    title: String!
  }

  type EdututorLesson {
    videoUrl: String
    chapters: [EdututorLessonChapter!]!
  }

  type EdututorTopic {
    _id: String!
    name: String!
    description: String
    gradeLevel: Int
    kind: EdututorTopicKind!
    lesson: EdututorLesson
    createdAt: String
  }

  input EdututorTopicInput {
    name: String!
    description: String
    gradeLevel: Int
    kind: EdututorTopicKind!
  }

  input EdututorLessonChapterInput {
    misconception: String!
    atSeconds: Int!
    title: String!
  }

  input EdututorLessonInput {
    videoUrl: String
    chapters: [EdututorLessonChapterInput!]!
  }

  extend type Query {
    edututorTopics(limit: Int = 50, offset: Int = 0): [EdututorTopic!]!
    edututorTopicDetail(_id: String!): EdututorTopic!
  }

  extend type Mutation {
    edututorTopicAdd(input: EdututorTopicInput!): EdututorTopic!
    edututorTopicEdit(_id: String!, input: EdututorTopicInput!): EdututorTopic!
    edututorTopicLessonSave(_id: String!, lesson: EdututorLessonInput!): EdututorTopic!
    edututorTopicRemove(_id: String!): String!
  }
`;

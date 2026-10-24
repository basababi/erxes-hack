import { gql } from "graphql-tag";

export const problemTypeDefs = gql`
  scalar JSON

  enum EdututorDifficulty {
    easy
    medium
    hard
  }

  enum EdututorProblemStatus {
    draft
    approved
    rejected
  }

  enum EdututorProblemSource {
    template
    gemma
  }

  type EdututorVerification {
    ok: Boolean!
    reason: String
  }

  "Teacher view: includes the answer and hints. Never return it to students."
  type EdututorProblem {
    _id: String!
    topicId: String!
    kind: EdututorTopicKind!
    difficulty: EdututorDifficulty!
    params: JSON!
    statement: String!
    answer: String!
    hints: [String!]!
    status: EdututorProblemStatus!
    verification: EdututorVerification!
    source: EdututorProblemSource!
    createdAt: String
  }

  type EdututorProblemsGenerateResult {
    problems: [EdututorProblem!]!
    usedAi: Boolean!
    "Why AI wording was skipped or partial, if it was."
    notice: String
  }

  type EdututorMisconception {
    id: String!
    kind: EdututorTopicKind!
    title: String!
    message: String!
  }

  extend type Query {
    edututorProblems(
      topicId: String!
      status: EdututorProblemStatus
      limit: Int = 50
      offset: Int = 0
    ): [EdututorProblem!]!
    edututorMisconceptions(kind: EdututorTopicKind!): [EdututorMisconception!]!
  }

  extend type Mutation {
    edututorProblemsGenerate(
      topicId: String!
      count: Int = 3
      difficulty: EdututorDifficulty = medium
      useAi: Boolean = true
    ): EdututorProblemsGenerateResult!
    edututorProblemApprove(_id: String!): EdututorProblem!
    edututorProblemReject(_id: String!): EdututorProblem!
  }
`;

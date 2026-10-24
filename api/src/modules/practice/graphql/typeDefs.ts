import { gql } from "graphql-tag";

export const practiceTypeDefs = gql`
  enum EdututorAttemptStatus {
    active
    finished
  }

  "Safe student view. Answers, parameters and private hint arrays are deliberately absent."
  type EdututorStudentProblem {
    _id: String!
    topicId: String!
    difficulty: EdututorDifficulty!
    statement: String!
  }

  type EdututorPracticeItem {
    problem: EdututorStudentProblem!
    answered: Boolean!
    correct: Boolean
    hintsUsed: Int!
    firstTry: Boolean
    "Only hints this student has explicitly requested."
    revealedHints: [String!]!
  }

  type EdututorPracticeSession {
    attemptId: String!
    customerId: String!
    topicId: String!
    items: [EdututorPracticeItem!]!
    answeredCount: Int!
    correctCount: Int!
    total: Int!
    score: Int!
    mastery: Int!
    status: EdututorAttemptStatus!
    startedAt: String!
    finishedAt: String
  }

  type EdututorLessonMoment {
    videoUrl: String!
    atSeconds: Int!
    title: String!
  }

  type EdututorPracticeAnswerResult {
    correct: Boolean!
    misconception: EdututorMisconception
    lessonMoment: EdututorLessonMoment
    session: EdututorPracticeSession!
  }

  type EdututorPracticeHintResult {
    level: Int!
    hint: String!
    remaining: Int!
    session: EdututorPracticeSession!
  }

  type EdututorPracticeFinishResult {
    session: EdututorPracticeSession!
    correctCount: Int!
    total: Int!
    mastery: Int!
  }

  extend type Query {
    edututorPracticeAttempt(_id: String!): EdututorPracticeSession!
  }

  extend type Mutation {
    edututorPracticeStart(customerId: String!, topicId: String!): EdututorPracticeSession!
    edututorPracticeAnswer(
      attemptId: String!
      problemId: String!
      answer: String!
    ): EdututorPracticeAnswerResult!
    edututorPracticeHint(attemptId: String!, problemId: String!): EdututorPracticeHintResult!
    edututorPracticeFinish(attemptId: String!): EdututorPracticeFinishResult!
  }
`;

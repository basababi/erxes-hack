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
    solutionViewed: Boolean!
    firstTry: Boolean
    "Only hints this student has explicitly requested."
    revealedHints: [String!]!
    solution: EdututorWorkedSolution
    misconception: EdututorMisconception
    lessonMoment: EdututorLessonMoment
  }

  type EdututorWorkedSolution {
    answer: String!
    steps: [String!]!
  }

  type EdututorPracticeFeedback {
    strengths: [String!]!
    needsPractice: [String!]!
    recommendation: String!
    parentAdvice: String
    careerGuidance: [EdututorCareerGuidance!]
    generatedByAi: Boolean!
    notice: String
  }

  type EdututorCareerGuidance {
    title: String!
    rationale: String!
    tryNext: String!
  }

  type EdututorParentTopicProgress {
    topicId: String!
    name: String!
    attempts: Int!
    averageScore: Int!
  }

  type EdututorParentGoal {
    id: String!
    topicId: String!
    topicName: String!
    targetMastery: Int!
    currentMastery: Int!
    completed: Boolean!
  }

  type EdututorParentProgress {
    customerId: String!
    completedSessions: Int!
    averageScore: Int!
    totalXp: Int!
    topics: [EdututorParentTopicProgress!]!
    goals: [EdututorParentGoal!]!
    latestFeedback: EdututorPracticeFeedback
  }

  type EdututorPracticeBadge {
    id: String!
    title: String!
    description: String!
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
    xpEarned: Int!
    totalXp: Int!
    badges: [EdututorPracticeBadge!]!
    aiFeedback: EdututorPracticeFeedback
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
    feedback: EdututorPracticeFeedback!
  }

  extend type Query {
    edututorPracticeAttempt(_id: String!): EdututorPracticeSession!
    edututorParentProgress(customerId: String!): EdututorParentProgress!
  }

  extend type Mutation {
    edututorParentGoalSave(customerId: String!, topicId: String!, targetMastery: Int!): String!
    edututorParentGoalRemove(customerId: String!, goalId: String!): String!
    edututorPracticeStart(customerId: String!, topicId: String!): EdututorPracticeSession!
    edututorPracticeAnswer(
      attemptId: String!
      problemId: String!
      answer: String!
    ): EdututorPracticeAnswerResult!
    edututorPracticeHint(attemptId: String!, problemId: String!): EdututorPracticeHintResult!
    edututorPracticeRevealSolution(attemptId: String!, problemId: String!): EdututorPracticeSession!
    edututorPracticeFinish(attemptId: String!): EdututorPracticeFinishResult!
  }
`;

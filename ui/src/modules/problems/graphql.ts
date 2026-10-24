import { gql } from "~/gql";

export const PROBLEMS_QUERY = gql(`
  query edututorProblems($topicId: String!, $status: EdututorProblemStatus) {
    edututorProblems(topicId: $topicId, status: $status, limit: 100) {
      _id
      difficulty
      statement
      answer
      hints
      status
      verification {
        ok
        reason
      }
      source
      createdAt
    }
  }
`);

export const MISCONCEPTIONS_QUERY = gql(`
  query edututorMisconceptions($kind: EdututorTopicKind!) {
    edututorMisconceptions(kind: $kind) {
      id
      title
      message
    }
  }
`);

export const PROBLEMS_GENERATE_MUTATION = gql(`
  mutation edututorProblemsGenerate(
    $topicId: String!
    $count: Int!
    $difficulty: EdututorDifficulty!
    $useAi: Boolean!
  ) {
    edututorProblemsGenerate(
      topicId: $topicId
      count: $count
      difficulty: $difficulty
      useAi: $useAi
    ) {
      usedAi
      notice
      problems {
        _id
        status
      }
    }
  }
`);

export const PROBLEM_APPROVE_MUTATION = gql(`
  mutation edututorProblemApprove($_id: String!) {
    edututorProblemApprove(_id: $_id) {
      _id
      status
    }
  }
`);

export const PROBLEM_REJECT_MUTATION = gql(`
  mutation edututorProblemReject($_id: String!) {
    edututorProblemReject(_id: $_id) {
      _id
      status
    }
  }
`);

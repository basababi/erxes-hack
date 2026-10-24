import { gql } from "~/gql";

export const PRACTICE_ATTEMPT_QUERY = gql(`
  query edututorPracticeAttempt($_id: String!) {
    edututorPracticeAttempt(_id: $_id) {
      attemptId
      customerId
      topicId
      answeredCount
      correctCount
      total
      score
      mastery
      status
      startedAt
      finishedAt
      items {
        answered
        correct
        hintsUsed
        firstTry
        revealedHints
        problem {
          _id
          topicId
          difficulty
          statement
        }
      }
    }
  }
`);

export const PRACTICE_START_MUTATION = gql(`
  mutation edututorPracticeStart($customerId: String!, $topicId: String!) {
    edututorPracticeStart(customerId: $customerId, topicId: $topicId) {
      attemptId
      customerId
      topicId
      answeredCount
      correctCount
      total
      score
      mastery
      status
      startedAt
      finishedAt
      items {
        answered
        correct
        hintsUsed
        firstTry
        revealedHints
        problem {
          _id
          topicId
          difficulty
          statement
        }
      }
    }
  }
`);

export const PRACTICE_ANSWER_MUTATION = gql(`
  mutation edututorPracticeAnswer($attemptId: String!, $problemId: String!, $answer: String!) {
    edututorPracticeAnswer(attemptId: $attemptId, problemId: $problemId, answer: $answer) {
      correct
      misconception {
        id
        title
        message
      }
      lessonMoment {
        videoUrl
        atSeconds
        title
      }
      session {
        attemptId
        customerId
        topicId
        answeredCount
        correctCount
        total
        score
        mastery
        status
        startedAt
        finishedAt
        items {
          answered
          correct
          hintsUsed
          firstTry
          revealedHints
          problem {
            _id
            topicId
            difficulty
            statement
          }
        }
      }
    }
  }
`);

export const PRACTICE_HINT_MUTATION = gql(`
  mutation edututorPracticeHint($attemptId: String!, $problemId: String!) {
    edututorPracticeHint(attemptId: $attemptId, problemId: $problemId) {
      level
      hint
      remaining
      session {
        attemptId
        customerId
        topicId
        answeredCount
        correctCount
        total
        score
        mastery
        status
        startedAt
        finishedAt
        items {
          answered
          correct
          hintsUsed
          firstTry
          revealedHints
          problem {
            _id
            topicId
            difficulty
            statement
          }
        }
      }
    }
  }
`);

export const PRACTICE_FINISH_MUTATION = gql(`
  mutation edututorPracticeFinish($attemptId: String!) {
    edututorPracticeFinish(attemptId: $attemptId) {
      correctCount
      total
      mastery
      session {
        attemptId
        customerId
        topicId
        answeredCount
        correctCount
        total
        score
        mastery
        status
        startedAt
        finishedAt
        items {
          answered
          correct
          hintsUsed
          firstTry
          revealedHints
          problem {
            _id
            topicId
            difficulty
            statement
          }
        }
      }
    }
  }
`);

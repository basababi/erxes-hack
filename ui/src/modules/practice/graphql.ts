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
      xpEarned
      totalXp
      badges {
        id
        title
        description
      }
      aiFeedback {
        strengths
        needsPractice
        recommendation
        parentAdvice
        careerGuidance {
          title
          rationale
          tryNext
        }
        generatedByAi
        notice
      }
      status
      startedAt
      finishedAt
      items {
        answered
        correct
        hintsUsed
        solutionViewed
        firstTry
        revealedHints
        solution {
          answer
          steps
        }
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
      xpEarned
      totalXp
      badges {
        id
        title
        description
      }
      status
      startedAt
      finishedAt
      items {
        answered
        correct
        hintsUsed
        solutionViewed
        firstTry
        revealedHints
        solution {
          answer
          steps
        }
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

export const PRACTICE_APPROVED_PROBLEMS_QUERY = gql(`
  query edututorPracticeApprovedProblems($topicId: String!) {
    edututorProblems(topicId: $topicId, status: approved, limit: 100) {
      _id
      verification {
        ok
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
        xpEarned
        totalXp
        badges {
          id
          title
          description
        }
        status
        startedAt
        finishedAt
        items {
          answered
          correct
          hintsUsed
          solutionViewed
          firstTry
          revealedHints
          solution {
            answer
            steps
          }
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
        xpEarned
        totalXp
        badges {
          id
          title
          description
        }
        status
        startedAt
        finishedAt
        items {
          answered
          correct
          hintsUsed
          solutionViewed
          firstTry
          revealedHints
          solution {
            answer
            steps
          }
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
      feedback {
        strengths
        needsPractice
        recommendation
        parentAdvice
        careerGuidance {
          title
          rationale
          tryNext
        }
        generatedByAi
        notice
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
        xpEarned
        totalXp
        badges {
          id
          title
          description
        }
        status
        startedAt
        finishedAt
        items {
          answered
          correct
          hintsUsed
          solutionViewed
          firstTry
          revealedHints
          solution {
            answer
            steps
          }
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

export const PARENT_PROGRESS_QUERY = gql(`
  query edututorParentProgress($customerId: String!) {
    edututorParentProgress(customerId: $customerId) {
      customerId
      completedSessions
      averageScore
      totalXp
      topics {
        topicId
        name
        attempts
        averageScore
      }
      goals {
        id
        topicId
        topicName
        targetMastery
        currentMastery
        completed
      }
      latestFeedback {
        parentAdvice
        notice
        generatedByAi
      }
    }
  }
`);

export const PARENT_GOAL_SAVE_MUTATION = gql(`
  mutation edututorParentGoalSave(
    $customerId: String!
    $topicId: String!
    $targetMastery: Int!
  ) {
    edututorParentGoalSave(
      customerId: $customerId
      topicId: $topicId
      targetMastery: $targetMastery
    )
  }
`);

export const PARENT_GOAL_REMOVE_MUTATION = gql(`
  mutation edututorParentGoalRemove($customerId: String!, $goalId: String!) {
    edututorParentGoalRemove(customerId: $customerId, goalId: $goalId)
  }
`);

export const PRACTICE_REVEAL_SOLUTION_MUTATION = gql(`
  mutation edututorPracticeRevealSolution($attemptId: String!, $problemId: String!) {
    edututorPracticeRevealSolution(attemptId: $attemptId, problemId: $problemId) {
      attemptId
      customerId
      topicId
      answeredCount
      correctCount
      total
      score
      mastery
      xpEarned
      totalXp
      badges {
        id
        title
        description
      }
      status
      startedAt
      finishedAt
      items {
        answered
        correct
        hintsUsed
        solutionViewed
        firstTry
        revealedHints
        solution {
          answer
          steps
        }
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

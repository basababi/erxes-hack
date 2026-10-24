import { gql } from "~/gql";

// Operation names are global across erxes; keep the plugin prefix.
export const TOPICS_QUERY = gql(`
  query edututorTopics($limit: Int!, $offset: Int!) {
    edututorTopics(limit: $limit, offset: $offset) {
      _id
      name
      description
      gradeLevel
      kind
      lesson {
        videoUrl
      }
      createdAt
    }
  }
`);

export const TOPIC_DETAIL_QUERY = gql(`
  query edututorTopicDetail($_id: String!) {
    edututorTopicDetail(_id: $_id) {
      _id
      name
      description
      gradeLevel
      kind
      lesson {
        videoUrl
        chapters {
          misconception
          atSeconds
          title
        }
      }
      createdAt
    }
  }
`);

export const TOPIC_LESSON_SAVE_MUTATION = gql(`
  mutation edututorTopicLessonSave($_id: String!, $lesson: EdututorLessonInput!) {
    edututorTopicLessonSave(_id: $_id, lesson: $lesson) {
      _id
      lesson {
        videoUrl
        chapters {
          misconception
          atSeconds
          title
        }
      }
    }
  }
`);

export const TOPIC_ADD_MUTATION = gql(`
  mutation edututorTopicAdd($input: EdututorTopicInput!) {
    edututorTopicAdd(input: $input) {
      _id
      name
      description
      gradeLevel
      kind
      createdAt
    }
  }
`);

export const TOPIC_EDIT_MUTATION = gql(`
  mutation edututorTopicEdit($_id: String!, $input: EdututorTopicInput!) {
    edututorTopicEdit(_id: $_id, input: $input) {
      _id
      name
      description
      gradeLevel
      kind
      createdAt
    }
  }
`);

export const TOPIC_REMOVE_MUTATION = gql(`
  mutation edututorTopicRemove($_id: String!) {
    edututorTopicRemove(_id: $_id)
  }
`);

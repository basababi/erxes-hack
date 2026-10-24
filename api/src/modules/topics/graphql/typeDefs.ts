import { gql } from "graphql-tag";

export const topicTypeDefs = gql`
  enum EdututorTopicKind {
    linear_equation
    percent_of
    fraction_add
  }

  type EdututorTopic {
    _id: String!
    name: String!
    description: String
    gradeLevel: Int
    kind: EdututorTopicKind!
    createdAt: String
  }

  input EdututorTopicInput {
    name: String!
    description: String
    gradeLevel: Int
    kind: EdututorTopicKind!
  }

  extend type Query {
    edututorTopics(limit: Int = 50, offset: Int = 0): [EdututorTopic!]!
    edututorTopicDetail(_id: String!): EdututorTopic!
  }

  extend type Mutation {
    edututorTopicAdd(input: EdututorTopicInput!): EdututorTopic!
    edututorTopicEdit(_id: String!, input: EdututorTopicInput!): EdututorTopic!
    edututorTopicRemove(_id: String!): String!
  }
`;

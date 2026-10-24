import { gql } from "graphql-tag";
import { manifest } from "../config.ts";
import type { Context } from "../connectionResolvers.ts";
import { problemResolvers } from "../modules/problems/graphql/resolvers.ts";
import { problemTypeDefs } from "../modules/problems/graphql/typeDefs.ts";
import { practiceResolvers } from "../modules/practice/graphql/resolvers.ts";
import { practiceTypeDefs } from "../modules/practice/graphql/typeDefs.ts";
import { topicResolvers } from "../modules/topics/graphql/resolvers.ts";
import { topicTypeDefs } from "../modules/topics/graphql/typeDefs.ts";

// Every type and operation is prefixed with the plugin name: the gateway
// composes all plugins into one supergraph, so names must be unique across it.
// Modules extend the root Query/Mutation declared here.
const baseTypeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.9", import: ["@key"])

  type EdututorStatus {
    plugin: String!
    version: String!
    subdomain: String!
    userId: String
    userEmail: String
  }

  type Query {
    edututorStatus: EdututorStatus!
  }
`;

export const typeDefs = gql`
  ${baseTypeDefs}
  ${topicTypeDefs}
  ${problemTypeDefs}
  ${practiceTypeDefs}
`;

export const resolvers = {
  Query: {
    edututorStatus: (_parent: unknown, _args: unknown, { subdomain, user }: Context) => ({
      plugin: manifest.name,
      version: manifest.version,
      subdomain,
      userId: user?._id ?? null,
      userEmail: user?.email ?? null,
    }),
    ...topicResolvers.Query,
    ...problemResolvers.Query,
    ...practiceResolvers.Query,
  },
  Mutation: {
    ...topicResolvers.Mutation,
    ...problemResolvers.Mutation,
    ...practiceResolvers.Mutation,
  },
};

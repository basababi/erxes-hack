import assert from "node:assert/strict";
import test from "node:test";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { isObjectType } from "graphql";
import { resolvers, typeDefs } from "../src/graphql/schema.ts";

test("student GraphQL problem never exposes answers, params, or the private hint array", () => {
  const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);
  const type = schema.getType("EdututorStudentProblem");

  assert.equal(isObjectType(type), true);
  if (!isObjectType(type)) return;

  const fields = Object.keys(type.getFields());
  assert.deepEqual(fields.sort(), ["_id", "difficulty", "statement", "topicId"].sort());
  assert.equal(fields.includes("answer"), false);
  assert.equal(fields.includes("hints"), false);
  assert.equal(fields.includes("params"), false);
});

test("practice items expose the persisted diagnosis and lesson moment without a private answer", () => {
  const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);
  const type = schema.getType("EdututorPracticeItem");

  assert.equal(isObjectType(type), true);
  if (!isObjectType(type)) return;

  const fields = Object.keys(type.getFields());
  assert.equal(fields.includes("misconception"), true);
  assert.equal(fields.includes("lessonMoment"), true);
  assert.equal(fields.includes("solutionViewed"), true);
  assert.equal(fields.includes("solution"), true);
  assert.equal(fields.includes("answer"), false);
});

test("finished sessions can restore their persisted learning feedback", () => {
  const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);
  const type = schema.getType("EdututorPracticeSession");

  assert.equal(isObjectType(type), true);
  if (!isObjectType(type)) return;

  assert.equal(Object.keys(type.getFields()).includes("aiFeedback"), true);
});

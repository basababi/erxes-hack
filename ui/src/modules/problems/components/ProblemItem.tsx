import { useMutation } from "@apollo/client";
import { IconCheck, IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import { Badge, Button, Card, Spinner, useToast } from "erxes-ui";
import type { EdututorProblemsQuery } from "~/gql/graphql";
import { DIFFICULTY_LABELS, PROBLEM_SOURCE_LABELS } from "../constants";
import { PROBLEM_APPROVE_MUTATION, PROBLEM_REJECT_MUTATION } from "../graphql";

export type ProblemRow = EdututorProblemsQuery["edututorProblems"][number];

// A status change moves the problem to another tab, so refetch every list.
const REFETCH = { refetchQueries: ["edututorProblems"], awaitRefetchQueries: true };

export const ProblemItem = ({ problem }: { problem: ProblemRow }) => {
  const { toast } = useToast();
  const [approve, { loading: approving }] = useMutation(PROBLEM_APPROVE_MUTATION, REFETCH);
  const [reject, { loading: rejecting }] = useMutation(PROBLEM_REJECT_MUTATION, REFETCH);
  const { _id, status, verification } = problem;

  const run = async (action: "approve" | "reject") => {
    try {
      await (action === "approve" ? approve : reject)({ variables: { _id } });
      toast({
        variant: "success",
        title: action === "approve" ? "Бодлого батлагдлаа" : "Бодлого татгалзагдлаа",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Төлөв өөрчилж чадсангүй",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <Card>
      <Card.Header className="edututor:gap-2">
        <div className="edututor:flex edututor:flex-wrap edututor:gap-1.5">
          <Badge variant={problem.source === "gemma" ? "info" : "secondary"}>
            {PROBLEM_SOURCE_LABELS[problem.source]}
          </Badge>
          <Badge variant="secondary">{DIFFICULTY_LABELS[problem.difficulty]}</Badge>
          {verification.ok ? (
            <Badge variant="success">
              <IconCircleCheck className="edututor:size-3" />
              Шалгагч баталсан
            </Badge>
          ) : (
            <Badge variant="destructive">
              <IconCircleX className="edututor:size-3" />
              {verification.reason ?? "Шалгагчид тэнцээгүй"}
            </Badge>
          )}
        </div>
        <Card.Title className="edututor:text-base edututor:leading-relaxed">
          {problem.statement}
        </Card.Title>
      </Card.Header>
      <Card.Content className="edututor:flex edututor:flex-col edututor:gap-3 edututor:text-sm">
        <p>
          <span className="edututor:text-muted-foreground">Хариу: </span>
          <span className="edututor:font-medium">{problem.answer}</span>
        </p>
        <ol className="edututor:list-decimal edututor:space-y-1 edututor:pl-5">
          {problem.hints.map((hint, index) => (
            <li key={index}>
              <span className="edututor:text-muted-foreground">Сэжүүр {index + 1}: </span>
              {hint}
            </li>
          ))}
        </ol>
        <div className="edututor:flex edututor:flex-wrap edututor:justify-end edututor:gap-2">
          {status !== "rejected" && (
            <Button variant="outline" disabled={rejecting} onClick={() => run("reject")}>
              {rejecting ? <Spinner /> : <IconX />}
              Татгалзах
            </Button>
          )}
          {status !== "approved" && (
            <Button
              disabled={approving || !verification.ok}
              title={verification.ok ? undefined : "Шалгагчид тэнцээгүй бодлогыг батлахгүй"}
              onClick={() => run("approve")}
            >
              {approving ? <Spinner /> : <IconCheck />}
              Батлах
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

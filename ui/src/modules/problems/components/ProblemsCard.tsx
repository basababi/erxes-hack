import { useState } from "react";
import { useQuery } from "@apollo/client";
import { IconAlertTriangle, IconListCheck } from "@tabler/icons-react";
import { Button, Card, Empty, Skeleton, Tabs } from "erxes-ui";
import type { EdututorProblemStatus } from "~/gql/graphql";
import { PROBLEM_STATUS_LABELS, PROBLEM_STATUSES } from "../constants";
import { PROBLEMS_QUERY } from "../graphql";
import { ProblemGenerateForm } from "./ProblemGenerateForm";
import { ProblemItem } from "./ProblemItem";

const EMPTY_TEXT: Record<EdututorProblemStatus, string> = {
  draft: "Шинэ бодлого үүсгээд энд шалгаж батална.",
  approved: "Батлагдсан бодлого сурагчдад очно. Одоогоор алга.",
  rejected: "Шалгагчид тэнцээгүй эсвэл татгалзсан бодлого алга.",
};

const ProblemList = ({ topicId, status }: { topicId: string; status: EdututorProblemStatus }) => {
  // Tabs remount on switch; cache-and-network shows cached rows while a
  // status change made on another tab is fetched.
  const { data, loading, error, refetch } = useQuery(PROBLEMS_QUERY, {
    variables: { topicId, status },
    fetchPolicy: "cache-and-network",
  });
  const problems = data?.edututorProblems ?? [];

  if (error) {
    return (
      <Empty role="alert">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconAlertTriangle />
          </Empty.Media>
          <Empty.Title>Бодлогуудыг ачаалж чадсангүй</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
        <Button variant="outline" onClick={() => refetch()}>
          Дахин оролдох
        </Button>
      </Empty>
    );
  }

  if (loading && problems.length === 0) {
    return (
      <div role="status" className="edututor:flex edututor:flex-col edututor:gap-3">
        <Skeleton className="edututor:h-40 edututor:w-full" />
        <Skeleton className="edututor:h-40 edututor:w-full" />
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconListCheck />
          </Empty.Media>
          <Empty.Title>{PROBLEM_STATUS_LABELS[status]} бодлого алга</Empty.Title>
          <Empty.Description>{EMPTY_TEXT[status]}</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="edututor:flex edututor:flex-col edututor:gap-3">
      {problems.map((problem) => (
        <ProblemItem key={problem._id} problem={problem} />
      ))}
    </div>
  );
};

export const ProblemsCard = ({ topicId }: { topicId: string }) => {
  const [status, setStatus] = useState<EdututorProblemStatus>("draft");

  return (
    <Card>
      <Card.Header>
        <Card.Title>Бодлогууд</Card.Title>
        <Card.Description>
          Параметр ба хариуг код тооцоолно; Gemma зөвхөн нөхцөл, сэжүүрийг найруулна. Шалгагчид
          тэнцсэн бодлогыг л батална.
        </Card.Description>
      </Card.Header>
      <Card.Content className="edututor:flex edututor:flex-col edututor:gap-4">
        <ProblemGenerateForm topicId={topicId} />
        <Tabs
          value={status}
          onValueChange={(value) => {
            const next = PROBLEM_STATUSES.find((item) => item === value);

            if (next) setStatus(next);
          }}
        >
          <Tabs.List>
            {PROBLEM_STATUSES.map((item) => (
              <Tabs.Trigger key={item} value={item}>
                {PROBLEM_STATUS_LABELS[item]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {PROBLEM_STATUSES.map((item) => (
            <Tabs.Content key={item} value={item} className="edututor:pt-3">
              <ProblemList topicId={topicId} status={item} />
            </Tabs.Content>
          ))}
        </Tabs>
      </Card.Content>
    </Card>
  );
};

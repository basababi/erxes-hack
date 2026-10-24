import { useQuery } from "@apollo/client";
import { IconAlertTriangle, IconBook2 } from "@tabler/icons-react";
// Root imports on purpose: core-ui shares `erxes-ui`/`ui-modules` as Module
// Federation singletons keyed on the bare specifier, so deep imports would
// bundle second private copies instead of reusing the host's.
import { Badge, Breadcrumb, Button, Empty, Separator, Skeleton } from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link, useParams } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { LessonCard } from "../modules/lessons/components/LessonCard";
import { ProblemsCard } from "../modules/problems/components/ProblemsCard";
import { TOPIC_KIND_LABELS } from "../modules/topics/constants";
import { TOPIC_DETAIL_QUERY } from "../modules/topics/graphql";

const { path } = manifest.ui;

const TopicDetailContent = ({ topicId }: { topicId: string }) => {
  const { data, loading, error, refetch } = useQuery(TOPIC_DETAIL_QUERY, {
    variables: { _id: topicId },
  });
  const topic = data?.edututorTopicDetail;

  if (error) {
    return (
      <Empty className="edututor:m-6 edututor:min-h-80" role="alert">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconAlertTriangle />
          </Empty.Media>
          <Empty.Title>Сэдвийг ачаалж чадсангүй</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
        <div className="edututor:flex edututor:gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Дахин оролдох
          </Button>
          <Button variant="ghost" asChild>
            <Link to={`/${path}`}>Сэдвүүд рүү буцах</Link>
          </Button>
        </div>
      </Empty>
    );
  }

  if (loading || !topic) {
    return (
      <div role="status" className="edututor:flex edututor:flex-col edututor:gap-4 edututor:p-6">
        <Skeleton className="edututor:h-8 edututor:w-64" />
        <Skeleton className="edututor:h-72 edututor:w-full" />
        <Skeleton className="edututor:h-72 edututor:w-full" />
      </div>
    );
  }

  return (
    <div className="edututor:mx-auto edututor:flex edututor:w-full edututor:max-w-6xl edututor:flex-col edututor:gap-6 edututor:p-4 edututor:md:p-6">
      <section className="edututor:flex edututor:flex-col edututor:gap-2">
        <div className="edututor:flex edututor:flex-wrap edututor:items-center edututor:gap-2">
          <h1 className="edututor:text-xl edututor:font-semibold">{topic.name}</h1>
          <Badge variant="secondary">{TOPIC_KIND_LABELS[topic.kind]}</Badge>
          {topic.gradeLevel != null && <Badge variant="secondary">{topic.gradeLevel}-р анги</Badge>}
        </div>
        {topic.description && (
          <p className="edututor:text-sm edututor:text-muted-foreground">{topic.description}</p>
        )}
      </section>
      <div className="edututor:grid edututor:gap-6 edututor:lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Remount when the kind changes: chapters and misconceptions are per kind. */}
        <LessonCard key={topic.kind} topic={topic} />
        <ProblemsCard topicId={topic._id} />
      </div>
    </div>
  );
};

export const TopicDetailPage = () => {
  const { topicId = "" } = useParams();

  return (
    <div className="edututor:flex edututor:h-full edututor:flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="edututor:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/${path}`}>
                    <IconBook2 />
                    Сэдвүүд
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>Дэлгэрэнгүй</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
        </PageHeader.Start>
      </PageHeader>
      <div className="edututor:flex-1 edututor:overflow-auto">
        <TopicDetailContent topicId={topicId} />
      </div>
    </div>
  );
};

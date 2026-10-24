import { useMutation, useQuery } from "@apollo/client";
import { IconPlayerPlay } from "@tabler/icons-react";
import { Button, Card, Select, Spinner, useToast } from "erxes-ui";
import { useState } from "react";
import { Link } from "react-router";
import { SelectCustomer } from "ui-modules";
import manifest from "../../../../../erxes.json" with { type: "json" };
import { TOPICS_QUERY } from "../../topics/graphql";
import { TOPIC_KIND_LABELS } from "../../topics/constants";
import { PRACTICE_APPROVED_PROBLEMS_QUERY, PRACTICE_START_MUTATION } from "../graphql";

const { path } = manifest.ui;
const REQUIRED_PROBLEM_COUNT = 5;

const videoEmbedUrl = (value?: string | null) => {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return null;

    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) {
      const id =
        url.hostname === "youtu.be"
          ? url.pathname.slice(1)
          : url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).at(-1);

      return id && /^[\w-]{11}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null;
    }

    if (url.hostname === "drive.google.com") {
      const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1];

      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
  } catch {
    return null;
  }

  return null;
};

export const PracticeSetup = ({
  initialTopicId,
  onStarted,
}: {
  initialTopicId?: string;
  onStarted: (attemptId: string) => void;
}) => {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState("");
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const {
    data,
    loading: topicsLoading,
    error: topicsError,
  } = useQuery(TOPICS_QUERY, {
    variables: { limit: 100, offset: 0 },
  });
  const [start, { loading }] = useMutation(PRACTICE_START_MUTATION);
  const {
    data: approvedProblemsData,
    loading: approvedProblemsLoading,
    error: approvedProblemsError,
    refetch: refetchApprovedProblems,
  } = useQuery(PRACTICE_APPROVED_PROBLEMS_QUERY, {
    variables: { topicId },
    skip: !topicId,
    fetchPolicy: "cache-and-network",
  });
  const topics = data?.edututorTopics ?? [];
  const selectedTopic = topics.find((topic) => topic._id === topicId);
  const videoUrl = videoEmbedUrl(selectedTopic?.lesson?.videoUrl);
  const approvedProblemCount =
    approvedProblemsData?.edututorProblems.filter((problem) => problem.verification.ok).length ?? 0;
  const canStart =
    Boolean(customerId) &&
    Boolean(topicId) &&
    !loading &&
    !approvedProblemsLoading &&
    !approvedProblemsError &&
    approvedProblemCount >= REQUIRED_PROBLEM_COUNT;

  const handleStart = async () => {
    if (!customerId || !topicId) return;

    try {
      const { data: result } = await start({ variables: { customerId, topicId } });
      const attemptId = result?.edututorPracticeStart.attemptId;

      if (attemptId) onStarted(attemptId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Дадлага эхлүүлж чадсангүй",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <Card className="edututor:mx-auto edututor:w-full edututor:max-w-xl">
      <Card.Header>
        <Card.Title>Сурагчаар турших</Card.Title>
        <Card.Description>
          erxes Contacts-оос сурагч, дараа нь 5-аас доошгүй батлагдсан бодлоготой сэдэв сонгоно.
        </Card.Description>
      </Card.Header>
      <Card.Content className="edututor:flex edututor:flex-col edututor:gap-5">
        <div className="edututor:flex edututor:flex-col edututor:gap-2">
          <label className="edututor:text-sm edututor:font-medium">Сурагч</label>
          <SelectCustomer
            value={customerId}
            mode="single"
            onValueChange={(value) =>
              setCustomerId(Array.isArray(value) ? (value[0] ?? "") : value)
            }
          />
        </div>
        <div className="edututor:flex edututor:flex-col edututor:gap-2">
          <label className="edututor:text-sm edututor:font-medium">Сэдэв</label>
          <Select value={topicId} onValueChange={setTopicId} disabled={topicsLoading}>
            <Select.Trigger>
              <Select.Value placeholder={topicsLoading ? "Уншиж байна…" : "Сэдэв сонгох"} />
            </Select.Trigger>
            <Select.Content>
              {topics.map((topic) => (
                <Select.Item key={topic._id} value={topic._id}>
                  {topic.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          {topicsError && (
            <p role="alert" className="edututor:text-sm edututor:text-destructive">
              {topicsError.message}
            </p>
          )}
          {!topicsLoading && !topicsError && topics.length === 0 && (
            <p className="edututor:text-sm edututor:text-muted-foreground">
              Эхлээд сэдэв болон бодлого үүсгэнэ үү.
            </p>
          )}
        </div>
        {selectedTopic && (
          <section className="edututor:rounded-lg edututor:border edututor:border-border edututor:p-4">
            <h3 className="edututor:font-semibold">Хичээлийн товч мэдээлэл</h3>
            <p className="edututor:mt-1 edututor:text-sm edututor:text-muted-foreground">
              {selectedTopic.gradeLevel ? `${selectedTopic.gradeLevel}-р анги · ` : ""}
              {TOPIC_KIND_LABELS[selectedTopic.kind]}
            </p>
            <p className="edututor:mt-2 edututor:text-sm">
              {selectedTopic.description || "Энэ сэдвийн товч тайлбар хараахан нэмэгдээгүй байна."}
            </p>
            {videoUrl ? (
              <iframe
                className="edututor:mt-4 edututor:aspect-video edututor:w-full edututor:rounded-md"
                src={videoUrl}
                title={`${selectedTopic.name} хичээлийн бичлэг`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <p className="edututor:mt-3 edututor:text-sm edututor:text-muted-foreground">
                Энэ сэдэвт хичээлийн бичлэг оруулаагүй байна.
              </p>
            )}
          </section>
        )}
        {topicId && approvedProblemsLoading && (
          <p role="status" className="edututor:text-sm edututor:text-muted-foreground">
            Батлагдсан бодлогын тоог шалгаж байна…
          </p>
        )}
        {topicId && approvedProblemsError && (
          <div className="edututor:flex edututor:flex-col edututor:gap-2">
            <p role="alert" className="edututor:text-sm edututor:text-destructive">
              Батлагдсан бодлогын тоог шалгаж чадсангүй: {approvedProblemsError.message}
            </p>
            <Button variant="outline" onClick={() => refetchApprovedProblems()}>
              Дахин шалгах
            </Button>
          </div>
        )}
        {topicId && !approvedProblemsLoading && !approvedProblemsError && (
          <div className="edututor:flex edututor:flex-col edututor:gap-2">
            <p
              role="status"
              className={
                approvedProblemCount >= REQUIRED_PROBLEM_COUNT
                  ? "edututor:text-sm edututor:text-muted-foreground"
                  : "edututor:text-sm edututor:text-destructive"
              }
            >
              Батлагдсан бодлого:{" "}
              {approvedProblemCount >= REQUIRED_PROBLEM_COUNT
                ? `${approvedProblemCount} (шаардлагатай ${REQUIRED_PROBLEM_COUNT})`
                : `${approvedProblemCount}/${REQUIRED_PROBLEM_COUNT}`}
              {approvedProblemCount < REQUIRED_PROBLEM_COUNT &&
                ". Дадлага эхлүүлэхийн тулд шалгагчид тэнцсэн бодлогыг батална уу."}
            </p>
            {approvedProblemCount < REQUIRED_PROBLEM_COUNT && (
              <Button variant="outline" asChild>
                <Link to={`/${path}/topics/${encodeURIComponent(topicId)}`}>
                  Бодлого үүсгэж, шалгаж батлах
                </Link>
              </Button>
            )}
          </div>
        )}
        <Button disabled={!canStart} onClick={handleStart}>
          {loading ? <Spinner /> : <IconPlayerPlay />}
          {loading ? "Бэлтгэж байна…" : `${REQUIRED_PROBLEM_COUNT} бодлогын дадлага эхлүүлэх`}
        </Button>
      </Card.Content>
    </Card>
  );
};

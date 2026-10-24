import { useMutation, useQuery } from "@apollo/client";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconChartBar,
  IconHeartHandshake,
  IconSparkles,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import {
  Breadcrumb,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Separator,
  Skeleton,
  useToast,
} from "erxes-ui";
import { useState } from "react";
import { Link } from "react-router";
import { PageHeader, SelectCustomer } from "ui-modules";
import manifest from "../../../erxes.json" with { type: "json" };
import { TOPICS_QUERY } from "../modules/topics/graphql";
import {
  PARENT_GOAL_REMOVE_MUTATION,
  PARENT_GOAL_SAVE_MUTATION,
  PARENT_PROGRESS_QUERY,
} from "../modules/practice/graphql";

const { path } = manifest.ui;

const Metric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconChartBar;
  label: string;
  value: string | number;
}) => (
  <Card className="edututor:min-w-0">
    <Card.Content className="edututor:flex edututor:items-center edututor:gap-4 edututor:p-5">
      <div className="edututor:flex edututor:size-11 edututor:shrink-0 edututor:items-center edututor:justify-center edututor:rounded-xl edututor:bg-primary/10 edututor:text-primary">
        <Icon className="edututor:size-5" />
      </div>
      <div className="edututor:min-w-0">
        <p className="edututor:text-sm edututor:text-muted-foreground">{label}</p>
        <p className="edututor:mt-1 edututor:text-2xl edututor:font-semibold">{value}</p>
      </div>
    </Card.Content>
  </Card>
);

export const ParentProgressPage = () => {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState("");
  const [goalTopicId, setGoalTopicId] = useState("");
  const [goalTarget, setGoalTarget] = useState("80");
  const { data, loading, error, refetch } = useQuery(PARENT_PROGRESS_QUERY, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: "cache-and-network",
  });
  const {
    data: topicsData,
    loading: topicsLoading,
    error: topicsError,
  } = useQuery(TOPICS_QUERY, {
    variables: { limit: 100, offset: 0 },
    skip: !customerId,
  });
  const [saveGoal, { loading: savingGoal }] = useMutation(PARENT_GOAL_SAVE_MUTATION);
  const [removeGoal, { loading: removingGoal }] = useMutation(PARENT_GOAL_REMOVE_MUTATION);
  const progress = data?.edututorParentProgress;
  const availableTopics = topicsData?.edututorTopics ?? [];

  const handleSaveGoal = async () => {
    const targetMastery = Number(goalTarget);

    if (!customerId || !goalTopicId || !Number.isInteger(targetMastery)) return;

    try {
      await saveGoal({ variables: { customerId, topicId: goalTopicId, targetMastery } });
      await refetch();
      toast({ variant: "success", title: "Зорилтыг хадгаллаа" });
    } catch (saveError) {
      toast({
        variant: "destructive",
        title: "Зорилтыг хадгалж чадсангүй",
        description: saveError instanceof Error ? saveError.message : undefined,
      });
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    if (!customerId) return;

    try {
      await removeGoal({ variables: { customerId, goalId } });
      await refetch();
      toast({ variant: "success", title: "Зорилтыг устгалаа" });
    } catch (removeError) {
      toast({
        variant: "destructive",
        title: "Зорилтыг устгаж чадсангүй",
        description: removeError instanceof Error ? removeError.message : undefined,
      });
    }
  };

  return (
    <div className="edututor:flex edututor:h-full edututor:flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="edututor:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/${path}`}>
                    <IconUsers /> Эцэг эхийн ахиц
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton breadcrumb={[manifest.title, "Эцэг эхийн ахиц"]} />
        </PageHeader.Start>
      </PageHeader>

      <main className="edututor:flex-1 edututor:overflow-auto edututor:p-4 edututor:md:p-8">
        <div className="edututor:mx-auto edututor:flex edututor:w-full edututor:max-w-5xl edututor:flex-col edututor:gap-6">
          <header className="edututor:flex edututor:flex-col edututor:gap-2">
            <p className="edututor:text-sm edututor:font-medium edututor:text-primary">
              СУРАЛЦАХ ЯВЦ · ГЭР БҮЛИЙН ТАЙЛАН
            </p>
            <h1 className="edututor:text-3xl edututor:font-semibold edututor:tracking-tight">
              Ахиц бүрийг хамтдаа дэмжицгээе
            </h1>
            <p className="edututor:max-w-2xl edututor:text-muted-foreground">
              Сурагчийн бодит дадлагын оноо, давтаж буй сэдэв болон гэртээ дэмжих дараагийн алхмыг
              нэг дороос хараарай.
            </p>
          </header>

          <Card>
            <Card.Content className="edututor:grid edututor:gap-4 edututor:p-5 edututor:md:grid-cols-[1fr_auto] edututor:md:items-end">
              <div className="edututor:flex edututor:flex-col edututor:gap-2">
                <p className="edututor:text-sm edututor:font-medium">Сурагчийн бүртгэл сонгох</p>
                <SelectCustomer
                  value={customerId}
                  mode="single"
                  onValueChange={(value) => {
                    setCustomerId(Array.isArray(value) ? (value[0] ?? "") : value);
                    setGoalTopicId("");
                  }}
                />
              </div>
              <p className="edututor:max-w-sm edututor:text-xs edututor:text-muted-foreground">
                Одоогийн хувилбарт энэ нь erxes Contacts дээрх сурагчийн бүртгэлийг харуулна.
              </p>
            </Card.Content>
          </Card>

          {!customerId && (
            <Empty className="edututor:min-h-64">
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconUsers />
                </Empty.Media>
                <Empty.Title>Эхлэхийн тулд сурагч сонгоно уу</Empty.Title>
                <Empty.Description>
                  Сурагчийн дадлагын түүх, сэдвийн ахиц болон зөвлөмж сонгосны дараа энд харагдана.
                </Empty.Description>
              </Empty.Header>
            </Empty>
          )}

          {loading && customerId && (
            <div role="status" className="edututor:grid edututor:gap-4 edututor:md:grid-cols-3">
              <Skeleton className="edututor:h-24" />
              <Skeleton className="edututor:h-24" />
              <Skeleton className="edututor:h-24" />
              <Skeleton className="edututor:h-64 edututor:md:col-span-3" />
            </div>
          )}

          {error && (
            <Empty role="alert" className="edututor:min-h-64">
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconAlertTriangle />
                </Empty.Media>
                <Empty.Title>Ахицын тайланг ачаалж чадсангүй</Empty.Title>
                <Empty.Description>{error.message}</Empty.Description>
              </Empty.Header>
              <Button variant="outline" onClick={() => refetch()}>
                Дахин оролдох
              </Button>
            </Empty>
          )}

          {progress && !loading && !error && progress.completedSessions === 0 && (
            <Empty className="edututor:min-h-64">
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconChartBar />
                </Empty.Media>
                <Empty.Title>Ахицын мэдээлэл хараахан алга</Empty.Title>
                <Empty.Description>
                  Энэ сурагч эхний дадлагаа дуусгасны дараа оноо, XP болон сэдвийн явц энд
                  бүртгэгдэнэ.
                </Empty.Description>
              </Empty.Header>
              <Button asChild>
                <Link to={`/${path}/practice`}>
                  Дадлагыг нээх <IconArrowRight />
                </Link>
              </Button>
            </Empty>
          )}

          {progress && progress.completedSessions > 0 && (
            <>
              <section
                aria-label="Сурагчийн ерөнхий ахиц"
                className="edututor:grid edututor:gap-4 edututor:sm:grid-cols-2 edututor:lg:grid-cols-3"
              >
                <Metric
                  icon={IconChartBar}
                  label="Дундаж оноо"
                  value={`${progress.averageScore}%`}
                />
                <Metric
                  icon={IconUsers}
                  label="Дуусгасан дадлага"
                  value={progress.completedSessions}
                />
                <Metric icon={IconTrophy} label="Цуглуулсан XP" value={progress.totalXp} />
              </section>

              <div className="edututor:grid edututor:items-start edututor:gap-4 edututor:lg:grid-cols-[1.4fr_1fr]">
                <Card>
                  <Card.Header>
                    <Card.Title>Сэдэв тус бүрийн ахиц</Card.Title>
                    <Card.Description>Зөвхөн дуусгасан дадлагын оноог харуулна.</Card.Description>
                  </Card.Header>
                  <Card.Content className="edututor:flex edututor:flex-col edututor:gap-5">
                    {progress.topics.map((topic) => (
                      <div
                        key={topic.topicId}
                        className="edututor:flex edututor:flex-col edututor:gap-2"
                      >
                        <div className="edututor:flex edututor:items-center edututor:justify-between edututor:gap-3">
                          <span className="edututor:font-medium">{topic.name}</span>
                          <span className="edututor:shrink-0 edututor:text-sm">
                            {topic.averageScore}% · {topic.attempts} дадлага
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${topic.name} сэдвийн дундаж оноо`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={topic.averageScore}
                          className="edututor:h-2.5 edututor:overflow-hidden edututor:rounded-full edututor:bg-muted"
                        >
                          <div
                            className="edututor:h-full edututor:rounded-full edututor:bg-primary edututor:transition-[width]"
                            style={{ width: `${topic.averageScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </Card.Content>
                </Card>

                <Card className="edututor:border-primary/20">
                  <Card.Header>
                    <div className="edututor:flex edututor:items-center edututor:gap-2 edututor:text-primary">
                      <IconHeartHandshake className="edututor:size-5" />
                      <Card.Title>Гэртээ дэмжих санаа</Card.Title>
                    </div>
                    <Card.Description>
                      Онооноос ажиглагдсан зүйл дээр тулгуурласан, дарамтгүй нэг алхам.
                    </Card.Description>
                  </Card.Header>
                  <Card.Content className="edututor:space-y-4">
                    <p className="edututor:leading-relaxed">
                      {progress.latestFeedback?.parentAdvice ??
                        "Хүүхдээсээ өнөөдөр хамгийн сонирхолтой санагдсан нэг бодлогоо тайлбарлахыг хүсэж, хичээл зүтгэлийг нь магтаарай."}
                    </p>
                    {progress.latestFeedback?.notice && (
                      <p className="edututor:text-sm edututor:text-muted-foreground">
                        {progress.latestFeedback.notice}
                      </p>
                    )}

                    {customerId && (
                      <Card>
                        <Card.Header>
                          <Card.Title>Суралцах зорилт</Card.Title>
                          <Card.Description>
                            Зорилт нь сонгосон сэдвийн дуусгасан дадлагуудын эзэмшилтийн дундаж
                            босгод хүрэхэд автоматаар биелнэ.
                          </Card.Description>
                        </Card.Header>
                        <Card.Content className="edututor:flex edututor:flex-col edututor:gap-5">
                          <div className="edututor:grid edututor:gap-4 edututor:md:grid-cols-[1fr_10rem_auto] edututor:md:items-end">
                            <div className="edututor:flex edututor:flex-col edututor:gap-2">
                              <label className="edututor:text-sm edututor:font-medium">
                                Зорилтот сэдэв
                              </label>
                              <Select
                                value={goalTopicId}
                                onValueChange={setGoalTopicId}
                                disabled={topicsLoading || availableTopics.length === 0}
                              >
                                <Select.Trigger>
                                  <Select.Value
                                    placeholder={
                                      topicsLoading ? "Сэдэв уншиж байна…" : "Сэдэв сонгох"
                                    }
                                  />
                                </Select.Trigger>
                                <Select.Content>
                                  {availableTopics.map((topic) => (
                                    <Select.Item key={topic._id} value={topic._id}>
                                      {topic.name}
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select>
                              {topicsError && (
                                <p
                                  role="alert"
                                  className="edututor:text-sm edututor:text-destructive"
                                >
                                  Сэдэв уншиж чадсангүй: {topicsError.message}
                                </p>
                              )}
                            </div>
                            <div className="edututor:flex edututor:flex-col edututor:gap-2">
                              <label
                                htmlFor="goal-target"
                                className="edututor:text-sm edututor:font-medium"
                              >
                                Зорилтот эзэмшилт
                              </label>
                              <div className="edututor:relative">
                                <Input
                                  id="goal-target"
                                  type="number"
                                  min={50}
                                  max={100}
                                  step={5}
                                  value={goalTarget}
                                  onChange={(event) => setGoalTarget(event.target.value)}
                                  className="edututor:pr-8"
                                />
                                <span className="edututor:absolute edututor:right-3 edututor:top-1/2 edututor:-translate-y-1/2 edututor:text-sm edututor:text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={handleSaveGoal}
                              disabled={
                                !goalTopicId ||
                                !Number.isInteger(Number(goalTarget)) ||
                                Number(goalTarget) < 50 ||
                                Number(goalTarget) > 100 ||
                                savingGoal
                              }
                            >
                              {savingGoal ? "Хадгалж байна…" : "Зорилт хадгалах"}
                            </Button>
                          </div>

                          {progress?.goals.length ? (
                            <div className="edututor:flex edututor:flex-col edututor:gap-4">
                              {progress.goals.map((goal) => (
                                <div
                                  key={goal.id}
                                  className="edututor:rounded-xl edututor:border edututor:border-border edututor:p-4"
                                >
                                  <div className="edututor:flex edututor:flex-wrap edututor:items-start edututor:justify-between edututor:gap-3">
                                    <div className="edututor:min-w-0 edututor:flex-1">
                                      <div className="edututor:flex edututor:flex-wrap edututor:items-center edututor:gap-2">
                                        <h3 className="edututor:font-semibold">{goal.topicName}</h3>
                                        <span
                                          className={
                                            goal.completed
                                              ? "edututor:rounded-full edututor:bg-primary/10 edututor:px-2.5 edututor:py-1 edututor:text-xs edututor:font-medium edututor:text-primary"
                                              : "edututor:rounded-full edututor:bg-muted edututor:px-2.5 edututor:py-1 edututor:text-xs edututor:text-muted-foreground"
                                          }
                                        >
                                          {goal.completed ? "Зорилт биелсэн" : "Үргэлжилж байна"}
                                        </span>
                                      </div>
                                      <p className="edututor:mt-1 edututor:text-sm edututor:text-muted-foreground">
                                        Одоогийн эзэмшилт {goal.currentMastery}% · зорилт{" "}
                                        {goal.targetMastery}%
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={removingGoal}
                                      onClick={() => handleRemoveGoal(goal.id)}
                                    >
                                      Зорилт устгах
                                    </Button>
                                  </div>
                                  <div
                                    role="progressbar"
                                    aria-label={`${goal.topicName} зорилгын явц`}
                                    aria-valuemin={0}
                                    aria-valuemax={goal.targetMastery}
                                    aria-valuenow={Math.min(
                                      goal.currentMastery,
                                      goal.targetMastery,
                                    )}
                                    className="edututor:mt-3 edututor:h-2.5 edututor:overflow-hidden edututor:rounded-full edututor:bg-muted"
                                  >
                                    <div
                                      className="edututor:h-full edututor:rounded-full edututor:bg-primary edututor:transition-[width]"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.round(
                                            (goal.currentMastery / goal.targetMastery) * 100,
                                          ),
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="edututor:text-sm edututor:text-muted-foreground">
                              Одоогоор зорилт алга. Нэг сэдэв сонгон бодитой, хүрч болох онооны
                              зорилт тавиарай.
                            </p>
                          )}
                        </Card.Content>
                      </Card>
                    )}
                    <div className="edututor:flex edututor:items-center edututor:gap-2 edututor:text-xs edututor:text-muted-foreground">
                      <IconSparkles className="edututor:size-4" />
                      {progress.latestFeedback?.generatedByAi
                        ? "Gemma зөвлөмж — дадлагын оноонд тулгуурлав"
                        : "Оноонд суурилсан зөвлөмж"}
                    </div>
                  </Card.Content>
                </Card>
              </div>

              <p className="edututor:text-xs edututor:text-muted-foreground">
                Энэхүү тайлан нь зөвхөн EduTutor-д хадгалагдсан дадлагыг нэгтгэн харуулна. Энэ нь
                сургалтын онош эсвэл бусад системийн бүрэн дүн биш.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

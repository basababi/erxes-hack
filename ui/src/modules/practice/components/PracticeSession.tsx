import { useMutation, useQuery } from "@apollo/client";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconBriefcase,
  IconCheck,
  IconPlayerPlay,
  IconRefresh,
  IconSparkles,
  IconTrophy,
} from "@tabler/icons-react";
import { Badge, Button, Card, Empty, Input, Skeleton, Spinner, useToast } from "erxes-ui";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { EdututorPracticeAttemptQuery, EdututorPracticeFinishMutation } from "~/gql/graphql";
import { DIFFICULTY_LABELS } from "../../problems/constants";
import manifest from "../../../../../erxes.json" with { type: "json" };
import {
  PRACTICE_ANSWER_MUTATION,
  PRACTICE_ATTEMPT_QUERY,
  PRACTICE_FINISH_MUTATION,
  PRACTICE_HINT_MUTATION,
  PRACTICE_REVEAL_SOLUTION_MUTATION,
} from "../graphql";

type Session = Omit<EdututorPracticeAttemptQuery["edututorPracticeAttempt"], "aiFeedback"> & {
  aiFeedback?: EdututorPracticeAttemptQuery["edututorPracticeAttempt"]["aiFeedback"];
};
type Feedback = EdututorPracticeFinishMutation["edututorPracticeFinish"]["feedback"];

const timestampUrl = (value: string, seconds: number) => {
  try {
    const url = new URL(value);

    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) {
      url.searchParams.set("t", `${seconds}s`);
    }

    return url.toString();
  } catch {
    return value;
  }
};

const nextQuestion = (session: Session, current: number) => {
  const after = session.items.findIndex((item, index) => index > current && !item.answered);

  if (after !== -1) return after;

  const anywhere = session.items.findIndex((item) => !item.answered);

  return anywhere === -1 ? current : anywhere;
};

export const PracticeSession = ({
  attemptId,
  onExit,
}: {
  attemptId: string;
  onExit: () => void;
}) => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const { data, loading, error, refetch } = useQuery(PRACTICE_ATTEMPT_QUERY, {
    variables: { _id: attemptId },
    fetchPolicy: "network-only",
  });
  const [submitAnswer, { loading: answering }] = useMutation(PRACTICE_ANSWER_MUTATION);
  const [requestHint, { loading: hinting }] = useMutation(PRACTICE_HINT_MUTATION);
  const [finish, { loading: finishing }] = useMutation(PRACTICE_FINISH_MUTATION);
  const [revealSolution, { loading: revealingSolution }] = useMutation(
    PRACTICE_REVEAL_SOLUTION_MUTATION,
  );

  useEffect(() => {
    if (data?.edututorPracticeAttempt) {
      setSession(data.edututorPracticeAttempt);
      if (data.edututorPracticeAttempt.aiFeedback) {
        setFeedback(data.edututorPracticeAttempt.aiFeedback);
      }
    }
  }, [data]);

  const moveTo = (next: number) => {
    setIndex(next);
    setAnswer("");
  };

  const current = session?.items[index];

  const handleAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session || !current || !answer.trim()) return;

    try {
      const { data: result } = await submitAnswer({
        variables: {
          attemptId: session.attemptId,
          problemId: current.problem._id,
          answer: answer.trim(),
        },
      });
      const payload = result?.edututorPracticeAnswer;

      if (!payload) return;

      setSession(payload.session);

      if (payload.correct) {
        toast({ variant: "success", title: "Зөв бодлоо" });
        setAnswer("");
        const next = nextQuestion(payload.session, index);

        if (next !== index) moveTo(next);
      }
    } catch (mutationError) {
      toast({
        variant: "destructive",
        title: "Хариуг шалгаж чадсангүй",
        description: mutationError instanceof Error ? mutationError.message : undefined,
      });
    }
  };

  const handleHint = async () => {
    if (!session || !current) return;

    try {
      const { data: result } = await requestHint({
        variables: { attemptId: session.attemptId, problemId: current.problem._id },
      });
      const payload = result?.edututorPracticeHint;

      if (payload) setSession(payload.session);
    } catch (mutationError) {
      toast({
        variant: "destructive",
        title: "Сэжүүр авч чадсангүй",
        description: mutationError instanceof Error ? mutationError.message : undefined,
      });
    }
  };

  const handleRevealSolution = async () => {
    if (!session || !current) return;

    try {
      const { data: result } = await revealSolution({
        variables: { attemptId: session.attemptId, problemId: current.problem._id },
      });
      const completed = result?.edututorPracticeRevealSolution;

      if (!completed) return;

      setSession(completed);
      const next = nextQuestion(completed, index);

      if (next !== index) moveTo(next);
    } catch (mutationError) {
      toast({
        variant: "destructive",
        title: "Бодолтыг тэмдэглэж чадсангүй",
        description: mutationError instanceof Error ? mutationError.message : undefined,
      });
    }
  };

  const handleFinish = async () => {
    if (!session) return;

    try {
      const { data: result } = await finish({ variables: { attemptId: session.attemptId } });
      const payload = result?.edututorPracticeFinish;

      if (payload) {
        setSession(payload.session);
        setFeedback(payload.feedback);
      }
    } catch (mutationError) {
      toast({
        variant: "destructive",
        title: "Дадлагыг дуусгаж чадсангүй",
        description: mutationError instanceof Error ? mutationError.message : undefined,
      });
    }
  };

  if (loading && !session) {
    return (
      <div
        role="status"
        className="edututor:mx-auto edututor:flex edututor:w-full edututor:max-w-2xl edututor:flex-col edututor:gap-4"
      >
        <Skeleton className="edututor:h-5 edututor:w-full" />
        <Skeleton className="edututor:h-80 edututor:w-full" />
      </div>
    );
  }

  if (error || !session || !current) {
    return (
      <Empty role="alert" className="edututor:mx-auto edututor:min-h-80 edututor:max-w-2xl">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconAlertTriangle />
          </Empty.Media>
          <Empty.Title>Дадлагыг нээж чадсангүй</Empty.Title>
          <Empty.Description>{error?.message ?? "Дадлагын өгөгдөл дутуу байна"}</Empty.Description>
        </Empty.Header>
        <div className="edututor:flex edututor:gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <IconRefresh /> Дахин оролдох
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Шинээр эхлэх
          </Button>
        </div>
      </Empty>
    );
  }

  if (session.status === "finished") {
    const completedFeedback = feedback ?? session.aiFeedback;
    const careerGuidance = completedFeedback?.careerGuidance ?? [];

    return (
      <div className="edututor:mx-auto edututor:flex edututor:w-full edututor:max-w-4xl edututor:flex-col edututor:gap-5">
        <Card className="edututor:overflow-hidden">
          <div className="edututor:bg-primary/5 edututor:px-6 edututor:py-8 edututor:text-center">
            <div className="edututor:mx-auto edututor:mb-3 edututor:flex edututor:size-14 edututor:items-center edututor:justify-center edututor:rounded-2xl edututor:bg-primary/10 edututor:text-primary">
              <IconTrophy className="edututor:size-8" />
            </div>
            <h1 className="edututor:text-2xl edututor:font-semibold">Өнөөдрийн ахиц амжилттай!</h1>
            <p className="edututor:mt-1 edututor:text-muted-foreground">
              {session.correctCount}/{session.total} бодлогыг зөв бодлоо. Суралцах бүртээ ахиж
              байна.
            </p>
          </div>
          <Card.Content className="edututor:grid edututor:grid-cols-2 edututor:gap-3 edututor:p-5 edututor:md:grid-cols-4">
            {[
              { label: "Зөв хариулт", value: `${session.score}%` },
              { label: "Эзэмшилт", value: `${session.mastery}%` },
              { label: "Өнөөдрийн XP", value: session.xpEarned },
              { label: "Нийт XP", value: session.totalXp },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="edututor:rounded-xl edututor:border edututor:border-border edututor:bg-background edututor:p-4"
              >
                <p className="edututor:text-sm edututor:text-muted-foreground">{label}</p>
                <p className="edututor:mt-1 edututor:text-2xl edututor:font-semibold">{value}</p>
              </div>
            ))}
          </Card.Content>
          {session.badges.length > 0 && (
            <Card.Content className="edututor:flex edututor:flex-wrap edututor:items-center edututor:gap-2 edututor:border-t edututor:border-border edututor:px-5 edututor:py-4">
              <span className="edututor:mr-1 edututor:text-sm edututor:font-medium">
                Нээсэн тэмдэг:
              </span>
              {session.badges.map((badge) => (
                <Badge key={badge.id} variant="success" title={badge.description}>
                  <IconTrophy /> {badge.title}
                </Badge>
              ))}
            </Card.Content>
          )}
        </Card>

        {completedFeedback && (
          <Card>
            <Card.Header>
              <div className="edututor:flex edututor:items-center edututor:gap-2 edututor:text-primary">
                <IconSparkles className="edututor:size-5" />
                <Card.Title>
                  {completedFeedback.generatedByAi
                    ? "Gemma-ийн хувийн ахицын зөвлөгөө"
                    : "Таны ахицын зөвлөгөө"}
                </Card.Title>
              </div>
              <Card.Description>
                Дадлагын бодит үр дүнд тулгуурласан дараагийн алхам
              </Card.Description>
            </Card.Header>
            <Card.Content className="edututor:flex edututor:flex-col edututor:gap-5">
              {completedFeedback.notice && (
                <p className="edututor:rounded-lg edututor:bg-muted edututor:px-3 edututor:py-2 edututor:text-sm edututor:text-muted-foreground">
                  {completedFeedback.notice}
                </p>
              )}
              <div className="edututor:grid edututor:gap-4 edututor:md:grid-cols-2">
                <section className="edututor:rounded-xl edututor:border edututor:border-border edututor:p-4">
                  <h3 className="edututor:font-semibold">✨ Сайн болсон зүйл</h3>
                  {completedFeedback.strengths.length > 0 ? (
                    <ul className="edututor:mt-3 edututor:space-y-2 edututor:text-sm">
                      {completedFeedback.strengths.map((item, itemIndex) => (
                        <li key={`${itemIndex}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="edututor:mt-2 edututor:text-sm edututor:text-muted-foreground">
                      Одоогоор 80%-иас дээш оноотой сэдэв алга. Дадлага бүр таны дараагийн ахицын
                      эхлэл шүү.
                    </p>
                  )}
                </section>
                <section className="edututor:rounded-xl edututor:border edututor:border-border edututor:p-4">
                  <h3 className="edututor:font-semibold">🎯 Дахин дадлага хийх сэдэв</h3>
                  {completedFeedback.needsPractice.length > 0 ? (
                    <ul className="edututor:mt-3 edututor:space-y-2 edututor:text-sm">
                      {completedFeedback.needsPractice.map((item, itemIndex) => (
                        <li key={`${itemIndex}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="edututor:mt-2 edututor:text-sm edututor:text-muted-foreground">
                      60%-иас доош дундажтай сэдэв илрээгүй байна. Ижил сэдвээр ахицаа бататгаарай.
                    </p>
                  )}
                </section>
              </div>
              <div className="edututor:rounded-xl edututor:bg-primary/5 edututor:p-4">
                <p className="edututor:text-sm edututor:font-semibold">Таны дараагийн алхам</p>
                <p className="edututor:mt-1 edututor:text-sm edututor:leading-relaxed">
                  {completedFeedback.recommendation}
                </p>
              </div>
            </Card.Content>
          </Card>
        )}

        {careerGuidance.length > 0 && (
          <Card>
            <Card.Header>
              <div className="edututor:flex edututor:items-center edututor:gap-2 edututor:text-primary">
                <IconBriefcase className="edututor:size-5" />
                <Card.Title>Сонирхлоо нээх карьерын санаа</Card.Title>
              </div>
              <Card.Description>
                Энэ бол онош биш — өөрийн сонирхлыг аюулгүй туршиж үзэх санаанууд.
              </Card.Description>
            </Card.Header>
            <Card.Content className="edututor:grid edututor:gap-3 edututor:md:grid-cols-2">
              {careerGuidance.map((career) => (
                <article
                  key={career.title}
                  className="edututor:rounded-xl edututor:border edututor:border-border edututor:p-4"
                >
                  <h3 className="edututor:font-semibold">{career.title}</h3>
                  <p className="edututor:mt-2 edututor:text-sm edututor:text-muted-foreground">
                    {career.rationale}
                  </p>
                  <p className="edututor:mt-3 edututor:text-sm">
                    <span className="edututor:font-medium">Туршаад үзэх: </span>
                    {career.tryNext}
                  </p>
                </article>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card>
          <Card.Content className="edututor:flex edututor:flex-col edututor:items-center edututor:justify-between edututor:gap-3 edututor:p-5 edututor:sm:flex-row">
            <div>
              <p className="edututor:font-medium">Гэр бүлийн ахицыг хамтдаа хараарай</p>
              <p className="edututor:text-sm edututor:text-muted-foreground">
                Эцэг эхийн тайлангаас давтлага, XP болон туслах санааг нээнэ.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/${manifest.ui.path}/parents`}>
                Эцэг эхийн тайлан <IconArrowRight />
              </Link>
            </Button>
          </Card.Content>
        </Card>

        <div className="edututor:flex edututor:justify-center">
          <Button onClick={onExit}>
            <IconRefresh /> Шинэ дадлага
          </Button>
        </div>
      </div>
    );
  }

  const progress = Math.round((session.answeredCount / session.total) * 100);

  return (
    <div className="edututor:mx-auto edututor:flex edututor:w-full edututor:max-w-2xl edututor:flex-col edututor:gap-4">
      <div className="edututor:flex edututor:items-center edututor:gap-3">
        <span className="edututor:text-sm edututor:font-medium">
          {index + 1}/{session.total}
        </span>
        <div className="edututor:h-2 edututor:flex-1 edututor:overflow-hidden edututor:rounded-full edututor:bg-muted">
          <div
            className="edututor:h-full edututor:bg-primary edututor:transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="edututor:text-sm edututor:text-muted-foreground">{session.score}%</span>
      </div>

      <Card>
        <Card.Header>
          <div className="edututor:flex edututor:flex-wrap edututor:gap-2">
            <Badge variant="secondary">{DIFFICULTY_LABELS[current.problem.difficulty]}</Badge>
            {current.correct && (
              <Badge variant="success">
                <IconCheck /> Зөв
              </Badge>
            )}
          </div>
          <Card.Title className="edututor:text-lg edututor:leading-relaxed">
            {current.problem.statement}
          </Card.Title>
        </Card.Header>
        <Card.Content className="edututor:flex edututor:flex-col edututor:gap-4">
          {current.revealedHints.length > 0 && (
            <ol className="edututor:flex edututor:list-decimal edututor:flex-col edututor:gap-2 edututor:rounded-lg edututor:bg-muted edututor:p-4 edututor:pl-9 edututor:text-sm">
              {current.revealedHints.map((hint, hintIndex) => (
                <li key={hintIndex}>{hint}</li>
              ))}
            </ol>
          )}
          {current.solution && (
            <section
              aria-label="Бодолт ба зөв хариу"
              className="edututor:flex edututor:flex-col edututor:gap-3 edututor:rounded-lg edututor:border edututor:border-primary/40 edututor:bg-primary/5 edututor:p-4"
            >
              <h3 className="edututor:font-semibold">Алхамчилсан бодолт</h3>
              <ol className="edututor:list-decimal edututor:space-y-2 edututor:pl-5 edututor:text-sm">
                {current.solution.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ol>
              <p className="edututor:font-semibold">Зөв хариу: {current.solution.answer}</p>
              {!current.solutionViewed && (
                <Button
                  variant="outline"
                  disabled={revealingSolution}
                  onClick={handleRevealSolution}
                >
                  {revealingSolution ? <Spinner /> : <IconArrowRight />}
                  Бодолтыг уншаад үргэлжлүүлэх
                </Button>
              )}
            </section>
          )}

          {current.correct === false && (
            <div
              role="status"
              className="edututor:flex edututor:flex-col edututor:gap-2 edututor:rounded-lg edututor:border edututor:border-warning edututor:bg-warning/10 edututor:p-4"
            >
              <p className="edututor:font-medium">
                {current.misconception?.title ?? "Дахин нэг оролдоод үзье"}
              </p>
              {current.misconception && (
                <p className="edututor:text-sm">{current.misconception.message}</p>
              )}
              {current.lessonMoment && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={timestampUrl(
                      current.lessonMoment.videoUrl,
                      current.lessonMoment.atSeconds,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconPlayerPlay /> {current.lessonMoment.title} —{" "}
                    {Math.floor(current.lessonMoment.atSeconds / 60)}:
                    {String(current.lessonMoment.atSeconds % 60).padStart(2, "0")}-өөс үзэх
                  </a>
                </Button>
              )}
            </div>
          )}

          <form
            onSubmit={handleAnswer}
            className="edututor:flex edututor:flex-col edututor:gap-3 edututor:sm:flex-row"
          >
            <Input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Хариугаа бичнэ үү"
              aria-label="Хариу"
              autoComplete="off"
              maxLength={100}
              disabled={answering || current.correct === true || current.solutionViewed}
            />
            <Button
              type="submit"
              disabled={
                !answer.trim() || answering || current.correct === true || current.solutionViewed
              }
            >
              {answering ? <Spinner /> : <IconCheck />}
              Шалгах
            </Button>
          </form>

          <div className="edututor:flex edututor:flex-wrap edututor:justify-between edututor:gap-2">
            <Button
              variant="outline"
              disabled={hinting || current.hintsUsed >= 3 || current.correct === true}
              onClick={handleHint}
            >
              {hinting ? <Spinner /> : <IconBulb />}
              Сэжүүр ({3 - current.hintsUsed})
            </Button>
            {session.answeredCount === session.total && (
              <Button disabled={finishing} onClick={handleFinish}>
                {finishing ? <Spinner /> : <IconTrophy />}
                Дадлага дуусгах
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>

      <div className="edututor:flex edututor:justify-between">
        <Button variant="ghost" disabled={index === 0} onClick={() => moveTo(index - 1)}>
          <IconArrowLeft /> Өмнөх
        </Button>
        <Button
          variant="ghost"
          disabled={index >= session.total - 1}
          onClick={() => moveTo(index + 1)}
        >
          Дараах <IconArrowRight />
        </Button>
      </div>
    </div>
  );
};

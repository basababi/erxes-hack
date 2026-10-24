import { useMutation, useQuery } from "@apollo/client";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconPlayerPlay,
  IconRefresh,
  IconTrophy,
} from "@tabler/icons-react";
import { Badge, Button, Card, Empty, Input, Skeleton, Spinner, useToast } from "erxes-ui";
import { useEffect, useState } from "react";
import type { EdututorPracticeAttemptQuery } from "~/gql/graphql";
import { DIFFICULTY_LABELS } from "../../problems/constants";
import {
  PRACTICE_ANSWER_MUTATION,
  PRACTICE_ATTEMPT_QUERY,
  PRACTICE_FINISH_MUTATION,
  PRACTICE_HINT_MUTATION,
} from "../graphql";

type Session = EdututorPracticeAttemptQuery["edututorPracticeAttempt"];

interface Feedback {
  correct: boolean;
  misconception: { title: string; message: string } | null;
  lessonMoment: { videoUrl: string; atSeconds: number; title: string } | null;
}

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
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { data, loading, error, refetch } = useQuery(PRACTICE_ATTEMPT_QUERY, {
    variables: { _id: attemptId },
    fetchPolicy: "network-only",
  });
  const [submitAnswer, { loading: answering }] = useMutation(PRACTICE_ANSWER_MUTATION);
  const [requestHint, { loading: hinting }] = useMutation(PRACTICE_HINT_MUTATION);
  const [finish, { loading: finishing }] = useMutation(PRACTICE_FINISH_MUTATION);

  useEffect(() => {
    if (data?.edututorPracticeAttempt) setSession(data.edututorPracticeAttempt);
  }, [data]);

  const moveTo = (next: number) => {
    setIndex(next);
    setAnswer("");
    setFeedback(null);
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
      setFeedback({
        correct: payload.correct,
        misconception: payload.misconception ?? null,
        lessonMoment: payload.lessonMoment ?? null,
      });

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

  const handleFinish = async () => {
    if (!session) return;

    try {
      const { data: result } = await finish({ variables: { attemptId: session.attemptId } });
      const completed = result?.edututorPracticeFinish.session;

      if (completed) {
        setSession(completed);
        setFeedback(null);
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
    return (
      <Card className="edututor:mx-auto edututor:w-full edututor:max-w-2xl">
        <Card.Header className="edututor:items-center edututor:text-center">
          <IconTrophy className="edututor:size-12 edututor:text-primary" />
          <Card.Title>Дадлага дууслаа</Card.Title>
          <Card.Description>
            {session.correctCount}/{session.total} бодлого зөв
          </Card.Description>
        </Card.Header>
        <Card.Content className="edututor:grid edututor:grid-cols-2 edututor:gap-4">
          <div className="edututor:rounded-lg edututor:border edututor:border-border edututor:p-4 edututor:text-center">
            <div className="edututor:text-3xl edututor:font-semibold">{session.score}%</div>
            <div className="edututor:text-sm edututor:text-muted-foreground">Оноо</div>
          </div>
          <div className="edututor:rounded-lg edututor:border edututor:border-border edututor:p-4 edututor:text-center">
            <div className="edututor:text-3xl edututor:font-semibold">{session.mastery}%</div>
            <div className="edututor:text-sm edututor:text-muted-foreground">Эзэмшилт</div>
          </div>
        </Card.Content>
        <Card.Footer className="edututor:justify-center">
          <Button onClick={onExit}>
            <IconRefresh /> Шинэ дадлага
          </Button>
        </Card.Footer>
      </Card>
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

          {feedback && !feedback.correct && (
            <div
              role="status"
              className="edututor:flex edututor:flex-col edututor:gap-2 edututor:rounded-lg edututor:border edututor:border-warning edututor:bg-warning/10 edututor:p-4"
            >
              <p className="edututor:font-medium">
                {feedback.misconception?.title ?? "Дахин нэг оролдоод үзье"}
              </p>
              {feedback.misconception && (
                <p className="edututor:text-sm">{feedback.misconception.message}</p>
              )}
              {feedback.lessonMoment && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={timestampUrl(
                      feedback.lessonMoment.videoUrl,
                      feedback.lessonMoment.atSeconds,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconPlayerPlay /> {feedback.lessonMoment.title} —{" "}
                    {Math.floor(feedback.lessonMoment.atSeconds / 60)}:
                    {String(feedback.lessonMoment.atSeconds % 60).padStart(2, "0")}-өөс үзэх
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
              disabled={answering || current.correct === true}
            />
            <Button
              type="submit"
              disabled={!answer.trim() || answering || current.correct === true}
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

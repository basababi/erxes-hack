import { useMutation, useQuery } from "@apollo/client";
import { IconPlayerPlay } from "@tabler/icons-react";
import { Button, Card, Select, Spinner, useToast } from "erxes-ui";
import { useState } from "react";
import { SelectCustomer } from "ui-modules";
import { TOPICS_QUERY } from "../../topics/graphql";
import { PRACTICE_START_MUTATION } from "../graphql";

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
  const topics = data?.edututorTopics ?? [];

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
        <Button disabled={!customerId || !topicId || loading} onClick={handleStart}>
          {loading ? <Spinner /> : <IconPlayerPlay />}
          {loading ? "Бэлтгэж байна…" : "5 бодлогын дадлага эхлүүлэх"}
        </Button>
      </Card.Content>
    </Card>
  );
};

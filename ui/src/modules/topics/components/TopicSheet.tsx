import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBook2, IconPlus } from "@tabler/icons-react";
import { Button, Form, Sheet, Skeleton, Spinner, useQueryState, useToast } from "erxes-ui";
import { TOPIC_EDIT_PARAM } from "../constants";
import { TOPIC_ADD_MUTATION, TOPIC_DETAIL_QUERY, TOPIC_EDIT_MUTATION } from "../graphql";
import {
  TOPIC_FORM_DEFAULTS,
  topicFormSchema,
  toTopicFormValues,
  toTopicInput,
  type TopicFormValues,
} from "../schema";
import { TopicForm } from "./TopicForm";

const TopicSheetForm = ({
  title,
  submitLabel,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
}: {
  title: string;
  submitLabel: string;
  defaultValues: TopicFormValues;
  submitting: boolean;
  onSubmit: (values: TopicFormValues) => Promise<boolean>;
  onCancel: () => void;
}) => {
  const methods = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues,
  });

  const submit = methods.handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      methods.reset(TOPIC_FORM_DEFAULTS);
    }
  });

  return (
    <Form {...methods}>
      <form className="edututor:flex edututor:size-full edututor:flex-col" onSubmit={submit}>
        <Sheet.Header>
          <IconBook2 />
          <Sheet.Title>{title}</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="edututor:grow edututor:px-5 edututor:py-4">
          <TopicForm control={methods.control} />
        </Sheet.Content>
        <Sheet.Footer>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Болих
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner /> : submitLabel}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

export const TopicCreateSheet = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [addTopic, { loading }] = useMutation(TOPIC_ADD_MUTATION, {
    refetchQueries: ["edututorTopics"],
    awaitRefetchQueries: true,
  });

  const handleSubmit = async (values: TopicFormValues) => {
    try {
      await addTopic({ variables: { input: toTopicInput(values) } });
      toast({ variant: "success", title: "Сэдэв нэмэгдлээ" });
      setOpen(false);
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Сэдэв нэмэхэд алдаа гарлаа",
        description: error instanceof Error ? error.message : undefined,
      });
      return false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPlus />
          Сэдэв нэмэх
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="edututor:p-0">
        <TopicSheetForm
          title="Сэдэв нэмэх"
          submitLabel="Нэмэх"
          defaultValues={TOPIC_FORM_DEFAULTS}
          submitting={loading}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </Sheet.View>
    </Sheet>
  );
};

export const TopicEditSheet = () => {
  const [topicId, setTopicId] = useQueryState<string>(TOPIC_EDIT_PARAM);
  const { toast } = useToast();
  const { data, loading, error } = useQuery(TOPIC_DETAIL_QUERY, {
    variables: { _id: topicId ?? "" },
    skip: !topicId,
  });
  // Edited fields come back with the topic's _id, so Apollo updates the
  // normalized list row in place.
  const [editTopic, { loading: saving }] = useMutation(TOPIC_EDIT_MUTATION);
  const topic = data?.edututorTopicDetail;

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Сэдэв олдсонгүй", description: error.message });
      setTopicId(null);
    }
  }, [error, setTopicId, toast]);

  const close = () => setTopicId(null);

  const handleSubmit = async (values: TopicFormValues) => {
    if (!topicId) return false;

    try {
      await editTopic({ variables: { _id: topicId, input: toTopicInput(values) } });
      toast({ variant: "success", title: "Сэдэв шинэчлэгдлээ" });
      close();
      return true;
    } catch (mutationError) {
      toast({
        variant: "destructive",
        title: "Сэдэв засахад алдаа гарлаа",
        description: mutationError instanceof Error ? mutationError.message : undefined,
      });
      return false;
    }
  };

  return (
    <Sheet open={!!topicId} onOpenChange={(isOpen) => !isOpen && close()}>
      <Sheet.View className="edututor:p-0">
        {loading || !topic ? (
          <>
            <Sheet.Header>
              <IconBook2 />
              <Sheet.Title>Сэдэв засах</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>
            <div
              role="status"
              className="edututor:flex edututor:flex-col edututor:gap-3 edututor:px-5 edututor:py-4"
            >
              <Skeleton className="edututor:h-9 edututor:w-full" />
              <Skeleton className="edututor:h-9 edututor:w-full" />
              <Skeleton className="edututor:h-9 edututor:w-full" />
              <Skeleton className="edututor:h-24 edututor:w-full" />
            </div>
          </>
        ) : (
          <TopicSheetForm
            // Remount per topic so the form starts from that topic's values.
            key={topic._id}
            title="Сэдэв засах"
            submitLabel="Хадгалах"
            defaultValues={toTopicFormValues(topic)}
            submitting={saving}
            onSubmit={handleSubmit}
            onCancel={close}
          />
        )}
      </Sheet.View>
    </Sheet>
  );
};

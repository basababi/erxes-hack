import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import { Button, Card, Form, Input, Select, Spinner, useToast } from "erxes-ui";
import { useFieldArray, useForm } from "react-hook-form";
import type { EdututorTopicDetailQuery } from "~/gql/graphql";
import { MISCONCEPTIONS_QUERY } from "../../problems/graphql";
import { TOPIC_LESSON_SAVE_MUTATION } from "../../topics/graphql";
import { lessonFormSchema, toLessonFormValues, toLessonInput, type LessonFormValues } from "../schema";
import { videoEmbedUrl } from "../utils";

type Topic = EdututorTopicDetailQuery["edututorTopicDetail"];

export const LessonCard = ({ topic }: { topic: Topic }) => {
  const { toast } = useToast();
  const methods = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: toLessonFormValues(topic.lesson),
  });
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: "chapters" });
  const { data: misconceptionData, loading: misconceptionsLoading } = useQuery(
    MISCONCEPTIONS_QUERY,
    { variables: { kind: topic.kind } },
  );
  // The response carries the topic _id, so the detail query updates in place.
  const [saveLesson, { loading: saving }] = useMutation(TOPIC_LESSON_SAVE_MUTATION);
  const misconceptions = misconceptionData?.edututorMisconceptions ?? [];
  const embedUrl = videoEmbedUrl(methods.watch("videoUrl"));

  const submit = methods.handleSubmit(async (values) => {
    try {
      const { data } = await saveLesson({
        variables: { _id: topic._id, lesson: toLessonInput(values) },
      });

      methods.reset(toLessonFormValues(data?.edututorTopicLessonSave.lesson));
      toast({ variant: "success", title: "Хичээлийн бичлэг хадгалагдлаа" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Хадгалж чадсангүй",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title>Хичээлийн бичлэг</Card.Title>
        <Card.Description>
          Сурагч алдаа гаргахад тухайн алдааг тайлбарласан минутаас нь бичлэгийг санал болгоно.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Form {...methods}>
          <form onSubmit={submit} className="edututor:flex edututor:flex-col edututor:gap-4">
            <Form.Field
              control={methods.control}
              name="videoUrl"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Бичлэгийн холбоос</Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="https://www.youtube.com/watch?v=…" />
                  </Form.Control>
                  <Form.Description>YouTube эсвэл Google Drive.</Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />
            {embedUrl && (
              <div className="edututor:aspect-video edututor:overflow-hidden edututor:rounded-lg edututor:border edututor:border-border">
                <iframe
                  src={embedUrl}
                  title={`${topic.name} — хичээлийн бичлэг`}
                  className="edututor:size-full"
                  allow="encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            )}
            <div className="edututor:flex edututor:flex-col edututor:gap-3">
              <div className="edututor:flex edututor:items-center edututor:justify-between edututor:gap-2">
                <span className="edututor:text-sm edututor:font-medium">Алдаа ба бичлэгийн хэсэг</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={misconceptions.length === 0 || fields.length >= misconceptions.length}
                  onClick={() => append({ misconception: "", time: "", title: "" })}
                >
                  <IconPlus />
                  Хэсэг нэмэх
                </Button>
              </div>
              {misconceptionsLoading ? (
                <Spinner />
              ) : misconceptions.length === 0 ? (
                <p className="edututor:text-sm edututor:text-muted-foreground">
                  Энэ төрлийн бодлогод алдааны жагсаалт хараахан алга.
                </p>
              ) : fields.length === 0 ? (
                <p className="edututor:text-sm edututor:text-muted-foreground">
                  Алдаа бүрт бичлэгийн аль минутад тайлбарласныг холбоно уу.
                </p>
              ) : null}
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="edututor:grid edututor:grid-cols-[1fr_auto] edututor:gap-2 edututor:rounded-lg edututor:border edututor:border-border edututor:p-3 edututor:sm:grid-cols-[minmax(0,1.4fr)_6rem_minmax(0,1fr)_auto]"
                >
                  <Form.Field
                    control={methods.control}
                    name={`chapters.${index}.misconception`}
                    render={({ field }) => (
                      <Form.Item className="edututor:col-span-2 edututor:sm:col-span-1">
                        <Form.Label className="edututor:sr-only">Алдаа</Form.Label>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (!methods.getValues(`chapters.${index}.title`)) {
                              const title = misconceptions.find((m) => m.id === value)?.title;

                              if (title) methods.setValue(`chapters.${index}.title`, title);
                            }
                          }}
                        >
                          <Form.Control>
                            <Select.Trigger>
                              <Select.Value placeholder="Алдаа сонгох" />
                            </Select.Trigger>
                          </Form.Control>
                          <Select.Content>
                            {misconceptions.map((misconception) => (
                              <Select.Item key={misconception.id} value={misconception.id}>
                                {misconception.title}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={methods.control}
                    name={`chapters.${index}.time`}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label className="edututor:sr-only">Хугацаа</Form.Label>
                        <Form.Control>
                          <Input {...field} placeholder="0:45" inputMode="numeric" />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={methods.control}
                    name={`chapters.${index}.title`}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label className="edututor:sr-only">Гарчиг</Form.Label>
                        <Form.Control>
                          <Input {...field} placeholder="Хэсгийн гарчиг" />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Хэсгийг хасах"
                    onClick={() => remove(index)}
                  >
                    <IconTrash />
                  </Button>
                </div>
              ))}
            </div>
            <div className="edututor:flex edututor:justify-end">
              <Button type="submit" disabled={saving || !methods.formState.isDirty}>
                {saving ? <Spinner /> : <IconDeviceFloppy />}
                Хадгалах
              </Button>
            </div>
          </form>
        </Form>
      </Card.Content>
    </Card>
  );
};

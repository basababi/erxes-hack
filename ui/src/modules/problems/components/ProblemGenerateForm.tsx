import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconSparkles } from "@tabler/icons-react";
import { Button, Form, Select, Spinner, Switch, useToast } from "erxes-ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DIFFICULTIES, DIFFICULTY_LABELS, MAX_GENERATE_COUNT } from "../constants";
import { PROBLEMS_GENERATE_MUTATION } from "../graphql";

const COUNTS = Array.from({ length: MAX_GENERATE_COUNT }, (_, index) => String(index + 1));

const generateFormSchema = z.object({
  count: z.string().refine((value) => COUNTS.includes(value), `1–${MAX_GENERATE_COUNT}`),
  difficulty: z.enum(DIFFICULTIES),
  useAi: z.boolean(),
});

type GenerateFormValues = z.infer<typeof generateFormSchema>;

export const ProblemGenerateForm = ({ topicId }: { topicId: string }) => {
  const { toast } = useToast();
  const methods = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: { count: "3", difficulty: "medium", useAi: true },
  });
  const useAi = methods.watch("useAi");
  const [generate, { loading }] = useMutation(PROBLEMS_GENERATE_MUTATION, {
    refetchQueries: ["edututorProblems"],
    awaitRefetchQueries: true,
  });

  const submit = methods.handleSubmit(async (values) => {
    try {
      const { data } = await generate({
        variables: {
          topicId,
          count: Number(values.count),
          difficulty: values.difficulty,
          useAi: values.useAi,
        },
      });
      const result = data?.edututorProblemsGenerate;
      const problems = result?.problems ?? [];
      const rejected = problems.filter((problem) => problem.status === "rejected").length;

      toast({
        variant: problems.length > 0 && rejected === problems.length ? "warning" : "success",
        title: `${problems.length} бодлого үүслээ${result?.usedAi ? " (Gemma)" : ""}`,
        description:
          [
            rejected ? `${rejected} нь шалгагчид тэнцээгүй — «Татгалзсан» табаас шалтгааныг үз.` : "",
            result?.notice ?? "",
          ]
            .filter(Boolean)
            .join(" ") || undefined,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Бодлого үүсгэж чадсангүй",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  });

  return (
    <Form {...methods}>
      <form
        onSubmit={submit}
        className="edututor:flex edututor:flex-wrap edututor:items-end edututor:gap-3"
      >
        <Form.Field
          control={methods.control}
          name="count"
          render={({ field }) => (
            <Form.Item className="edututor:w-24">
              <Form.Label>Тоо</Form.Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Form.Control>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {COUNTS.map((count) => (
                    <Select.Item key={count} value={count}>
                      {count}
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
          name="difficulty"
          render={({ field }) => (
            <Form.Item className="edututor:w-32">
              <Form.Label>Түвшин</Form.Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Form.Control>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {DIFFICULTIES.map((difficulty) => (
                    <Select.Item key={difficulty} value={difficulty}>
                      {DIFFICULTY_LABELS[difficulty]}
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
          name="useAi"
          render={({ field }) => (
            <Form.Item className="edututor:flex edututor:h-9 edututor:items-center edututor:gap-2">
              <Form.Control>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </Form.Control>
              <Form.Label>Gemma-аар найруулах</Form.Label>
            </Form.Item>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner /> : <IconSparkles />}
          {loading ? "Үүсгэж байна…" : useAi ? "Gemma-аар үүсгэх" : "Загвараар үүсгэх"}
        </Button>
      </form>
    </Form>
  );
};

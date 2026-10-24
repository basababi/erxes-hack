import type { Control } from "react-hook-form";
import { Form, Input, Select, Textarea } from "erxes-ui";
import { TOPIC_KIND_LABELS, TOPIC_KINDS } from "../constants";
import type { TopicFormValues } from "../schema";

export const TopicForm = ({ control }: { control: Control<TopicFormValues> }) => {
  return (
    <div className="edututor:flex edututor:flex-col edututor:gap-4">
      <Form.Field
        control={control}
        name="name"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Нэр</Form.Label>
            <Form.Control>
              <Input {...field} placeholder="Жишээ нь: Нэг үл мэдэгдэгчтэй тэгшитгэл" />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={control}
        name="kind"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Бодлогын төрөл</Form.Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <Form.Control>
                <Select.Trigger>
                  <Select.Value placeholder="Төрөл сонгох" />
                </Select.Trigger>
              </Form.Control>
              <Select.Content>
                {TOPIC_KINDS.map((kind) => (
                  <Select.Item key={kind} value={kind}>
                    {TOPIC_KIND_LABELS[kind]}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={control}
        name="gradeLevel"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Анги</Form.Label>
            <Form.Control>
              <Input {...field} type="number" inputMode="numeric" min={1} max={12} />
            </Form.Control>
            <Form.Description>Заавал биш, 1–12.</Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={control}
        name="description"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control>
              <Textarea {...field} rows={4} maxLength={1000} />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
    </div>
  );
};

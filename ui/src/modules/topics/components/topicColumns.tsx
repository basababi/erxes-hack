import { useMutation } from "@apollo/client";
import type { Cell, ColumnDef } from "@tanstack/react-table";
import {
  IconAlignLeft,
  IconCalendarPlus,
  IconCategory,
  IconEdit,
  IconSchool,
  IconTrash,
} from "@tabler/icons-react";
import {
  Badge,
  Combobox,
  Command,
  Popover,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  TextOverflowTooltip,
  useConfirm,
  useQueryState,
  useToast,
} from "erxes-ui";
import { useNavigate } from "react-router";
import type { EdututorTopicsQuery } from "~/gql/graphql";
import manifest from "../../../../../erxes.json" with { type: "json" };
import { TOPIC_EDIT_PARAM, TOPIC_KIND_LABELS } from "../constants";
import { TOPIC_REMOVE_MUTATION } from "../graphql";

export type TopicRow = EdututorTopicsQuery["edututorTopics"][number];

const TopicMoreCell = ({ cell }: { cell: Cell<TopicRow, unknown> }) => {
  const { _id, name } = cell.row.original;
  const [, setTopicId] = useQueryState<string>(TOPIC_EDIT_PARAM);
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [removeTopic] = useMutation(TOPIC_REMOVE_MUTATION, {
    refetchQueries: ["edututorTopics"],
    awaitRefetchQueries: true,
  });

  const handleRemove = () =>
    confirm({
      message: `"${name}" сэдвийг устгах уу?`,
      options: { okLabel: "Устгах", cancelLabel: "Болих" },
    }).then(async () => {
      try {
        await removeTopic({ variables: { _id } });
        toast({ variant: "success", title: "Сэдэв устгагдлаа" });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Сэдэв устгахад алдаа гарлаа",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });

  return (
    <Popover>
      <Popover.Trigger asChild>
        <RecordTable.MoreButton className="edututor:size-full" aria-label="Үйлдлүүд" />
      </Popover.Trigger>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.List>
            <Command.Item value="edit" onSelect={() => setTopicId(_id)}>
              <IconEdit /> Засах
            </Command.Item>
            <Command.Item value="remove" onSelect={handleRemove}>
              <IconTrash /> Устгах
            </Command.Item>
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

// Opens the topic's lesson and problems; editing stays in the row menu.
const TopicNameCell = ({ cell }: { cell: Cell<TopicRow, unknown> }) => {
  const navigate = useNavigate();
  const { _id, name } = cell.row.original;

  return (
    <RecordTableInlineCell onClick={() => navigate(`/${manifest.ui.path}/topics/${_id}`)}>
      <TextOverflowTooltip value={name} className="edututor:font-medium" />
    </RecordTableInlineCell>
  );
};

export const topicColumns: ColumnDef<TopicRow>[] = [
  { id: "more", cell: TopicMoreCell, size: 33 },
  {
    id: "name",
    accessorKey: "name",
    header: () => <RecordTable.InlineHead label="Нэр" icon={IconAlignLeft} />,
    cell: TopicNameCell,
    size: 260,
  },
  {
    id: "kind",
    accessorKey: "kind",
    header: () => <RecordTable.InlineHead label="Төрөл" icon={IconCategory} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <Badge variant="secondary">{TOPIC_KIND_LABELS[row.original.kind]}</Badge>
      </RecordTableInlineCell>
    ),
    size: 200,
  },
  {
    id: "gradeLevel",
    accessorKey: "gradeLevel",
    header: () => <RecordTable.InlineHead label="Анги" icon={IconSchool} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>{row.original.gradeLevel ?? "—"}</RecordTableInlineCell>
    ),
    size: 100,
  },
  {
    id: "description",
    accessorKey: "description",
    header: () => <RecordTable.InlineHead label="Тайлбар" icon={IconAlignLeft} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={row.original.description ?? ""} />
      </RecordTableInlineCell>
    ),
    size: 320,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: () => <RecordTable.InlineHead label="Үүсгэсэн" icon={IconCalendarPlus} />,
    cell: ({ row }) =>
      row.original.createdAt ? (
        <RelativeDateDisplay value={row.original.createdAt} asChild>
          <RecordTableInlineCell>
            <RelativeDateDisplay.Value value={row.original.createdAt} />
          </RecordTableInlineCell>
        </RelativeDateDisplay>
      ) : (
        <RecordTableInlineCell>—</RecordTableInlineCell>
      ),
    size: 160,
  },
];

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { IconAlertTriangle, IconBook2 } from "@tabler/icons-react";
import { Button, Empty, RecordTable } from "erxes-ui";
import { TOPICS_PAGE_SIZE } from "../constants";
import { TOPICS_QUERY } from "../graphql";
import { TopicCreateSheet } from "./TopicSheet";
import { topicColumns } from "./topicColumns";

export const TopicsRecordTable = () => {
  const [offset, setOffset] = useState(0);
  const { data, loading, error, refetch } = useQuery(TOPICS_QUERY, {
    variables: { limit: TOPICS_PAGE_SIZE, offset },
    notifyOnNetworkStatusChange: true,
  });
  const topics = data?.edututorTopics ?? [];
  // A full page means there may be more; the API caps offset at 10000.
  const hasNextPage = topics.length === TOPICS_PAGE_SIZE && offset < 10_000;

  if (error) {
    return (
      <Empty className="edututor:m-3 edututor:min-h-80" role="alert">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconAlertTriangle />
          </Empty.Media>
          <Empty.Title>Сэдвүүдийг ачаалж чадсангүй</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
        <Button variant="outline" onClick={() => refetch()}>
          Дахин оролдох
        </Button>
      </Empty>
    );
  }

  if (!loading && topics.length === 0 && offset === 0) {
    return (
      <Empty className="edututor:m-3 edututor:min-h-80">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconBook2 />
          </Empty.Media>
          <Empty.Title>Сэдэв алга</Empty.Title>
          <Empty.Description>Анхны сэдвээ нэмээд бодлогын төрлийг нь сонгоорой.</Empty.Description>
        </Empty.Header>
        <TopicCreateSheet />
      </Empty>
    );
  }

  return (
    <div className="edututor:flex edututor:min-h-0 edututor:flex-1 edututor:flex-col">
      <RecordTable.Provider
        data={topics}
        columns={topicColumns}
        stickyColumns={["more", "name"]}
        className="edututor:m-3"
      >
        <RecordTable.Scroll>
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              {loading ? <RecordTable.RowSkeleton rows={8} /> : <RecordTable.RowList />}
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.Scroll>
      </RecordTable.Provider>
      <div className="edututor:flex edututor:justify-end edututor:gap-2 edututor:px-3 edututor:pb-3">
        <Button
          variant="outline"
          disabled={loading || offset === 0}
          onClick={() => setOffset(Math.max(0, offset - TOPICS_PAGE_SIZE))}
        >
          Өмнөх
        </Button>
        <Button
          variant="outline"
          disabled={loading || !hasNextPage}
          onClick={() => setOffset(offset + TOPICS_PAGE_SIZE)}
        >
          Дараах
        </Button>
      </div>
    </div>
  );
};

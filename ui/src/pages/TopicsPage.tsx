import { IconBook2 } from "@tabler/icons-react";
// Root imports on purpose: core-ui shares `erxes-ui`/`ui-modules` as Module
// Federation singletons keyed on the bare specifier, so deep imports would
// bundle second private copies instead of reusing the host's.
import { Breadcrumb, Button, Separator } from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { TopicCreateSheet, TopicEditSheet } from "../modules/topics/components/TopicSheet";
import { TopicsRecordTable } from "../modules/topics/components/TopicsRecordTable";

const { path } = manifest.ui;

export const TopicsPage = () => (
  <div className="edututor:flex edututor:h-full edututor:flex-col">
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="edututor:gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/${path}`}>
                  <IconBook2 />
                  Сэдвүүд
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton
          breadcrumb={[manifest.title, "Сэдвүүд"]}
          icon="IconBook2"
        />
      </PageHeader.Start>
      <PageHeader.End>
        <TopicCreateSheet />
      </PageHeader.End>
    </PageHeader>
    <TopicsRecordTable />
    <TopicEditSheet />
  </div>
);

import { IconBrain, IconRefresh } from "@tabler/icons-react";
import { Breadcrumb, Button, Separator } from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link, useSearchParams } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { PracticeSession } from "../modules/practice/components/PracticeSession";
import { PracticeSetup } from "../modules/practice/components/PracticeSetup";

const { path } = manifest.ui;

export const PracticePage = () => {
  const [params, setParams] = useSearchParams();
  const attemptId = params.get("attemptId");
  const topicId = params.get("topicId") ?? undefined;

  const setAttempt = (next: string | null) => {
    const updated = new URLSearchParams(params);

    if (next) updated.set("attemptId", next);
    else updated.delete("attemptId");
    setParams(updated, { replace: true });
  };

  return (
    <div className="edututor:flex edututor:h-full edututor:flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="edututor:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/${path}`}>
                    <IconBrain /> EduTutor
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>Сурагчаар турших</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
        </PageHeader.Start>
        {attemptId && (
          <PageHeader.End>
            <Button variant="outline" onClick={() => setAttempt(null)}>
              <IconRefresh /> Шинэ дадлага
            </Button>
          </PageHeader.End>
        )}
      </PageHeader>
      <div className="edututor:flex-1 edututor:overflow-auto edututor:p-4 edututor:md:p-6">
        {attemptId ? (
          <PracticeSession attemptId={attemptId} onExit={() => setAttempt(null)} />
        ) : (
          <PracticeSetup initialTopicId={topicId} onStarted={setAttempt} />
        )}
      </div>
    </div>
  );
};

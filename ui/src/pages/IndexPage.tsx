import { useQuery } from "@apollo/client";
import type { ComponentType, ReactNode } from "react";
import {
  IconBook,
  IconDatabase,
  IconExternalLink,
  IconLayoutDashboard,
  IconSandbox,
  IconSettings,
} from "@tabler/icons-react";
// Root imports on purpose: core-ui shares `erxes-ui`/`ui-modules` as Module
// Federation singletons keyed on the bare specifier, so deep imports would
// bundle second private copies instead of reusing the host's.
import { Badge, Breadcrumb, Button, Card, Separator, Skeleton, cn } from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { STATUS_QUERY } from "../graphql";
import { Samples } from "../Samples";

const { path } = manifest.ui;

const Dot = ({ className }: { className?: string }) => (
  <span className={cn("edututor:inline-block edututor:size-2 edututor:rounded-full", className)} />
);

const StatusRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="edututor:flex edututor:items-center edututor:justify-between edututor:gap-4 edututor:text-sm">
    <span className="edututor:text-muted-foreground">{label}</span>
    <span className="edututor:flex edututor:items-center edututor:gap-2 edututor:font-medium">
      {children}
    </span>
  </div>
);

const ConnectionCard = () => {
  const { data, loading, error, refetch } = useQuery(STATUS_QUERY);
  const status = data?.edututorStatus;

  const pending = (
    <>
      <Dot className="edututor:animate-pulse edututor:bg-muted-foreground" />
      <Skeleton className="edututor:h-4 edututor:w-24" />
    </>
  );

  return (
    <Card className="edututor:w-full edututor:md:w-80 edututor:shrink-0">
      <Card.Header>
        <Card.Title className="edututor:text-sm">Connection</Card.Title>
        <Card.Description>Live status of this plugin inside erxes</Card.Description>
      </Card.Header>
      <Card.Content className="edututor:flex edututor:flex-col edututor:gap-3">
        <StatusRow label="API">
          {loading ? (
            pending
          ) : error ? (
            <>
              <Dot className="edututor:bg-destructive" />
              <span>Unreachable</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </>
          ) : (
            <>
              <Dot className="edututor:bg-success" />
              <span>Connected · v{status?.version}</span>
            </>
          )}
        </StatusRow>
        <StatusRow label="Gateway">
          {loading ? (
            pending
          ) : error ? (
            <>
              <Dot className="edututor:bg-destructive" />
              <span className="edututor:truncate edututor:max-w-40" title={error.message}>
                {error.message}
              </span>
            </>
          ) : (
            <>
              <Dot className="edututor:bg-success" />
              <span>Federated as {status?.plugin}</span>
            </>
          )}
        </StatusRow>
        <StatusRow label="Tenant">{loading ? pending : (status?.subdomain ?? "—")}</StatusRow>
        <StatusRow label="Signed in">
          {loading
            ? pending
            : (status && (status.userEmail ?? status.userId ?? "Anonymous")) || "—"}
        </StatusRow>
      </Card.Content>
    </Card>
  );
};

const StepCard = ({
  icon: Icon,
  title,
  description,
  code,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  code: string;
}) => (
  <Card>
    <Card.Header>
      <div className="edututor:flex edututor:size-9 edututor:items-center edututor:justify-center edututor:rounded-lg edututor:bg-accent">
        <Icon className="edututor:size-5" />
      </div>
      <Card.Title>{title}</Card.Title>
      <Card.Description>{description}</Card.Description>
    </Card.Header>
    <Card.Content>
      <code className="edututor:rounded edututor:bg-muted edututor:px-1.5 edututor:py-0.5 edututor:font-mono edututor:text-xs">
        {code}
      </code>
    </Card.Content>
  </Card>
);

const STEPS = [
  {
    icon: IconDatabase,
    title: "Model your data",
    description: "Define the records this plugin owns and expose them on the federated graph.",
    code: "api/src/modules/sample",
  },
  {
    icon: IconLayoutDashboard,
    title: "Build the page",
    description:
      "Replace this overview with your module: lists with RecordTable, forms with Form, details in a Sheet.",
    code: "ui/src/pages/IndexPage.tsx",
  },
];

export const IndexPage = () => (
  <div className="edututor:flex edututor:h-full edututor:flex-col">
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="edututor:gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/${path}`}>
                  <IconSandbox />
                  {manifest.title}
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton breadcrumb={[manifest.title]} icon="IconSandbox" />
      </PageHeader.Start>
      <PageHeader.End>
        <Button variant="outline" asChild>
          <Link to={`/${path}/settings`}>
            <IconSettings />
            Settings
          </Link>
        </Button>
      </PageHeader.End>
    </PageHeader>
    <div className="edututor:flex-1 edututor:overflow-auto">
      <div className="edututor:mx-auto edututor:flex edututor:w-full edututor:max-w-5xl edututor:flex-col edututor:gap-6 edututor:p-6">
        <section className="edututor:relative edututor:overflow-hidden edututor:rounded-xl edututor:border edututor:border-border edututor:bg-background edututor:p-8 edututor:shadow-xs">
          <div
            aria-hidden
            className="edututor:pointer-events-none edututor:absolute edututor:inset-0 edututor:bg-gradient-to-br edututor:from-primary/10 edututor:via-transparent edututor:to-transparent"
          />
          <div className="edututor:relative edututor:flex edututor:flex-col edututor:gap-6 edututor:md:flex-row edututor:md:items-start edututor:md:justify-between">
            <div className="edututor:flex edututor:max-w-xl edututor:flex-col edututor:gap-4">
              <div>
                <Badge variant="info">Plugin · v{manifest.version}</Badge>
              </div>
              <h1 className="edututor:text-2xl edututor:font-semibold edututor:tracking-tight">
                Welcome to {manifest.title}
              </h1>
              <p className="edututor:text-sm edututor:leading-relaxed edututor:text-muted-foreground">
                {manifest.description}
              </p>
              <div className="edututor:flex edututor:flex-wrap edututor:gap-2">
                <Button asChild>
                  <Link to={`/${path}/settings`}>
                    <IconSettings />
                    Open settings
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://erxes.io/docs/create-plugin-standalone"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconBook />
                    Developer guide
                    <IconExternalLink />
                  </a>
                </Button>
              </div>
            </div>
            <ConnectionCard />
          </div>
        </section>
        <Samples />
        <div className="edututor:grid edututor:gap-4 edututor:md:grid-cols-2">
          {STEPS.map((step) => (
            <StepCard key={step.title} {...step} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

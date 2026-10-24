import "./styles.css";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { AppLayout } from "erxes-ui";
import manifest from "../../erxes.json" with { type: "json" };
import { Navigation } from "./modules/Navigation";

const TopicsPage = lazy(() =>
  import("./pages/TopicsPage").then((module) => ({
    default: module.TopicsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);

// core-ui mounts this component at `/<path>/*`; routes below are relative to
// it. It resolves the component by the PascalCase expose name.
export const Edututor = () => (
  <AppLayout id={manifest.name} title={manifest.title} sidebar={<Navigation />}>
    <Suspense fallback={<div role="status">Loading…</div>}>
      <Routes>
        <Route index element={<TopicsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  </AppLayout>
);

import type { IPermissionConfig } from "erxes-api-shared/core-types";
import { manifest } from "./config.ts";

// Action names are global across the platform, so every one carries the
// plugin prefix even though modules are grouped under the plugin in the UI.
export const TOPICS_SHOW = "edututorShowTopics";
export const TOPICS_MANAGE = "edututorTopicsManage";
export const PROBLEMS_GENERATE = "edututorProblemsGenerate";
export const PROBLEMS_APPROVE = "edututorProblemsApprove";
export const PRACTICE_MANAGE = "edututorPracticeManage";

export const permissions: IPermissionConfig = {
  plugin: manifest.name,
  modules: [
    {
      name: "topic",
      description: `${manifest.title} topics`,
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: "all", description: "All topics in this tenant" }],
      actions: [
        {
          name: TOPICS_SHOW,
          title: "View topics",
          description: `View ${manifest.title} topics`,
          always: true,
        },
        {
          name: TOPICS_MANAGE,
          title: "Manage topics",
          description: `Create, edit and remove ${manifest.title} topics`,
        },
      ],
    },
    {
      name: "problem",
      description: `${manifest.title} problems`,
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: "all", description: "All problems in this tenant" }],
      actions: [
        {
          name: PROBLEMS_GENERATE,
          title: "Generate problems",
          description: `Generate ${manifest.title} problems, with or without AI wording`,
        },
        {
          name: PROBLEMS_APPROVE,
          title: "Approve problems",
          description: `Approve or reject generated ${manifest.title} problems`,
        },
      ],
    },
    {
      name: "practice",
      description: `${manifest.title} student practice`,
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: "all", description: "All practice attempts in this tenant" }],
      actions: [
        {
          name: PRACTICE_MANAGE,
          title: "Run student practice",
          description: `Start and review ${manifest.title} practice for contacts`,
        },
      ],
    },
  ],
};

import type { IPermissionConfig } from "erxes-api-shared/core-types";
import { manifest } from "./config.ts";

// Action names are global across the platform, not local to this plugin.
export const TOPICS_SHOW = "showTopics";
export const TOPICS_MANAGE = "topicsManage";

export const permissions: IPermissionConfig = {
  plugin: manifest.name,
  modules: [
    {
      name: "topic",
      description: `${manifest.title} topics`,
      scopeField: null,
      ownerFields: [],
      // Topics are tenant-wide; do not advertise own/group scopes unless the
      // model query actually filters for those scopes.
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
  ],
};

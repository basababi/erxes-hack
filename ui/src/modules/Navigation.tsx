import { IconBook2, IconBrain, IconSettings, IconUsers } from "@tabler/icons-react";
import { NavigationMenuLinkItem, Sidebar } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };

export const Navigation = () => (
  <Sidebar.Group>
    <Sidebar.GroupContent>
      <Sidebar.Menu>
        <NavigationMenuLinkItem name="Сэдвүүд" icon={IconBook2} path={`/${manifest.ui.path}`} />
        <NavigationMenuLinkItem
          name="Сурагчаар турших"
          icon={IconBrain}
          path={`/${manifest.ui.path}/practice`}
        />
        <NavigationMenuLinkItem
          name="Эцэг эхийн ахиц"
          icon={IconUsers}
          path={`/${manifest.ui.path}/parents`}
        />
        <NavigationMenuLinkItem
          name="Тохиргоо"
          icon={IconSettings}
          path={`/${manifest.ui.path}/settings`}
        />
      </Sidebar.Menu>
    </Sidebar.GroupContent>
  </Sidebar.Group>
);

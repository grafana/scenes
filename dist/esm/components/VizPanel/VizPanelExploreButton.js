import React from 'react';
import { LinkButton } from '@grafana/ui';
import { useAsync } from 'react-use';
import { SceneObjectBase } from '../../core/SceneObjectBase.js';
import { sceneGraph } from '../../core/sceneGraph/index.js';
import { getExploreURL } from '../../utils/explore.js';
import { useReturnToPrevious } from '@grafana/runtime';

class VizPanelExploreButton extends SceneObjectBase {
  constructor(options = {}) {
    super({ options });
  }
}
VizPanelExploreButton.Component = VizPanelExploreButtonComponent;
function VizPanelExploreButtonComponent({ model }) {
  const { options } = model.useState();
  const { data } = sceneGraph.getData(model).useState();
  const { from, to } = sceneGraph.getTimeRange(model).useState();
  const { value: exploreLink } = useAsync(
    async () => data ? getExploreURL(data, model, { from, to }, options.transform) : "",
    [data, model, from, to]
  );
  const returnToPrevious = useReturnToPrevious();
  if (exploreLink) {
    return /* @__PURE__ */ React.createElement(LinkButton, {
      key: "explore",
      icon: "compass",
      size: "sm",
      variant: "secondary",
      href: exploreLink,
      onClick: () => {
        var _a;
        if (options.returnToPrevious) {
          returnToPrevious(options.returnToPrevious.title, options.returnToPrevious.href);
        }
        (_a = options.onClick) == null ? void 0 : _a.call(options);
      }
    }, "Explore");
  }
  return null;
}

export { VizPanelExploreButton };
//# sourceMappingURL=VizPanelExploreButton.js.map

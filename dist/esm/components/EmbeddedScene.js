import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase.js';
import { setWindowGrafanaSceneContext } from '../utils/compatibility/setWindowGrafanaSceneContext.js';

class EmbeddedScene extends SceneObjectBase {
  constructor(state) {
    super(state);
    this.addActivationHandler(() => {
      const unsetGlobalScene = setWindowGrafanaSceneContext(this);
      return () => {
        unsetGlobalScene();
      };
    });
  }
}
EmbeddedScene.Component = EmbeddedSceneRenderer;
function EmbeddedSceneRenderer({ model }) {
  const { body, controls } = model.useState();
  const styles = useStyles2(getStyles);
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.container
  }, controls && /* @__PURE__ */ React.createElement("div", {
    className: styles.controls
  }, controls.map((control) => /* @__PURE__ */ React.createElement(control.Component, {
    key: control.state.key,
    model: control
  }))), /* @__PURE__ */ React.createElement("div", {
    className: styles.body
  }, /* @__PURE__ */ React.createElement(body.Component, {
    model: body
  })));
}
const getStyles = (theme) => {
  return {
    container: css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(2),
      minHeight: "100%",
      flexDirection: "column"
    }),
    body: css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(1)
    }),
    controls: css({
      display: "flex",
      gap: theme.spacing(2),
      alignItems: "flex-end",
      flexWrap: "wrap"
    })
  };
};

export { EmbeddedScene };
//# sourceMappingURL=EmbeddedScene.js.map

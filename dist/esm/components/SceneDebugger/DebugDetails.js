import { css } from '@emotion/css';
import { useStyles2, JSONFormatter, Input } from '@grafana/ui';
import { isPlainObject, isArray } from 'lodash';
import React from 'react';
import { isSceneObject } from '../../core/types.js';

function DebugDetails({ node }) {
  const state = node.useState();
  const styles = useStyles2(getStyles);
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.container
  }, Object.keys(state).map((key) => /* @__PURE__ */ React.createElement("div", {
    className: styles.row,
    key
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.keyName
  }, key), /* @__PURE__ */ React.createElement("div", {
    className: styles.value
  }, renderValue(key, state[key], node)))));
}
function renderValue(key, value, node) {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "number":
      return /* @__PURE__ */ React.createElement(Input, {
        type: "number",
        defaultValue: value,
        onBlur: (evt) => node.setState({ [key]: evt.currentTarget.valueAsNumber })
      });
    case "string":
      return /* @__PURE__ */ React.createElement(Input, {
        type: "text",
        defaultValue: value,
        onBlur: (evt) => node.setState({ [key]: evt.currentTarget.value })
      });
    case "object":
      if (isSceneObject(value)) {
        return value.constructor.name;
      }
      if (isPlainObject(value) || isArray(value)) {
        return /* @__PURE__ */ React.createElement(JSONFormatter, {
          json: value,
          open: 0
        });
      }
      return String(value);
    default:
      return typeof value;
  }
}
function getStyles(theme) {
  return {
    container: css({
      flexGrow: 1,
      display: "flex",
      gap: theme.spacing(0.5),
      flexDirection: "column"
    }),
    row: css({
      display: "flex",
      gap: theme.spacing(2)
    }),
    keyName: css({
      display: "flex",
      flexGrow: "0",
      width: 120,
      alignItems: "center",
      height: theme.spacing(theme.components.height.md)
    }),
    value: css({
      flexGrow: 1,
      minHeight: theme.spacing(theme.components.height.md),
      display: "flex",
      alignItems: "center"
    })
  };
}

export { DebugDetails };
//# sourceMappingURL=DebugDetails.js.map

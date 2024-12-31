import { cx, css } from '@emotion/css';
import { useStyles2, Button, Icon } from '@grafana/ui';
import React, { useCallback } from 'react';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const MultiValuePill = ({
  item,
  handleRemoveMultiValue,
  index,
  handleEditMultiValuePill
}) => {
  var _a, _b;
  const styles = useStyles2(getStyles);
  const editMultiValuePill = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleEditMultiValuePill(item);
    },
    [handleEditMultiValuePill, item]
  );
  const editMultiValuePillWithKeyboard = useCallback(
    (e) => {
      if (e.key === "Enter") {
        editMultiValuePill(e);
      }
    },
    [editMultiValuePill]
  );
  const removePillHandler = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      handleRemoveMultiValue(item);
    },
    [handleRemoveMultiValue, item]
  );
  const removePillHandlerWithKeyboard = useCallback(
    (e) => {
      if (e.key === "Enter") {
        removePillHandler(e);
      }
    },
    [removePillHandler]
  );
  return /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.basePill, styles.valuePill),
    onClick: editMultiValuePill,
    onKeyDown: editMultiValuePillWithKeyboard,
    tabIndex: 0,
    id: `${item.value}-${index}`
  }, (_a = item.label) != null ? _a : item.value, /* @__PURE__ */ React.createElement(Button, {
    onClick: removePillHandler,
    onKeyDownCapture: removePillHandlerWithKeyboard,
    fill: "text",
    size: "sm",
    variant: "secondary",
    className: styles.removeButton,
    tooltip: `Remove filter value - ${(_b = item.label) != null ? _b : item.value}`
  }, /* @__PURE__ */ React.createElement(Icon, {
    name: "times",
    size: "md",
    id: `${item.value}-${index}-close-icon`
  })));
};
const getStyles = (theme) => ({
  basePill: css(__spreadProps(__spreadValues({
    display: "flex",
    alignItems: "center",
    background: theme.colors.action.disabledBackground,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: "hidden",
    whiteSpace: "nowrap",
    minHeight: theme.spacing(2.75)
  }, theme.typography.bodySmall), {
    cursor: "pointer"
  })),
  valuePill: css({
    background: theme.colors.action.selected,
    padding: theme.spacing(0.125, 0, 0.125, 1)
  }),
  removeButton: css({
    marginInline: theme.spacing(0.5),
    height: "100%",
    padding: 0,
    cursor: "pointer",
    "&:hover": {
      color: theme.colors.text.primary
    }
  })
});

export { MultiValuePill };
//# sourceMappingURL=MultiValuePill.js.map

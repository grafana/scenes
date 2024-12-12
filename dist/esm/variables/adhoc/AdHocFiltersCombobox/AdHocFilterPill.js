import { cx, css } from '@emotion/css';
import { useStyles2, Tooltip, IconButton } from '@grafana/ui';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AdHocCombobox } from './AdHocFiltersCombobox.js';

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
function AdHocFilterPill({ filter, model, readOnly, focusOnInputRef }) {
  var _a, _b, _c;
  const styles = useStyles2(getStyles);
  const [viewMode, setViewMode] = useState(true);
  const [shouldFocus, setShouldFocus] = useState(false);
  const pillWrapperRef = useRef(null);
  const keyLabel = (_a = filter.keyLabel) != null ? _a : filter.key;
  const valueLabel = ((_b = filter.valueLabels) == null ? void 0 : _b.join(", ")) || ((_c = filter.values) == null ? void 0 : _c.join(", ")) || filter.value;
  const handleChangeViewMode = useCallback(
    (event) => {
      event == null ? void 0 : event.stopPropagation();
      if (readOnly) {
        return;
      }
      setShouldFocus(!viewMode);
      setViewMode(!viewMode);
    },
    [readOnly, viewMode]
  );
  useEffect(() => {
    var _a2;
    if (shouldFocus) {
      (_a2 = pillWrapperRef.current) == null ? void 0 : _a2.focus();
      setShouldFocus(false);
    }
  }, [shouldFocus]);
  if (viewMode) {
    const pillText = /* @__PURE__ */ React.createElement("span", {
      className: styles.pillText
    }, keyLabel, " ", filter.operator, " ", valueLabel);
    return /* @__PURE__ */ React.createElement("div", {
      className: cx(styles.combinedFilterPill, { [styles.readOnlyCombinedFilter]: readOnly }),
      onClick: handleChangeViewMode,
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          handleChangeViewMode();
        }
      },
      role: "button",
      "aria-label": `Edit filter with key ${keyLabel}`,
      tabIndex: 0,
      ref: pillWrapperRef
    }, valueLabel.length < 20 ? pillText : /* @__PURE__ */ React.createElement(Tooltip, {
      content: /* @__PURE__ */ React.createElement("div", {
        className: styles.tooltipText
      }, valueLabel),
      placement: "top"
    }, pillText), !readOnly ? /* @__PURE__ */ React.createElement(IconButton, {
      onClick: (e) => {
        e.stopPropagation();
        model._removeFilter(filter);
        setTimeout(() => focusOnInputRef == null ? void 0 : focusOnInputRef());
      },
      onKeyDownCapture: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          model._removeFilter(filter);
          setTimeout(() => focusOnInputRef == null ? void 0 : focusOnInputRef());
        }
      },
      name: "times",
      size: "md",
      className: styles.removeButton,
      tooltip: `Remove filter with key ${keyLabel}`
    }) : null);
  }
  return /* @__PURE__ */ React.createElement(AdHocCombobox, {
    filter,
    model,
    handleChangeViewMode
  });
}
const getStyles = (theme) => ({
  combinedFilterPill: css(__spreadProps(__spreadValues({
    display: "flex",
    alignItems: "center",
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 0, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: "hidden",
    whiteSpace: "nowrap",
    minHeight: theme.spacing(2.75)
  }, theme.typography.bodySmall), {
    fontWeight: theme.typography.fontWeightBold,
    cursor: "pointer",
    "&:hover": {
      background: theme.colors.action.hover
    }
  })),
  readOnlyCombinedFilter: css({
    paddingRight: theme.spacing(1),
    cursor: "text",
    "&:hover": {
      background: theme.colors.action.selected
    }
  }),
  removeButton: css({
    marginInline: theme.spacing(0.5),
    cursor: "pointer",
    "&:hover": {
      color: theme.colors.text.primary
    }
  }),
  pillText: css({
    maxWidth: "200px",
    width: "100%",
    textOverflow: "ellipsis",
    overflow: "hidden"
  }),
  tooltipText: css({
    textAlign: "center"
  })
});

export { AdHocFilterPill };
//# sourceMappingURL=AdHocFilterPill.js.map

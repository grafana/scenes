import { cx, css } from '@emotion/css';
import { useStyles2, Icon } from '@grafana/ui';
import React, { memo, useRef } from 'react';
import { AdHocFilterPill } from './AdHocFilterPill.js';
import { AdHocFiltersAlwaysWipCombobox } from './AdHocFiltersAlwaysWipCombobox.js';

const AdHocFiltersComboboxRenderer = memo(function AdHocFiltersComboboxRenderer2({ model }) {
  const { filters, readOnly } = model.useState();
  const styles = useStyles2(getStyles);
  const focusOnInputRef = useRef();
  return /* @__PURE__ */ React.createElement("div", {
    className: cx(styles.comboboxWrapper, { [styles.comboboxFocusOutline]: !readOnly }),
    onClick: () => {
      var _a;
      (_a = focusOnInputRef.current) == null ? void 0 : _a.call(focusOnInputRef);
    }
  }, /* @__PURE__ */ React.createElement(Icon, {
    name: "filter",
    className: styles.filterIcon,
    size: "lg"
  }), filters.map((filter, index) => /* @__PURE__ */ React.createElement(AdHocFilterPill, {
    key: index,
    filter,
    model,
    readOnly,
    focusOnInputRef: focusOnInputRef.current
  })), !readOnly ? /* @__PURE__ */ React.createElement(AdHocFiltersAlwaysWipCombobox, {
    model,
    ref: focusOnInputRef
  }) : null);
});
const getStyles = (theme) => ({
  comboboxWrapper: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(0.5),
    minHeight: theme.spacing(4),
    backgroundColor: theme.components.input.background,
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: theme.shape.radius.default,
    paddingInline: theme.spacing(1),
    paddingBlock: theme.spacing(0.5),
    flexGrow: 1
  }),
  comboboxFocusOutline: css({
    "&:focus-within": {
      outline: "2px dotted transparent",
      outlineOffset: "2px",
      boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
      transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
      transitionDuration: "0.2s",
      transitionProperty: "outline, outline-offset, box-shadow",
      zIndex: 2
    }
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    alignSelf: "center"
  })
});

export { AdHocFiltersComboboxRenderer };
//# sourceMappingURL=AdHocFiltersComboboxRenderer.js.map

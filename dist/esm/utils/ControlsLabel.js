import React from 'react';
import { useStyles2, useTheme2, Tooltip, Icon, IconButton } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { css } from '@emotion/css';
import { LoadingIndicator } from './LoadingIndicator.js';

function ControlsLabel(props) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const isVertical = props.layout === "vertical";
  const loadingIndicator = Boolean(props.isLoading) ? /* @__PURE__ */ React.createElement("div", {
    style: { marginLeft: theme.spacing(1), marginTop: "-1px" },
    "aria-label": selectors.components.LoadingIndicator.icon
  }, /* @__PURE__ */ React.createElement(LoadingIndicator, {
    onCancel: (e) => {
      var _a;
      e.preventDefault();
      e.stopPropagation();
      (_a = props.onCancel) == null ? void 0 : _a.call(props);
    }
  })) : null;
  let errorIndicator = null;
  if (props.error) {
    errorIndicator = /* @__PURE__ */ React.createElement(Tooltip, {
      content: props.error,
      placement: "bottom"
    }, /* @__PURE__ */ React.createElement(Icon, {
      className: styles.errorIcon,
      name: "exclamation-triangle"
    }));
  }
  let descriptionIndicator = null;
  if (props.description) {
    descriptionIndicator = /* @__PURE__ */ React.createElement(Tooltip, {
      content: props.description,
      placement: isVertical ? "top" : "bottom"
    }, /* @__PURE__ */ React.createElement(Icon, {
      className: styles.normalIcon,
      name: "info-circle"
    }));
  }
  const testId = typeof props.label === "string" ? selectors.pages.Dashboard.SubMenu.submenuItemLabels(props.label) : "";
  let labelElement;
  if (isVertical) {
    labelElement = /* @__PURE__ */ React.createElement("label", {
      className: styles.verticalLabel,
      "data-testid": testId,
      htmlFor: props.htmlFor
    }, props.label, descriptionIndicator, errorIndicator, props.icon && /* @__PURE__ */ React.createElement(Icon, {
      name: props.icon,
      className: styles.normalIcon
    }), loadingIndicator, props.onRemove && /* @__PURE__ */ React.createElement(IconButton, {
      variant: "secondary",
      size: "xs",
      name: "times",
      onClick: props.onRemove,
      tooltip: "Remove"
    }));
  } else {
    labelElement = /* @__PURE__ */ React.createElement("label", {
      className: styles.horizontalLabel,
      "data-testid": testId,
      htmlFor: props.htmlFor
    }, errorIndicator, props.icon && /* @__PURE__ */ React.createElement(Icon, {
      name: props.icon,
      className: styles.normalIcon
    }), props.label, descriptionIndicator, loadingIndicator);
  }
  return labelElement;
}
const getStyles = (theme) => ({
  horizontalLabel: css({
    background: theme.isDark ? theme.colors.background.primary : theme.colors.background.secondary,
    display: `flex`,
    alignItems: "center",
    padding: theme.spacing(0, 1),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    height: theme.spacing(theme.components.height.md),
    lineHeight: theme.spacing(theme.components.height.md),
    borderRadius: theme.shape.borderRadius(1),
    border: `1px solid ${theme.components.input.borderColor}`,
    position: "relative",
    right: -1,
    whiteSpace: "nowrap",
    gap: theme.spacing(0.5)
  }),
  verticalLabel: css({
    display: `flex`,
    alignItems: "center",
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    whiteSpace: "nowrap",
    marginBottom: theme.spacing(0.5),
    gap: theme.spacing(1)
  }),
  errorIcon: css({
    color: theme.colors.error.text
  }),
  normalIcon: css({
    color: theme.colors.text.secondary
  })
});

export { ControlsLabel };
//# sourceMappingURL=ControlsLabel.js.map

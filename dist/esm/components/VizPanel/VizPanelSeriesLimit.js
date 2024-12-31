import { css } from '@emotion/css';
import { useStyles2, Icon, Tooltip, Button } from '@grafana/ui';
import React from 'react';

function VizPanelSeriesLimit({ data, showAll, seriesLimit, onShowAllSeries }) {
  const styles = useStyles2(getStyles);
  const seriesCount = data == null ? void 0 : data.series.length;
  if (seriesCount === void 0 || seriesCount < seriesLimit) {
    return null;
  }
  const buttonText = showAll ? "Restore limit" : `Show all ${seriesCount}`;
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.timeSeriesDisclaimer
  }, !showAll && /* @__PURE__ */ React.createElement("span", {
    className: styles.warningMessage
  }, /* @__PURE__ */ React.createElement(Icon, {
    title: `Showing only ${seriesLimit} series`,
    name: "exclamation-triangle",
    "aria-hidden": "true"
  })), /* @__PURE__ */ React.createElement(Tooltip, {
    content: "Rendering too many series in a single panel may impact performance and make data harder to read."
  }, /* @__PURE__ */ React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: onShowAllSeries
  }, buttonText)));
}
const getStyles = (theme) => ({
  timeSeriesDisclaimer: css({
    label: "time-series-disclaimer",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  }),
  warningMessage: css({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: theme.colors.warning.main,
    fontSize: theme.typography.bodySmall.fontSize
  })
});

export { VizPanelSeriesLimit };
//# sourceMappingURL=VizPanelSeriesLimit.js.map

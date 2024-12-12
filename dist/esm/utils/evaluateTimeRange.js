import { dateMath } from '@grafana/data';

function evaluateTimeRange(from, to, timeZone, fiscalYearStartMonth, delay) {
  const hasDelay = delay && to === "now";
  return {
    from: dateMath.parse(from, false, timeZone, fiscalYearStartMonth),
    to: dateMath.parse(hasDelay ? "now-" + delay : to, true, timeZone, fiscalYearStartMonth),
    raw: {
      from,
      to
    }
  };
}

export { evaluateTimeRange };
//# sourceMappingURL=evaluateTimeRange.js.map

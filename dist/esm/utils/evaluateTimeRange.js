import { setWeekStart, dateMath } from '@grafana/data';

function evaluateTimeRange(from, to, timeZone, fiscalYearStartMonth, delay, weekStart) {
  const hasDelay = delay && to === "now";
  const now = Date.now();
  if (weekStart) {
    setWeekStartIfDifferent(weekStart);
  }
  const parseOrToDateTime = (val, options) => {
    if (dateMath.toDateTime) {
      return dateMath.toDateTime(val, options);
    } else {
      return dateMath.parse(val, options.roundUp, options.timezone, options.fiscalYearStartMonth);
    }
  };
  return {
    to: parseOrToDateTime(hasDelay ? "now-" + delay : to, {
      roundUp: true,
      timezone: timeZone,
      fiscalYearStartMonth,
      now
    }),
    from: parseOrToDateTime(from, {
      roundUp: false,
      timezone: timeZone,
      fiscalYearStartMonth,
      now
    }),
    raw: {
      from,
      to
    }
  };
}
let prevWeekStart;
function setWeekStartIfDifferent(weekStart) {
  if (weekStart !== prevWeekStart) {
    prevWeekStart = weekStart;
    setWeekStart(weekStart);
  }
}

export { evaluateTimeRange };
//# sourceMappingURL=evaluateTimeRange.js.map

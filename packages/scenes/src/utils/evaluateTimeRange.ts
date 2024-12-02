import { dateMath, DateTime, TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

export function evaluateTimeRange(
  from: string | DateTime,
  to: string | DateTime,
  timeZone: TimeZone,
  fiscalYearStartMonth?: number,
  delay?: string
): TimeRange {
  const hasDelay = delay && to === 'now';
  const now = Date.now();
  return {
    from: dateMath.toDateTime(from, {
      roundUp: false,
      timezone: timeZone,
      fiscalYearStartMonth: fiscalYearStartMonth,
      now: now,
    })!,
    to: dateMath.toDateTime(hasDelay ? 'now-' + delay : to, {
      roundUp: true,
      timezone: timeZone,
      fiscalYearStartMonth: fiscalYearStartMonth,
      now: now,
    })!,
    raw: {
      from: from,
      to: to,
    },
  };
}

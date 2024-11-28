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
    from: dateMath.parse(from, false, timeZone, fiscalYearStartMonth, now)!,
    to: dateMath.parse(hasDelay ? 'now-' + delay : to, true, timeZone, fiscalYearStartMonth, now)!,
    raw: {
      from: from,
      to: to,
    },
  };
}

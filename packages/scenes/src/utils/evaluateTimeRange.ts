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
  to = hasDelay ? 'now-' + delay : to;

  return {
    from: dateMath.parse(from, false, timeZone, fiscalYearStartMonth)!,
    to: dateMath.parse(to, true, timeZone, fiscalYearStartMonth)!,
    raw: {
      from: from,
      to: to,
    },
  };
}

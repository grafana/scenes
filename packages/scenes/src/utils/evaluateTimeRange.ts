import { dateMath, TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

export function evaluateTimeRange(
  from: string,
  to: string,
  timeZone: TimeZone,
  fiscalYearStartMonth?: number
): TimeRange {
  return {
    from: dateMath.parse(from, false, timeZone, fiscalYearStartMonth)!,
    to: dateMath.parse(to, true, timeZone, fiscalYearStartMonth)!,
    raw: {
      from: from,
      to: to,
    },
  };
}

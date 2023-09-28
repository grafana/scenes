import { dateMath, dateTime, DateTime, isDateTime, TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

export function evaluateTimeRange(
  from: DateTime | string,
  to: DateTime | string,
  timeZone: TimeZone,
  fiscalYearStartMonth?: number
): TimeRange {
  // make copies if they are moment  (do not want to return out internal moment, because they are mutable!)
  const raw = {
    from: isDateTime(from) ? dateTime(from) : from,
    to: isDateTime(to) ? dateTime(to) : to,
  };

  return {
    from: dateMath.parse(raw.from, false, timeZone, fiscalYearStartMonth)!,
    to: dateMath.parse(raw.to, true, timeZone, fiscalYearStartMonth)!,
    raw: {
      from: from,
      to: to,
    },
  };
}

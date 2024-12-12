import { isDateTime, dateMath, dateTimeParse } from '@grafana/data';

function isValid(value, roundUp, timeZone) {
  if (isDateTime(value)) {
    return value.isValid();
  }
  if (dateMath.isMathString(value)) {
    return dateMath.isValid(value);
  }
  const parsed = dateTimeParse(value, { roundUp, timeZone });
  return parsed.isValid();
}

export { isValid };
//# sourceMappingURL=date.js.map

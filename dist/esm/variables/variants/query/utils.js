import { isNumber, uniqBy, sortBy, toLower } from 'lodash';
import { stringToJsRegex, VariableSort } from '@grafana/data';

const metricNamesToVariableValues = (variableRegEx, sort, metricNames) => {
  var _a, _b, _c, _d, _e, _f;
  let regex;
  let options = [];
  if (variableRegEx) {
    regex = stringToJsRegex(variableRegEx);
  }
  for (let i = 0; i < metricNames.length; i++) {
    const item = metricNames[i];
    let text = item.text === void 0 || item.text === null ? item.value : item.text;
    let value = item.value === void 0 || item.value === null ? item.text : item.value;
    if (isNumber(value)) {
      value = value.toString();
    }
    if (isNumber(text)) {
      text = text.toString();
    }
    if (regex) {
      const matches = getAllMatches(value, regex);
      if (!matches.length) {
        continue;
      }
      const valueGroup = matches.find((m) => m.groups && m.groups.value);
      const textGroup = matches.find((m) => m.groups && m.groups.text);
      const firstMatch = matches.find((m) => m.length > 1);
      const manyMatches = matches.length > 1 && firstMatch;
      if (valueGroup || textGroup) {
        value = (_c = (_a = valueGroup == null ? void 0 : valueGroup.groups) == null ? void 0 : _a.value) != null ? _c : (_b = textGroup == null ? void 0 : textGroup.groups) == null ? void 0 : _b.text;
        text = (_f = (_d = textGroup == null ? void 0 : textGroup.groups) == null ? void 0 : _d.text) != null ? _f : (_e = valueGroup == null ? void 0 : valueGroup.groups) == null ? void 0 : _e.value;
      } else if (manyMatches) {
        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];
          options.push({ label: match[1], value: match[1] });
        }
        continue;
      } else if (firstMatch) {
        text = firstMatch[1];
        value = firstMatch[1];
      }
    }
    options.push({ label: text, value });
  }
  options = uniqBy(options, "value");
  return sortVariableValues(options, sort);
};
const getAllMatches = (str, regex) => {
  const results = [];
  let matches = null;
  regex.lastIndex = 0;
  do {
    matches = regex.exec(str);
    if (matches) {
      results.push(matches);
    }
  } while (regex.global && matches && matches[0] !== "" && matches[0] !== void 0);
  return results;
};
const sortVariableValues = (options, sortOrder) => {
  if (sortOrder === VariableSort.disabled) {
    return options;
  }
  const sortByNumeric = (opt) => {
    if (!opt.text) {
      return -1;
    }
    const matches = opt.text.match(/.*?(\d+).*/);
    if (!matches || matches.length < 2) {
      return -1;
    } else {
      return parseInt(matches[1], 10);
    }
  };
  const sortByNaturalSort = (options2) => {
    return options2.sort((a, b) => {
      if (!a.text) {
        return -1;
      }
      if (!b.text) {
        return 1;
      }
      return a.text.localeCompare(b.text, void 0, { numeric: true });
    });
  };
  switch (sortOrder) {
    case VariableSort.alphabeticalAsc:
      options = sortBy(options, "label");
      break;
    case VariableSort.alphabeticalDesc:
      options = sortBy(options, "label").reverse();
      break;
    case VariableSort.numericalAsc:
      options = sortBy(options, sortByNumeric);
      break;
    case VariableSort.numericalDesc:
      options = sortBy(options, sortByNumeric);
      options = options.reverse();
      break;
    case VariableSort.alphabeticalCaseInsensitiveAsc:
      options = sortBy(options, (opt) => {
        return toLower(opt.label);
      });
      break;
    case VariableSort.alphabeticalCaseInsensitiveDesc:
      options = sortBy(options, (opt) => {
        return toLower(opt.label);
      });
      options = options.reverse();
      break;
    case (VariableSort.naturalAsc || 7):
      options = sortByNaturalSort(options);
      break;
    case (VariableSort.naturalDesc || 8):
      options = sortByNaturalSort(options);
      options = options.reverse();
      break;
  }
  return options;
};

export { metricNamesToVariableValues, sortVariableValues };
//# sourceMappingURL=utils.js.map

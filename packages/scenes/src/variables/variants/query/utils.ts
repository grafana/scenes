import { isNumber, sortBy, toLower, uniqBy } from 'lodash';

import { stringToJsRegex, VariableSort } from '@grafana/data';

import { VariableValueOption } from '../../types';

export const metricNamesToVariableValues = (variableRegEx: string, sort: VariableSort, metricNames: any[]) => {
  let regex;
  let options: VariableValueOption[] = [];

  if (variableRegEx) {
    regex = stringToJsRegex(variableRegEx);
  }

  for (let i = 0; i < metricNames.length; i++) {
    const item = metricNames[i];
    let text = item.text === undefined || item.text === null ? item.value : item.text;
    let value = item.value === undefined || item.value === null ? item.text : item.value;

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
        value = valueGroup?.groups?.value ?? textGroup?.groups?.text;
        text = textGroup?.groups?.text ?? valueGroup?.groups?.value;
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

    options.push({ label: text, value: value });
  }

  options = uniqBy(options, 'value');
  return sortVariableValues(options, sort);
};

const getAllMatches = (str: string, regex: RegExp): RegExpExecArray[] => {
  const results: RegExpExecArray[] = [];
  let matches = null;

  regex.lastIndex = 0;

  do {
    matches = regex.exec(str);
    if (matches) {
      results.push(matches);
    }
  } while (regex.global && matches && matches[0] !== '' && matches[0] !== undefined);

  return results;
};

export const sortVariableValues = (options: any[], sortOrder: VariableSort) => {
  if (sortOrder === VariableSort.disabled) {
    return options;
  }

  // @ts-ignore
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

  // @ts-ignore
  const sortByNaturalSort = (options) => {
    //@ts-ignore
    return options.sort((a, b) => {
      if (!a.text) {
        return -1;
      }

      if (!b.text) {
        return 1;
      }

      return a.text.localeCompare(b.text, undefined, { numeric: true });
    });
  };

  switch (sortOrder) {
    case VariableSort.alphabeticalAsc:
      options = sortBy(options, 'value');
      break;
    case VariableSort.alphabeticalDesc:
      options = sortBy(options, 'value').reverse();
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
        return toLower(opt.value);
      });
      break;
    case VariableSort.alphabeticalCaseInsensitiveDesc:
      options = sortBy(options, (opt) => {
        return toLower(opt.value);
      });
      options = options.reverse();
      break;
    // TODO remove harcoded value and ts-expect-error when schema package is updated
    // @ts-expect-error
    case VariableSort.naturalAsc || 7:
      // Sort by natural sort
      options = sortByNaturalSort(options);
      break;
    // TODO remove ts-expect-error when schema package is updated
    // @ts-expect-error
    case VariableSort.naturalDesc || 8:
      options = sortByNaturalSort(options);
      options = options.reverse();
      break;
    default:
      break;
  }
  return options;
};

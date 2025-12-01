import { isNumber, sortBy, toLower, uniqBy } from 'lodash';

import { stringToJsRegex, VariableSort } from '@grafana/data';

import { VariableValueOption } from '../../types';

export function metricNamesToVariableValues(variableRegEx: string, sort: VariableSort, metricNames: any[]) {
  let regex;
  let options: VariableValueOption[] = [];

  if (variableRegEx) {
    regex = stringToJsRegex(variableRegEx);
  }

  for (let i = 0; i < metricNames.length; i++) {
    const item = metricNames[i];
    let text = item.text ?? item.value ?? '';
    let value = item.value ?? item.text ?? '';

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

    options.push({ label: text, value: value, properties: item.properties });
  }

  options = uniqBy(options, 'value');
  return sortVariableValues(options, sort);
}

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

export const sortVariableValues = (options: VariableValueOption[], sortOrder: VariableSort) => {
  if (sortOrder === VariableSort.disabled) {
    return options;
  }

  switch (sortOrder) {
    case VariableSort.alphabeticalAsc:
      options = sortBy(options, 'label');
      break;
    case VariableSort.alphabeticalDesc:
      options = sortBy(options, 'label').reverse();
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
    case VariableSort.naturalAsc:
      // Sort by natural sort
      options = sortByNaturalSort(options);
      break;
    case VariableSort.naturalDesc:
      options = sortByNaturalSort(options);
      options = options.reverse();
      break;
    default:
      break;
  }
  return options;
};

function sortByNumeric(opt: VariableValueOption) {
  if (!opt.label) {
    return -1;
  }
  const matches = opt.label.match(/.*?(\d+).*/);
  if (!matches || matches.length < 2) {
    return -1;
  } else {
    return parseInt(matches[1], 10);
  }
}

const collator = new Intl.Collator(undefined, { sensitivity: 'accent', numeric: true });

function sortByNaturalSort(options: VariableValueOption[]) {
  return options.slice().sort((a, b) => {
    return collator.compare(a.label, b.label);
  });
}

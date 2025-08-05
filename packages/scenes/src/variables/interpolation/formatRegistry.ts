import { isArray, map, replace } from 'lodash';

import { dateTime, Registry, RegistryItem, textUtil, escapeRegex, urlUtil } from '@grafana/data';
import { VariableType, VariableFormatID } from '@grafana/schema';

import { VariableValue, VariableValueSingle } from '../types';
import { ALL_VARIABLE_VALUE } from '../constants';
import { SceneObjectUrlSyncHandler } from '../../core/types';

export interface FormatRegistryItem extends RegistryItem {
  formatter(value: VariableValue, args: string[], variable: FormatVariable, fieldPath?: string): string;
}

/**
 * Slimmed down version of the SceneVariable interface so that it only contains what the formatters actually use.
 * This is useful as we have some implementations of this interface that does not need to be full scene objects.
 * For example ScopedVarsVariable and LegacyVariableWrapper.
 */
export interface FormatVariable {
  state: {
    name: string;
    type: VariableType | string;
    isMulti?: boolean;
    includeAll?: boolean;
  };

  getValue(fieldPath?: string): VariableValue | undefined | null;
  getValueText?(fieldPath?: string): string;
  urlSync?: SceneObjectUrlSyncHandler;
}

export const formatRegistry = new Registry<FormatRegistryItem>(() => {
  const formats: FormatRegistryItem[] = [
    {
      id: VariableFormatID.Lucene,
      name: 'Lucene',
      description: 'Values are lucene escaped and multi-valued variables generate an OR expression',
      formatter: (value) => {
        if (typeof value === 'string') {
          return luceneEscape(value);
        }

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return '__empty__';
          }
          const quotedValues = map(value, (val: string) => {
            return '"' + luceneEscape(val) + '"';
          });
          return '(' + quotedValues.join(' OR ') + ')';
        } else {
          return luceneEscape(`${value}`);
        }
      },
    },
    {
      id: VariableFormatID.Raw,
      name: 'raw',
      description: 'Keep value as is',
      formatter: (value) => String(value),
    },
    {
      id: VariableFormatID.Regex,
      name: 'Regex',
      description: 'Values are regex escaped and multi-valued variables generate a (<value>|<value>) expression',
      formatter: (value) => {
        if (typeof value === 'string') {
          return escapeRegex(value);
        }

        if (Array.isArray(value)) {
          const escapedValues = value.map((item) => {
            if (typeof item === 'string') {
              return escapeRegex(item);
            } else {
              return escapeRegex(String(item));
            }
          });

          if (escapedValues.length === 1) {
            return escapedValues[0];
          }

          return '(' + escapedValues.join('|') + ')';
        }

        return escapeRegex(`${value}`);
      },
    },
    {
      id: VariableFormatID.Pipe,
      name: 'Pipe',
      description: 'Values are separated by | character',
      formatter: (value) => {
        if (typeof value === 'string') {
          return value;
        }

        if (Array.isArray(value)) {
          return value.join('|');
        }

        return `${value}`;
      },
    },
    {
      id: VariableFormatID.Distributed,
      name: 'Distributed',
      description: 'Multiple values are formatted like variable=value',
      formatter: (value, args, variable) => {
        if (typeof value === 'string') {
          return value;
        }

        if (Array.isArray(value)) {
          value = map(value, (val: string, index: number) => {
            if (index !== 0) {
              return variable.state.name + '=' + val;
            } else {
              return val;
            }
          });

          return value.join(',');
        }

        return `${value}`;
      },
    },
    {
      id: VariableFormatID.CSV,
      name: 'Csv',
      description: 'Comma-separated values',
      formatter: (value) => {
        if (typeof value === 'string') {
          return value;
        }

        if (isArray(value)) {
          return value.join(',');
        }

        return String(value);
      },
    },
    {
      id: VariableFormatID.HTML,
      name: 'HTML',
      description: 'HTML escaping of values',
      formatter: (value) => {
        if (typeof value === 'string') {
          return textUtil.escapeHtml(value);
        }

        if (isArray(value)) {
          return textUtil.escapeHtml(value.join(', '));
        }

        return textUtil.escapeHtml(String(value));
      },
    },
    {
      id: VariableFormatID.JSON,
      name: 'JSON',
      description: 'JSON stringify value',
      formatter: (value) => {
        if (typeof value === 'string') {
          return value;
        }
        return JSON.stringify(value);
      },
    },
    {
      id: VariableFormatID.PercentEncode,
      name: 'Percent encode',
      description: 'Useful for URL escaping values',
      formatter: (value) => {
        // like glob, but url escaped
        if (isArray(value)) {
          return encodeURIComponentStrict('{' + value.join(',') + '}');
        }

        return encodeURIComponentStrict(value);
      },
    },
    {
      id: VariableFormatID.SingleQuote,
      name: 'Single quote',
      description: 'Single quoted values',
      formatter: (value) => {
        // escape single quotes with backslash
        const regExp = new RegExp(`'`, 'g');

        if (isArray(value)) {
          return map(value, (v: string) => `'${replace(v, regExp, `\\'`)}'`).join(',');
        }

        let strVal = typeof value === 'string' ? value : String(value);
        return `'${replace(strVal, regExp, `\\'`)}'`;
      },
    },
    {
      id: VariableFormatID.DoubleQuote,
      name: 'Double quote',
      description: 'Double quoted values',
      formatter: (value) => {
        // escape double quotes with backslash
        const regExp = new RegExp('"', 'g');
        if (isArray(value)) {
          return map(value, (v: string) => `"${replace(v, regExp, '\\"')}"`).join(',');
        }

        let strVal = typeof value === 'string' ? value : String(value);
        return `"${replace(strVal, regExp, '\\"')}"`;
      },
    },
    {
      id: VariableFormatID.SQLString,
      name: 'SQL string',
      description: 'SQL string quoting and commas for use in IN statements and other scenarios',
      formatter: sqlStringFormatter,
    },
    {
      id: VariableFormatID.Date,
      name: 'Date',
      description: 'Format date in different ways',
      formatter: (value, args) => {
        let nrValue = NaN;

        if (typeof value === 'number') {
          nrValue = value;
        } else if (typeof value === 'string') {
          nrValue = parseInt(value, 10);
        }

        if (isNaN(nrValue)) {
          return 'NaN';
        }

        const arg = args[0] ?? 'iso';
        switch (arg) {
          case 'ms':
            return String(value);
          case 'seconds':
            return `${Math.round(nrValue! / 1000)}`;
          case 'iso':
            return dateTime(nrValue).toISOString();
          default:
            if ((args || []).length > 1) {
              return dateTime(nrValue).format(args.join(':'));
            }
            return dateTime(nrValue).format(arg);
        }
      },
    },
    {
      id: VariableFormatID.Glob,
      name: 'Glob',
      description: 'Format multi-valued variables using glob syntax, example {value1,value2}',
      formatter: (value) => {
        if (isArray(value) && value.length > 1) {
          return '{' + value.join(',') + '}';
        }
        return String(value);
      },
    },
    {
      id: VariableFormatID.Text,
      name: 'Text',
      description: 'Format variables in their text representation. Example in multi-variable scenario A + B + C.',
      formatter: (value, _args, variable, fieldPath) => {
        if (variable.getValueText) {
          return variable.getValueText(fieldPath);
        }

        return String(value);
      },
    },
    {
      id: VariableFormatID.QueryParam,
      name: 'Query parameter',
      description:
        'Format variables as URL parameters. Example in multi-variable scenario A + B + C => var-foo=A&var-foo=B&var-foo=C.',
      formatter: (value, _args, variable) => {
        if (variable.urlSync) {
          const urlParam = variable.urlSync.getUrlState();
          return urlUtil.toUrlParams(urlParam);
        }

        if (Array.isArray(value)) {
          return value.map((v) => formatQueryParameter(variable.state.name, v)).join('&');
        }

        return formatQueryParameter(variable.state.name, value);
      },
    },
    {
      id: VariableFormatID.UriEncode,
      name: 'Percent encode as URI',
      description: 'Useful for URL escaping values, taking into URI syntax characters',
      formatter: (value: VariableValue) => {
        if (isArray(value)) {
          return encodeURIStrict('{' + value.join(',') + '}');
        }

        return encodeURIStrict(value);
      },
    },
  ];

  return formats;
});

function luceneEscape(value: string) {
  if (isNaN(+value) === false) {
    return value;
  }

  return value.replace(/([\!\*\+\-\=<>\s\&\|\(\)\[\]\{\}\^\~\?\:\\/"])/g, '\\$1');
}

/**
 * encode string according to RFC 3986; in contrast to encodeURIComponent()
 * also the sub-delims "!", "'", "(", ")" and "*" are encoded;
 * unicode handling uses UTF-8 as in ECMA-262.
 */
function encodeURIComponentStrict(str: VariableValueSingle) {
  if (typeof str === 'object') {
    str = String(str);
  }

  return replaceSpecialCharactersToASCII(encodeURIComponent(str));
}

const encodeURIStrict = (str: VariableValueSingle): string => replaceSpecialCharactersToASCII(encodeURI(String(str)));

const replaceSpecialCharactersToASCII = (value: string): string =>
  value.replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });

function formatQueryParameter(name: string, value: VariableValueSingle): string {
  return `var-${name}=${encodeURIComponentStrict(value)}`;
}

export function isAllValue(value: VariableValueSingle) {
  return value === ALL_VARIABLE_VALUE || (Array.isArray(value) && value[0] === ALL_VARIABLE_VALUE);
}

const SQL_ESCAPE_MAP: Record<string, string> = {
  "'": "''",
  '"': '\\"',
};

function sqlStringFormatter(value: VariableValue) {
  // escape single quotes by pairing them
  const regExp = new RegExp(`'|"`, 'g');

  if (isArray(value)) {
    return map(value, (v: string) => `'${replace(v, regExp, (match) => SQL_ESCAPE_MAP[match] ?? '')}'`).join(',');
  }

  let strVal = typeof value === 'string' ? value : String(value);
  return `'${replace(strVal, regExp, (match) => SQL_ESCAPE_MAP[match] ?? '')}'`;
}

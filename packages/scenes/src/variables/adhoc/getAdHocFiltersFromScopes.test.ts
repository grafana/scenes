import { Scope, ScopeSpecFilter } from '@grafana/data';
import { getAdHocFiltersFromScopes } from './getAdHocFiltersFromScopes';

describe('getAdHocFiltersFromScopes', () => {
  it('should return empty filters when no scopes are provided', () => {
    let scopes = generateScopes([]);

    expect(scopes).toEqual([]);
    expect(getAdHocFiltersFromScopes(scopes)).toEqual([]);

    scopes = generateScopes([[], []]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([]);
  });

  it('should return filters formatted for adHoc from a single scope', () => {
    let scopes = generateScopes([
      [
        { key: 'key1', value: 'value1', operator: 'equals' },
        { key: 'key2', value: 'value2', operator: 'not-equals' },
        { key: 'key3', value: 'value3', operator: 'regex-not-match' },
      ],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      { key: 'key1', value: 'value1', operator: '=', origin: 'scope', values: ['value1'] },
      { key: 'key2', value: 'value2', operator: '!=', origin: 'scope', values: ['value2'] },
      { key: 'key3', value: 'value3', operator: '!~', origin: 'scope', values: ['value3'] },
    ]);

    scopes = generateScopes([[{ key: 'key3', value: 'value3', operator: 'regex-match' }]]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      { key: 'key3', value: 'value3', operator: '=~', origin: 'scope', values: ['value3'] },
    ]);
  });

  it('should return filters formatted for adHoc from multiple scopes with single values', () => {
    let scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'equals' }],
      [{ key: 'key2', value: 'value2', operator: 'regex-match' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      { key: 'key1', value: 'value1', operator: '=', origin: 'scope', values: ['value1'] },
      { key: 'key2', value: 'value2', operator: '=~', origin: 'scope', values: ['value2'] },
    ]);
  });

  it('should not process if filter is undefined', () => {
    let scopes = generateScopes([
      // @ts-ignore
      [undefined],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([]);
  });

  it('should return filters formatted for adHoc from multiple scopes with multiple values', () => {
    let scopes = generateScopes([
      [
        { key: 'key1', value: 'value1', operator: 'equals' },
        { key: 'key2', value: 'value2', operator: 'not-equals' },
      ],
      [
        { key: 'key3', value: 'value3', operator: 'regex-match' },
        { key: 'key4', value: 'value4', operator: 'regex-match' },
      ],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      { key: 'key1', value: 'value1', operator: '=', origin: 'scope', values: ['value1'] },
      { key: 'key2', value: 'value2', operator: '!=', origin: 'scope', values: ['value2'] },
      { key: 'key3', value: 'value3', operator: '=~', origin: 'scope', values: ['value3'] },
      { key: 'key4', value: 'value4', operator: '=~', origin: 'scope', values: ['value4'] },
    ]);
  });

  it('should return formatted filters and concat values of the same key, coming from different scopes, if operator supports multi-value', () => {
    let scopes = generateScopes([
      [
        { key: 'key1', value: 'value1', operator: 'equals' },
        { key: 'key2', value: 'value2', operator: 'not-equals' },
      ],
      [
        { key: 'key1', value: 'value3', operator: 'equals' },
        { key: 'key2', value: 'value4', operator: 'not-equals' },
      ],
      [{ key: 'key1', value: 'value5', operator: 'equals' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1',
        operator: '=|',
        origin: 'scope',
        values: ['value1', 'value3', 'value5'],
      },
      { key: 'key2', value: 'value2', operator: '!=|', origin: 'scope', values: ['value2', 'value4'] },
    ]);
  });

  it('should ignore the rest of the duplicate filters, if they are a combination of equals and not-equals', () => {
    let scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'equals' }],
      [{ key: 'key1', value: 'value2', operator: 'not-equals' }],
      [{ key: 'key1', value: 'value3', operator: 'equals' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1',
        operator: '=|',
        origin: 'scope',
        values: ['value1', 'value3'],
      },
      {
        key: 'key1',
        value: 'value2',
        operator: '!=',
        origin: 'scope',
        values: ['value2'],
      },
    ]);
  });

  it('should format regex filters by merging all values with pipe-OR operator', () => {
    let scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'regex-not-match' }],
      [{ key: 'key1', value: 'value2', operator: 'regex-not-match' }],
      [{ key: 'key1', value: 'value3', operator: 'regex-not-match' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1|value2|value3',
        operator: '!~',
        origin: 'scope',
        values: ['value1|value2|value3'],
      },
    ]);
  });

  it('should format regex filters by merging values where possible else leaving as-is', () => {
    let scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'regex-not-match' }],
      [{ key: 'key1', value: 'value2', operator: 'regex-not-match' }],
      // same key, diff operator
      [{ key: 'key1', value: 'value3', operator: 'regex-match' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1|value2',
        operator: '!~',
        origin: 'scope',
        values: ['value1|value2'],
      },
      {
        key: 'key1',
        value: 'value3',
        operator: '=~',
        origin: 'scope',
        values: ['value3'],
      },
    ]);
  });

  it('should format regex filters by merging all values with pipe-OR operator', () => {
    let scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'regex-match' }],
      [{ key: 'key1', value: 'value2', operator: 'regex-match' }],
      [{ key: 'key1', value: 'value3', operator: 'regex-match' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1|value2|value3',
        operator: '=~',
        origin: 'scope',
        values: ['value1|value2|value3'],
      },
    ]);
  });

  it('should return formatted filters on equality and regex filters and keep only the rest unmodified', () => {
    let scopes = generateScopes([
      [
        { key: 'key1', value: 'value1', operator: 'regex-match' },
        { key: 'key2', value: 'value2', operator: 'not-equals' },
      ],
      [
        { key: 'key1', value: 'value3', operator: 'regex-match' },
        { key: 'key2', value: 'value4', operator: 'not-equals' },
      ],
      [{ key: 'key1', value: 'value5', operator: 'equals' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1|value3',
        operator: '=~',
        origin: 'scope',
        values: ['value1|value3'],
      },
      { key: 'key2', value: 'value2', operator: '!=|', origin: 'scope', values: ['value2', 'value4'] },
      {
        key: 'key1',
        value: 'value5',
        operator: '=',
        origin: 'scope',
        values: ['value5'],
      },
    ]);

    scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'regex-match' }],
      [{ key: 'key1', value: 'value5', operator: 'equals' }],
      [{ key: 'key1', value: 'value3', operator: 'regex-match' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1|value3',
        operator: '=~',
        origin: 'scope',
        values: ['value1|value3'],
      },
      {
        key: 'key1',
        value: 'value5',
        operator: '=',
        origin: 'scope',
        values: ['value5'],
      },
    ]);
  });

  it('should return formatted filters and concat values that are multi-value and drop duplicates with non multi-value operator', () => {
    let scopes = generateScopes([
      [{ key: 'key1', value: 'value1', operator: 'equals' }],
      [{ key: 'key1', value: 'value2', operator: 'regex-match' }],
      [{ key: 'key1', value: 'value3', operator: 'equals' }],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1',
        operator: '=|',
        origin: 'scope',
        values: ['value1', 'value3'],
      },
      {
        key: 'key1',
        value: 'value2',
        operator: '=~',
        origin: 'scope',
        values: ['value2'],
      },
    ]);

    scopes = generateScopes([
      [
        { key: 'key1', value: 'value1', operator: 'equals' },
        { key: 'key2', value: 'value2', operator: 'equals' },
      ],
      [
        { key: 'key1', value: 'value3', operator: 'equals' },
        { key: 'key2', value: 'value4', operator: 'equals' },
      ],
      [
        { key: 'key1', value: 'value5', operator: 'regex-match' },
        { key: 'key2', value: 'value6', operator: 'equals' },
      ],
      [
        { key: 'key1', value: 'value7', operator: 'equals' },
        { key: 'key2', value: 'value8', operator: 'regex-match' },
      ],
      [
        { key: 'key1', value: 'value9', operator: 'equals' },
        { key: 'key2', value: 'value10', operator: 'equals' },
      ],
    ]);

    expect(getAdHocFiltersFromScopes(scopes)).toEqual([
      {
        key: 'key1',
        value: 'value1',
        operator: '=|',
        origin: 'scope',
        values: ['value1', 'value3', 'value7', 'value9'],
      },
      {
        key: 'key2',
        value: 'value2',
        operator: '=|',
        origin: 'scope',
        values: ['value2', 'value4', 'value6', 'value10'],
      },
      {
        key: 'key1',
        value: 'value5',
        operator: '=~',
        origin: 'scope',
        values: ['value5'],
      },
      {
        key: 'key2',
        value: 'value8',
        operator: '=~',
        origin: 'scope',
        values: ['value8'],
      },
    ]);
  });
});

function generateScopes(filtersSpec: ScopeSpecFilter[][]) {
  const scopes: Scope[] = [];

  for (let i = 0; i < filtersSpec.length; i++) {
    scopes.push({
      metadata: { name: `name-${i}` },
      spec: {
        title: `scope-${i}`,
        filters: filtersSpec[i],
      },
    });
  }

  return scopes;
}

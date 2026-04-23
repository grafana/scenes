import { renderHook } from '@testing-library/react';

import { useFreeFormExpression, UseFreeFormExpressionProps } from './useFreeFormExpression';
import { OPERATORS } from '../AdHocFiltersVariable';
import { AdHocFiltersController } from '../controller/AdHocFiltersController';

const DEFAULT_OPERATORS = OPERATORS.map(({ value }) => ({ value }));

function createController(overrides?: Partial<AdHocFiltersController>): AdHocFiltersController {
  return {
    useState: () => ({ filters: [] }),
    getKeys: jest.fn().mockResolvedValue([]),
    getValuesFor: jest.fn().mockResolvedValue([]),
    getOperators: jest.fn().mockReturnValue(DEFAULT_OPERATORS),
    updateFilter: jest.fn(),
    updateToMatchAll: jest.fn(),
    removeFilter: jest.fn(),
    removeLastFilter: jest.fn(),
    handleComboboxBackspace: jest.fn(),
    addWip: jest.fn(),
    restoreOriginalFilter: jest.fn(),
    ...overrides,
  };
}

function renderFreeForm(props: Partial<UseFreeFormExpressionProps> = {}) {
  const defaults: UseFreeFormExpressionProps = {
    controller: createController(),
    filter: { key: 'instance', keyLabel: 'Instance', operator: '=', value: '' },
    inputValue: '',
    filterInputType: 'key',
    allowCustomValue: true,
    isGroupBy: false,
  };
  return renderHook((p: UseFreeFormExpressionProps) => useFreeFormExpression(p), {
    initialProps: { ...defaults, ...props },
  });
}

describe('useFreeFormExpression', () => {
  describe('parseExpression / parsedExpression gating', () => {
    it.each<[string, Partial<UseFreeFormExpressionProps>]>([
      ['allowCustomValue is false', { inputValue: 'instance = tempo', allowCustomValue: false }],
      ['isGroupBy is true', { inputValue: 'instance = tempo', isGroupBy: true }],
      ['filterInputType is "value"', { inputValue: 'instance = tempo', filterInputType: 'value' }],
      ['input is empty', { inputValue: '' }],
      ['input is whitespace only', { inputValue: '   ' }],
      ['input has no recognised operator', { inputValue: 'just a key' }],
    ])('returns null when %s', (_label, props) => {
      const { result } = renderFreeForm(props);
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.canCommitExpression).toBe(false);
    });
  });

  describe('parseExpression / parsedExpression success', () => {
    it.each<[string, string, { key: string | undefined; operator: string; value: string }]>([
      [
        'full expression (key + operator + value)',
        'instance = tempo',
        { key: 'instance', operator: '=', value: 'tempo' },
      ],
      ['partial expression (operator + value, no key)', '= tempo', { key: undefined, operator: '=', value: 'tempo' }],
      ['operator-only input (operator, no value)', 'instance =', { key: 'instance', operator: '=', value: '' }],
    ])('parses %s', (_label, inputValue, expected) => {
      const { result } = renderFreeForm({ inputValue });
      expect(result.current.parsedExpression).toEqual(expected);
    });

    it('parseExpression(inputValue) matches the memoised parsedExpression', () => {
      const { result } = renderFreeForm({ inputValue: 'region =| us-east, us-west' });
      expect(result.current.parseExpression('region =| us-east, us-west')).toEqual(result.current.parsedExpression);
    });
  });

  describe('canCommitExpression — mode-aware commitability', () => {
    it.each<[string, Partial<UseFreeFormExpressionProps>, boolean]>([
      ['key mode + full expression', { filterInputType: 'key', inputValue: 'instance = tempo' }, true],
      ['key mode + operator-only input with key', { filterInputType: 'key', inputValue: 'instance =' }, true],
      ['key mode + partial expression (no key)', { filterInputType: 'key', inputValue: '= tempo' }, false],
      [
        'operator mode + partial expression (filter.key fills in)',
        {
          filterInputType: 'operator',
          filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
          inputValue: '= tempo',
        },
        true,
      ],
    ])('%s → canCommitExpression=%s', (_label, props, expected) => {
      const { result } = renderFreeForm(props);
      expect(result.current.canCommitExpression).toBe(expected);
    });
  });

  describe('commitExpressionUpdate — guards', () => {
    it.each<[string, Partial<UseFreeFormExpressionProps>]>([
      ['filter is undefined', { filter: undefined, inputValue: 'instance = tempo' }],
      ['there is no parseable expression', { inputValue: 'just a key' }],
      [
        'parsing yields no key and we are not in operator input mode',
        { filterInputType: 'key', filter: { key: '', operator: '', value: '' }, inputValue: '= tempo' },
      ],
    ])('returns null when %s', (_label, props) => {
      const { result } = renderFreeForm(props);
      expect(result.current.commitExpressionUpdate()).toBeNull();
    });
  });

  describe('commitExpressionUpdate — full commits (filterInputType="key")', () => {
    it('builds an update for a full single-value expression', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '', value: '' },
        inputValue: 'instance = tempo',
      });

      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'instance',
        keyLabel: 'instance',
        operator: '=',
        value: 'tempo',
        valueLabels: ['tempo'],
        values: undefined,
      });
    });

    it('explicitly clears `values` on single-value commits to unwind a previous multi-value state', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '=|', value: 'a', values: ['a', 'b'], valueLabels: ['a', 'b'] },
        inputValue: 'instance = tempo',
      });
      expect(result.current.commitExpressionUpdate()).toMatchObject({ values: undefined });
    });

    it('builds an update for a multi-value expression (splits commas, trims, filters blanks)', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '', value: '' },
        inputValue: 'region =| us-east,  us-west , eu-north',
      });
      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'region',
        keyLabel: 'region',
        operator: '=|',
        value: 'us-east',
        values: ['us-east', 'us-west', 'eu-north'],
        valueLabels: ['us-east', 'us-west', 'eu-north'],
      });
    });

    it('stages operator-only (no value) when the user has not typed a value yet', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '', value: '' },
        inputValue: 'instance =',
      });
      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'instance',
        keyLabel: 'instance',
        operator: '=',
      });
    });

    it('falls back to operator-only staging for multi-value operator with comma-only input', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '', value: '' },
        inputValue: 'region =| ,,  , ',
      });
      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'region',
        keyLabel: 'region',
        operator: '=|',
      });
    });
  });

  describe('commitExpressionUpdate — partial commits (filterInputType="operator")', () => {
    it('uses the staged filter.key when parsing has no key', () => {
      const { result } = renderFreeForm({
        filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
        filterInputType: 'operator',
        inputValue: '= tempo',
      });
      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'instance',
        keyLabel: 'Instance',
        operator: '=',
        value: 'tempo',
        valueLabels: ['tempo'],
        values: undefined,
      });
    });

    it('falls back to filter.key when filter.keyLabel is undefined', () => {
      const { result } = renderFreeForm({
        filter: { key: 'instance', operator: '', value: '' },
        filterInputType: 'operator',
        inputValue: '= tempo',
      });
      expect(result.current.commitExpressionUpdate()).toMatchObject({
        key: 'instance',
        keyLabel: 'instance',
      });
    });

    it('supports multi-value operators with a staged key', () => {
      const { result } = renderFreeForm({
        filter: { key: 'region', keyLabel: 'Region', operator: '', value: '' },
        filterInputType: 'operator',
        inputValue: '=| a, b',
      });
      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'region',
        keyLabel: 'Region',
        operator: '=|',
        value: 'a',
        values: ['a', 'b'],
        valueLabels: ['a', 'b'],
      });
    });

    it('stages operator-only when value is missing', () => {
      const { result } = renderFreeForm({
        filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
        filterInputType: 'operator',
        inputValue: '=',
      });
      expect(result.current.commitExpressionUpdate()).toEqual({
        key: 'instance',
        keyLabel: 'Instance',
        operator: '=',
      });
    });
  });
});

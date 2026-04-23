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
    it('returns null when allowCustomValue is false', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo', allowCustomValue: false });
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.isExpressionInput).toBe(false);
      expect(result.current.parseExpression('foo = bar')).toBeNull();
    });

    it('returns null when isGroupBy is true', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo', isGroupBy: true });
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.parseExpression('foo = bar')).toBeNull();
    });

    it('returns null when filterInputType is "value"', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo', filterInputType: 'value' });
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.parseExpression('foo = bar')).toBeNull();
    });

    it('returns null for empty / whitespace input', () => {
      const empty = renderFreeForm({ inputValue: '' });
      expect(empty.result.current.parsedExpression).toBeNull();

      const whitespace = renderFreeForm({ inputValue: '   ' });
      expect(whitespace.result.current.parsedExpression).toBeNull();
    });

    it('returns null for input without a recognised operator', () => {
      const { result } = renderFreeForm({ inputValue: 'just a key' });
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.isExpressionInput).toBe(false);
    });
  });

  describe('parseExpression / parsedExpression success', () => {
    it('parses a full expression (key + operator + value)', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo' });
      expect(result.current.parsedExpression).toEqual({ key: 'instance', operator: '=', value: 'tempo' });
      expect(result.current.isExpressionInput).toBe(true);
    });

    it('parses a partial expression (operator + value, no key)', () => {
      const { result } = renderFreeForm({ inputValue: '= tempo' });
      expect(result.current.parsedExpression).toEqual({ key: undefined, operator: '=', value: 'tempo' });
    });

    it('parses operator-only input (operator, no value)', () => {
      const { result } = renderFreeForm({ inputValue: 'instance =' });
      expect(result.current.parsedExpression).toEqual({ key: 'instance', operator: '=', value: '' });
    });

    it('parseExpression(inputValue) matches the memoised parsedExpression', () => {
      const { result } = renderFreeForm({ inputValue: 'region =| us-east, us-west' });
      expect(result.current.parseExpression('region =| us-east, us-west')).toEqual(result.current.parsedExpression);
    });
  });

  describe('buildExpressionUpdate — guards', () => {
    it('returns null when filter is undefined', () => {
      const { result } = renderFreeForm({ filter: undefined, inputValue: 'instance = tempo' });
      expect(result.current.buildExpressionUpdate()).toBeNull();
    });

    it('returns null when there is no parseable expression', () => {
      const { result } = renderFreeForm({ inputValue: 'just a key' });
      expect(result.current.buildExpressionUpdate()).toBeNull();
    });

    it('returns null when parsing yields no key and we are not in operator input mode', () => {
      // filterInputType='key' + partial expression ("= tempo") has no key to stage against
      const { result } = renderFreeForm({
        filterInputType: 'key',
        filter: { key: '', operator: '', value: '' },
        inputValue: '= tempo',
      });
      expect(result.current.buildExpressionUpdate()).toBeNull();
    });
  });

  describe('buildExpressionUpdate — full commits (filterInputType="key")', () => {
    it('builds an update for a full single-value expression', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '', value: '' },
        inputValue: 'instance = tempo',
      });

      expect(result.current.buildExpressionUpdate()).toEqual({
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
      expect(result.current.buildExpressionUpdate()).toMatchObject({ values: undefined });
    });

    it('builds an update for a multi-value expression (splits commas, trims, filters blanks)', () => {
      const { result } = renderFreeForm({
        filter: { key: '', operator: '', value: '' },
        inputValue: 'region =| us-east,  us-west , eu-north',
      });
      expect(result.current.buildExpressionUpdate()).toEqual({
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
      expect(result.current.buildExpressionUpdate()).toEqual({
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
      expect(result.current.buildExpressionUpdate()).toEqual({
        key: 'region',
        keyLabel: 'region',
        operator: '=|',
      });
    });
  });

  describe('buildExpressionUpdate — partial commits (filterInputType="operator")', () => {
    it('uses the staged filter.key when parsing has no key', () => {
      const { result } = renderFreeForm({
        filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
        filterInputType: 'operator',
        inputValue: '= tempo',
      });
      expect(result.current.buildExpressionUpdate()).toEqual({
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
      expect(result.current.buildExpressionUpdate()).toMatchObject({
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
      expect(result.current.buildExpressionUpdate()).toEqual({
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
      expect(result.current.buildExpressionUpdate()).toEqual({
        key: 'instance',
        keyLabel: 'Instance',
        operator: '=',
      });
    });
  });
});

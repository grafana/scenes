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
    populateInputOnEdit: false,
  };
  return renderHook((p: UseFreeFormExpressionProps) => useFreeFormExpression(p), {
    initialProps: { ...defaults, ...props },
  });
}

describe('useFreeFormExpression', () => {
  describe('canCommitExpressionUpdate — hook-level gates', () => {
    it('is false when allowCustomValue is disabled', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo', allowCustomValue: false });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is false in groupBy mode', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo', isGroupBy: true });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is false when the input type is "value" (user is picking a value, not typing an expression)', () => {
      const { result } = renderFreeForm({ inputValue: 'instance = tempo', filterInputType: 'value' });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is false when editing a specific pill (populateInputOnEdit = true), so pill edits stay scoped to the clicked token', () => {
      const { result } = renderFreeForm({
        inputValue: 'instance = tempo',
        filterInputType: 'operator',
        populateInputOnEdit: true,
      });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is false when input is empty', () => {
      const { result } = renderFreeForm({ inputValue: '' });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is false when input is whitespace only', () => {
      const { result } = renderFreeForm({ inputValue: '   ' });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is false when the input contains no recognised operator', () => {
      const { result } = renderFreeForm({ inputValue: 'just a key' });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });
  });

  describe('canCommitExpressionUpdate — mode-aware committability', () => {
    it('is false in key mode when the expression has no key (e.g. "= tempo")', () => {
      const { result } = renderFreeForm({ filterInputType: 'key', inputValue: '= tempo' });
      expect(result.current.canCommitExpressionUpdate).toBe(false);
    });

    it('is true in key mode for a full expression', () => {
      const { result } = renderFreeForm({ filterInputType: 'key', inputValue: 'instance = tempo' });
      expect(result.current.canCommitExpressionUpdate).toBe(true);
    });

    it('is true in key mode for operator-only input with a key (e.g. "instance =")', () => {
      const { result } = renderFreeForm({ filterInputType: 'key', inputValue: 'instance =' });
      expect(result.current.canCommitExpressionUpdate).toBe(true);
    });

    it('is true in operator mode for a partial expression (filter.key fills in the missing key)', () => {
      const { result } = renderFreeForm({
        filterInputType: 'operator',
        filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
        inputValue: '= tempo',
      });
      expect(result.current.canCommitExpressionUpdate).toBe(true);
    });

    it('parseExpression(input) agrees with canCommitExpressionUpdate for the same input', () => {
      const { result } = renderFreeForm({ inputValue: 'region =| us-east, us-west' });
      expect(result.current.parseExpression('region =| us-east, us-west') !== null).toBe(
        result.current.canCommitExpressionUpdate
      );
    });
  });

  describe('canCommitFullExpression — Tab-commit gate (requires a parsed value)', () => {
    it.each<{ name: string; props: Partial<UseFreeFormExpressionProps>; expected: boolean }>([
      { name: 'empty input', props: { inputValue: '' }, expected: false },
      { name: 'key only (no operator)', props: { inputValue: 'instance' }, expected: false },
      { name: 'key + operator with no value', props: { inputValue: 'instance =' }, expected: false },
      { name: 'unparseable input', props: { inputValue: 'just a key' }, expected: false },
      { name: 'complete single-value', props: { inputValue: 'instance = tempo' }, expected: true },
      { name: 'complete negated', props: { inputValue: 'instance != tempo' }, expected: true },
      { name: 'complete multi-value', props: { inputValue: 'region =| us-east, us-west' }, expected: true },
      {
        name: 'operator mode without value',
        props: {
          filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
          filterInputType: 'operator',
          inputValue: '=',
        },
        expected: false,
      },
      {
        name: 'operator mode with value',
        props: {
          filter: { key: 'instance', keyLabel: 'Instance', operator: '', value: '' },
          filterInputType: 'operator',
          inputValue: '= tempo',
        },
        expected: true,
      },
    ])('is $expected for $name', ({ props, expected }) => {
      const { result } = renderFreeForm(props);
      expect(result.current.canCommitFullExpression).toBe(expected);
    });

    it('is false even when canCommitExpressionUpdate is true (operator-only stage like "instance =")', () => {
      const { result } = renderFreeForm({ inputValue: 'instance =' });
      expect(result.current.canCommitExpressionUpdate).toBe(true);
      expect(result.current.canCommitFullExpression).toBe(false);
    });
  });

  describe('commitExpressionUpdate — guards', () => {
    it('returns null when filter is undefined', () => {
      const { result } = renderFreeForm({ filter: undefined, inputValue: 'instance = tempo' });
      expect(result.current.commitExpressionUpdate()).toBeNull();
    });

    it('returns null when there is no parseable expression', () => {
      const { result } = renderFreeForm({ inputValue: 'just a key' });
      expect(result.current.commitExpressionUpdate()).toBeNull();
    });

    it('returns null when parsing yields no key and we are not in operator input mode', () => {
      const { result } = renderFreeForm({
        filterInputType: 'key',
        filter: { key: '', operator: '', value: '' },
        inputValue: '= tempo',
      });
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

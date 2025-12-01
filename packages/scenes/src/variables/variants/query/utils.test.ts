import {
  VariableSort,
  // @ts-expect-error TODO: remove suppression after updating grafana/data
  VariableRegexApplyTo as VariableRegexApplyToFromData,
} from '@grafana/data';
import { metricNamesToVariableValues, sortVariableValues } from './utils';
import { VariableValueOption } from '../../types';

// TODO: Fallback enum for backward compatibility with older versions of @grafana/data
const VariableRegexApplyTo =
  VariableRegexApplyToFromData ||
  ({
    value: 'value',
    text: 'text',
  } as const);

describe('metricNamesToVariableValues', () => {
  describe('Basic functionality', () => {
    it('should convert metric names to variable values without regex', () => {
      const metricNames = [
        { text: 'Option 1', value: 'opt1' },
        { text: 'Option 2', value: 'opt2' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
      ]);
    });

    it('should use value as text when text is missing', () => {
      const metricNames = [{ value: 'opt1' }, { value: 'opt2' }];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'opt1', value: 'opt1' },
        { label: 'opt2', value: 'opt2' },
      ]);
    });

    it('should use text as value when value is missing', () => {
      const metricNames = [{ text: 'Option 1' }, { text: 'Option 2' }];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Option 1', value: 'Option 1' },
        { label: 'Option 2', value: 'Option 2' },
      ]);
    });

    it('should handle null values by converting to empty strings', () => {
      const metricNames = [{ text: null, value: null }];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([{ label: '', value: '' }]);
    });

    it('should convert numbers to strings', () => {
      const metricNames = [
        { text: 123, value: 456 },
        { text: 'Text', value: 789 },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: '123', value: '456' },
        { label: 'Text', value: '789' },
      ]);
    });

    it('should remove duplicate values', () => {
      const metricNames = [
        { text: 'Option 1', value: 'opt1' },
        { text: 'Option 1 Duplicate', value: 'opt1' },
        { text: 'Option 2', value: 'opt2' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
      ]);
    });
  });

  describe('Regex filtering', () => {
    it('should filter by regex applied to value', () => {
      const metricNames = [
        { text: 'Display 1', value: 'val1' },
        { text: 'Display 2', value: 'val2' },
        { text: 'Display 11', value: 'val11' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '/^val1/',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Display 1', value: 'val1' },
        { label: 'Display 11', value: 'val11' },
      ]);
    });

    it('should filter by regex applied to text', () => {
      const metricNames = [
        { text: 'Display1', value: 'val1' },
        { text: 'Display2', value: 'val2' },
        { text: 'Display11', value: 'val11' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '/^Display1/',
        variableRegexApplyTo: VariableRegexApplyTo.text,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Display1', value: 'val1' },
        { label: 'Display11', value: 'val11' },
      ]);
    });

    it('should exclude items that do not match regex', () => {
      const metricNames = [
        { text: 'Option A', value: 'optA' },
        { text: 'Option B', value: 'optB' },
        { text: 'Option C', value: 'optC' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '/^optA$/',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([{ label: 'Option A', value: 'optA' }]);
    });
  });

  describe('Sorting', () => {
    const unsortedOptions: VariableValueOption[] = [
      { label: 'Display3', value: 'val3' },
      { label: 'Display1', value: 'val1' },
      { label: 'Display2', value: 'val2' },
    ];

    it('should not sort when sort is disabled', () => {
      const result = sortVariableValues([...unsortedOptions], VariableSort.disabled);
      expect(result).toEqual(unsortedOptions);
    });

    it('should sort alphabetically ascending', () => {
      const result = sortVariableValues([...unsortedOptions], VariableSort.alphabeticalAsc);
      expect(result).toEqual([
        { label: 'Display1', value: 'val1' },
        { label: 'Display2', value: 'val2' },
        { label: 'Display3', value: 'val3' },
      ]);
    });

    it('should sort alphabetically descending', () => {
      const result = sortVariableValues([...unsortedOptions], VariableSort.alphabeticalDesc);
      expect(result).toEqual([
        { label: 'Display3', value: 'val3' },
        { label: 'Display2', value: 'val2' },
        { label: 'Display1', value: 'val1' },
      ]);
    });

    it('should sort numerically ascending', () => {
      const numericOptions: VariableValueOption[] = [
        { label: 'Item 10', value: '10' },
        { label: 'Item 2', value: '2' },
        { label: 'Item 1', value: '1' },
      ];

      const result = sortVariableValues(numericOptions, VariableSort.numericalAsc);
      expect(result).toEqual([
        { label: 'Item 1', value: '1' },
        { label: 'Item 2', value: '2' },
        { label: 'Item 10', value: '10' },
      ]);
    });

    it('should sort numerically descending', () => {
      const numericOptions: VariableValueOption[] = [
        { label: 'Item 1', value: '1' },
        { label: 'Item 10', value: '10' },
        { label: 'Item 2', value: '2' },
      ];

      const result = sortVariableValues(numericOptions, VariableSort.numericalDesc);
      expect(result).toEqual([
        { label: 'Item 10', value: '10' },
        { label: 'Item 2', value: '2' },
        { label: 'Item 1', value: '1' },
      ]);
    });

    it('should sort case-insensitively ascending', () => {
      const caseOptions: VariableValueOption[] = [
        { label: 'display3', value: 'val3' },
        { label: 'Display1', value: 'val1' },
        { label: 'display2', value: 'val2' },
      ];

      const result = sortVariableValues(caseOptions, VariableSort.alphabeticalCaseInsensitiveAsc);
      expect(result).toEqual([
        { label: 'Display1', value: 'val1' },
        { label: 'display2', value: 'val2' },
        { label: 'display3', value: 'val3' },
      ]);
    });

    it('should sort case-insensitively descending', () => {
      const caseOptions: VariableValueOption[] = [
        { label: 'Display1', value: 'val1' },
        { label: 'display3', value: 'val3' },
        { label: 'display2', value: 'val2' },
      ];

      const result = sortVariableValues(caseOptions, VariableSort.alphabeticalCaseInsensitiveDesc);
      expect(result).toEqual([
        { label: 'display3', value: 'val3' },
        { label: 'display2', value: 'val2' },
        { label: 'Display1', value: 'val1' },
      ]);
    });

    it('should sort naturally ascending', () => {
      const naturalOptions: VariableValueOption[] = [
        { label: 'Item 10', value: '10' },
        { label: 'Item 2', value: '2' },
        { label: 'Item 1', value: '1' },
      ];

      const result = sortVariableValues(naturalOptions, VariableSort.naturalAsc);
      expect(result).toEqual([
        { label: 'Item 1', value: '1' },
        { label: 'Item 2', value: '2' },
        { label: 'Item 10', value: '10' },
      ]);
    });

    it('should sort naturally descending', () => {
      const naturalOptions: VariableValueOption[] = [
        { label: 'Item 1', value: '1' },
        { label: 'Item 10', value: '10' },
        { label: 'Item 2', value: '2' },
      ];

      const result = sortVariableValues(naturalOptions, VariableSort.naturalDesc);
      expect(result).toEqual([
        { label: 'Item 10', value: '10' },
        { label: 'Item 2', value: '2' },
        { label: 'Item 1', value: '1' },
      ]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames: [],
      });
      expect(result).toEqual([]);
    });

    it('should handle empty strings', () => {
      const metricNames = [
        { text: '', value: '' },
        { text: 'Option', value: 'opt' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: '', value: '' },
        { label: 'Option', value: 'opt' },
      ]);
    });

    it('should handle undefined text and value', () => {
      const metricNames = [{ text: undefined, value: undefined }];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([{ label: '', value: '' }]);
    });

    it('should handle items with only text or only value', () => {
      const metricNames = [{ text: 'Text Only' }, { value: 'Value Only' }, { text: 'Both', value: 'Both' }];

      const result = metricNamesToVariableValues({
        variableRegEx: '',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Text Only', value: 'Text Only' },
        { label: 'Value Only', value: 'Value Only' },
        { label: 'Both', value: 'Both' },
      ]);
    });

    it('should handle regex that matches nothing', () => {
      const metricNames = [
        { text: 'Option 1', value: 'opt1' },
        { text: 'Option 2', value: 'opt2' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '/^nomatch/',
        variableRegexApplyTo: VariableRegexApplyTo.value,
        sort: VariableSort.disabled,
        metricNames,
      });

      expect(result).toEqual([]);
    });

    it('should handle numeric sort with non-numeric labels', () => {
      const nonNumericOptions: VariableValueOption[] = [
        { label: 'No Number', value: 'a' },
        { label: 'Item 5', value: '5' },
        { label: 'Also No Number', value: 'b' },
      ];

      const result = sortVariableValues(nonNumericOptions, VariableSort.numericalAsc);
      // Items without numbers should be sorted to the beginning with -1
      expect(result.length).toBe(3);
    });
  });

  describe('Integration: regex + sorting', () => {
    it('should apply regex filter and then sort', () => {
      const metricNames = [
        { text: 'Display3', value: 'val3' },
        { text: 'Display1', value: 'val1' },
        { text: 'Display2', value: 'val2' },
        { text: 'Display1a', value: 'val1a' },
      ];

      const result = metricNamesToVariableValues({
        variableRegEx: '/^Display1/',
        variableRegexApplyTo: VariableRegexApplyTo.text,
        sort: VariableSort.alphabeticalAsc,
        metricNames,
      });

      expect(result).toEqual([
        { label: 'Display1', value: 'val1' },
        { label: 'Display1a', value: 'val1a' },
      ]);
    });
  });
});

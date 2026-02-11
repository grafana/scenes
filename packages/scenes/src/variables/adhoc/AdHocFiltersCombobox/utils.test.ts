import { generatePlaceholder, INPUT_PLACEHOLDER_DEFAULT } from './utils';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';

describe.only('generatePlaceholder', () => {
  const defaultFilter: AdHocFilterWithLabels = {
    key: 'testKey',
    operator: '=',
    value: 'testValue',
    keyLabel: 'Test Key',
    valueLabels: ['Test Value'],
  };

  describe('with custom inputPlaceholder', () => {
    it('should use custom placeholder for key input type', () => {
      const result = generatePlaceholder(defaultFilter, 'key', false, false, 'Custom placeholder');
      expect(result).toBe('Custom placeholder');
    });

    it('should use custom placeholder for operator input type when not in always wip mode', () => {
      const filter: AdHocFilterWithLabels = {
        key: '',
        operator: '',
        value: '',
      };
      const result = generatePlaceholder(filter, 'operator', false, false, 'Custom placeholder');
      expect(result).toBe('Custom placeholder');
    });

    it('should use custom placeholder when filter has no operator and not in always wip mode', () => {
      const filter: AdHocFilterWithLabels = {
        key: 'testKey',
        operator: '',
        value: '',
      };
      const result = generatePlaceholder(filter, 'operator', false, false, 'Custom placeholder');
      expect(result).toBe('Custom placeholder');
    });
  });

  describe('without custom inputPlaceholder', () => {
    it('should use default placeholder for key input type', () => {
      const result = generatePlaceholder(defaultFilter, 'key', false, false);
      expect(result).toBe(INPUT_PLACEHOLDER_DEFAULT);
    });

    it('should use default placeholder for operator input type when filter has no operator', () => {
      const filter: AdHocFilterWithLabels = {
        key: 'testKey',
        operator: '',
        value: '',
      };
      const result = generatePlaceholder(filter, 'operator', false, false);
      expect(result).toBe(INPUT_PLACEHOLDER_DEFAULT);
    });

    it('should display existing operator value for operator input type when not in always wip mode', () => {
      const filter: AdHocFilterWithLabels = {
        key: 'testKey',
        operator: '=',
        value: 'testValue',
      };
      const result = generatePlaceholder(filter, 'operator', false, false);
      expect(result).toBe('=');
    });
  });

  describe('value input type', () => {
    it('should return first value label for value input type', () => {
      const filter: AdHocFilterWithLabels = {
        key: 'testKey',
        operator: '=',
        value: 'testValue',
        valueLabels: ['Display Value'],
      };
      const result = generatePlaceholder(filter, 'value', false, false);
      expect(result).toBe('Display Value');
    });

    it('should return empty string for value input type when no valueLabels', () => {
      const filter: AdHocFilterWithLabels = {
        key: 'testKey',
        operator: '=',
        value: 'testValue',
      };
      const result = generatePlaceholder(filter, 'value', false, false);
      expect(result).toBe('');
    });

    it('should return "Edit values" for multi-value edit mode', () => {
      const result = generatePlaceholder(defaultFilter, 'value', true, false);
      expect(result).toBe('Edit values');
    });
  });

  describe('always wip mode', () => {
    it('should return empty string for operator input type in always wip mode', () => {
      const result = generatePlaceholder(defaultFilter, 'operator', false, true);
      expect(result).toBe('');
    });

    it('should use custom placeholder for key input type even in always wip mode', () => {
      const result = generatePlaceholder(defaultFilter, 'key', false, true, 'WIP placeholder');
      expect(result).toBe('WIP placeholder');
    });

    it('should use default placeholder for key input type in always wip mode when no custom placeholder', () => {
      const result = generatePlaceholder(defaultFilter, 'key', false, true);
      expect(result).toBe(INPUT_PLACEHOLDER_DEFAULT);
    });
  });
});

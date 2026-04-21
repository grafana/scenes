import {
  generatePlaceholder,
  INPUT_PLACEHOLDER_DEFAULT,
  GROUP_BY_PLACEHOLDER_DEFAULT,
  parseFilterExpression,
} from './utils';
import { AdHocFilterWithLabels } from '../AdHocFiltersVariable';

describe('generatePlaceholder', () => {
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

  describe('group by mode', () => {
    const groupByFilter: AdHocFilterWithLabels = {
      key: 'region',
      operator: 'groupBy',
      value: '',
      keyLabel: 'Region',
    };

    describe('always wip (new group-by input)', () => {
      it('should use group-by default placeholder when no custom placeholder', () => {
        const result = generatePlaceholder(groupByFilter, 'key', false, true, undefined, true);
        expect(result).toBe(GROUP_BY_PLACEHOLDER_DEFAULT);
      });

      it('should use custom placeholder over group-by default', () => {
        const result = generatePlaceholder(groupByFilter, 'key', false, true, 'Pick a dimension', true);
        expect(result).toBe('Pick a dimension');
      });
    });

    describe('editing existing group-by pill (not always wip)', () => {
      it('should return keyLabel when available', () => {
        const result = generatePlaceholder(groupByFilter, 'key', false, false, undefined, true);
        expect(result).toBe('Region');
      });

      it('should fall back to key when keyLabel is missing', () => {
        const filter: AdHocFilterWithLabels = { key: 'region', operator: 'groupBy', value: '' };
        const result = generatePlaceholder(filter, 'key', false, false, undefined, true);
        expect(result).toBe('region');
      });

      it('should fall back to custom placeholder when key and keyLabel are empty', () => {
        const filter: AdHocFilterWithLabels = { key: '', operator: 'groupBy', value: '' };
        const result = generatePlaceholder(filter, 'key', false, false, 'Pick a dimension', true);
        expect(result).toBe('Pick a dimension');
      });

      it('should fall back to group-by default when key, keyLabel, and custom placeholder are all empty', () => {
        const filter: AdHocFilterWithLabels = { key: '', operator: 'groupBy', value: '' };
        const result = generatePlaceholder(filter, 'key', false, false, undefined, true);
        expect(result).toBe(GROUP_BY_PLACEHOLDER_DEFAULT);
      });
    });
  });
});

describe('parseFilterExpression', () => {
  const operators = ['=', '!=', '=|', '!=|', '=~', '!~', '<', '<=', '>', '>='];

  it.each<[string, { key: string | undefined; operator: string; value: string }]>([
    ['instance = tempo', { key: 'instance', operator: '=', value: 'tempo' }],
    ['instance!=tempo-distributor', { key: 'instance', operator: '!=', value: 'tempo-distributor' }],
    ['error_rate >= 0.5', { key: 'error_rate', operator: '>=', value: '0.5' }],
    ['method =~ GET|POST', { key: 'method', operator: '=~', value: 'GET|POST' }],
    ['region =| us-east', { key: 'region', operator: '=|', value: 'us-east' }],
    ['region !=| us-east', { key: 'region', operator: '!=|', value: 'us-east' }],
    ['method !~ DELETE', { key: 'method', operator: '!~', value: 'DELETE' }],
    ['latency < 100', { key: 'latency', operator: '<', value: '100' }],
    ['latency <= 100', { key: 'latency', operator: '<=', value: '100' }],
    ['latency > 100', { key: 'latency', operator: '>', value: '100' }],
    ['latency >= 100', { key: 'latency', operator: '>=', value: '100' }],
    ['instance=', { key: 'instance', operator: '=', value: '' }],
    ['instance = ', { key: 'instance', operator: '=', value: '' }],
    ['my.label-name = foo', { key: 'my.label-name', operator: '=', value: 'foo' }],
    ['key!=|val', { key: 'key', operator: '!=|', value: 'val' }],
    ['  instance = tempo  ', { key: 'instance', operator: '=', value: 'tempo' }],
    ['= tempo', { key: undefined, operator: '=', value: 'tempo' }],
    ['!=tempo', { key: undefined, operator: '!=', value: 'tempo' }],
    ['=~ GET|POST', { key: undefined, operator: '=~', value: 'GET|POST' }],
    ['!=| us-east', { key: undefined, operator: '!=|', value: 'us-east' }],
    ['>= 0.5', { key: undefined, operator: '>=', value: '0.5' }],
    ['=', { key: undefined, operator: '=', value: '' }],
    ['!= ', { key: undefined, operator: '!=', value: '' }],
    ['key = value=with=equals', { key: 'key', operator: '=', value: 'value=with=equals' }],
    ['region =| us-east, us-west, eu-north', { key: 'region', operator: '=|', value: 'us-east, us-west, eu-north' }],
    ['region !=| us-east,us-west', { key: 'region', operator: '!=|', value: 'us-east,us-west' }],
  ])('should parse "%s"', (input, expected) => {
    expect(parseFilterExpression(input, operators)).toEqual(expected);
  });

  it.each<string>(['just-a-key', 'plain text', '', '   '])('should return null for "%s"', (input) => {
    expect(parseFilterExpression(input, operators)).toBeNull();
  });
});

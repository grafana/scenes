import { AdHocFiltersVariable, AdHocFilterWithLabels } from './adhoc/AdHocFiltersVariable';
import { DrilldownDependenciesManager } from './DrilldownDependenciesManager';
import { GroupByVariable } from './groupby/GroupByVariable';
import { VariableDependencyConfig } from './VariableDependencyConfig';

function createManager(opts: { adhocVar?: AdHocFiltersVariable; groupByVar?: GroupByVariable }) {
  const mockDependencyConfig = { setVariableNames: jest.fn() } as unknown as VariableDependencyConfig<any>;
  const manager = new DrilldownDependenciesManager(mockDependencyConfig);

  if (opts.adhocVar) {
    manager['_adhocFiltersVar'] = opts.adhocVar;
  }
  if (opts.groupByVar) {
    manager['_groupByVar'] = opts.groupByVar;
  }

  return manager;
}

function createAdhocVar(
  filters: AdHocFilterWithLabels[],
  originFilters?: AdHocFilterWithLabels[],
  applicabilityEnabled?: boolean
) {
  return new AdHocFiltersVariable({
    datasource: { uid: 'my-ds-uid' },
    name: 'filters',
    filters,
    originFilters,
    applicabilityEnabled,
  });
}

function createGroupByVar(value: string[], keysApplicability?: any[], applicabilityEnabled?: boolean) {
  return new GroupByVariable({
    datasource: { uid: 'my-ds-uid' },
    name: 'groupby',
    key: 'testGroupBy',
    value,
    text: value,
    keysApplicability,
    applicabilityEnabled,
  });
}

describe('DrilldownDependenciesManager', () => {
  describe('getFilters', () => {
    it('should return undefined when no adhocFiltersVar', () => {
      const manager = createManager({});
      expect(manager.getFilters()).toBeUndefined();
    });

    it('should return all complete filters when no applicability results', () => {
      const filters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'prod', operator: '=' },
        { key: 'cluster', value: 'us', operator: '=' },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters) });

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('env');
      expect(result[1].key).toBe('cluster');
    });

    it('should exclude incomplete filters', () => {
      const filters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'prod', operator: '=' },
        { key: '', value: '', operator: '' },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters) });

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('env');
    });

    it('should exclude variable-level nonApplicable filters', () => {
      const filters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'prod', operator: '=' },
        { key: 'pod', value: 'abc', operator: '=', nonApplicable: true },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters) });

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('env');
    });
  });

  describe('getGroupByKeys', () => {
    it('should return undefined when no groupByVar', () => {
      const manager = createManager({});
      expect(manager.getGroupByKeys()).toBeUndefined();
    });

    it('should return all applicable keys', () => {
      const manager = createManager({ groupByVar: createGroupByVar(['ns', 'pod']) });
      expect(manager.getGroupByKeys()).toEqual(['ns', 'pod']);
    });
  });
});

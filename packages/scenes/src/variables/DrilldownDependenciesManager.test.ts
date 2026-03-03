import { DataSourceApi, getDefaultTimeRange } from '@grafana/data';

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
  describe('resolveApplicability', () => {
    it('should split response into filter and groupBy portions', async () => {
      const getDrilldownsApplicability = jest.fn().mockResolvedValue([
        { key: 'env', applicable: true },
        { key: 'cluster', applicable: false, reason: 'not found' },
        { key: 'region', applicable: true, origin: 'dashboard' },
        { key: 'namespace', applicable: true },
        { key: 'pod', applicable: false, reason: 'label not found' },
      ]);

      const manager = createManager({
        adhocVar: createAdhocVar(
          [
            { key: 'env', value: 'prod', operator: '=' },
            { key: 'cluster', value: 'us-east', operator: '=' },
          ],
          [{ key: 'region', value: 'eu', operator: '=', origin: 'dashboard' }],
          true
        ),
        groupByVar: createGroupByVar(['namespace', 'pod'], undefined, true),
      });

      const ds = { getDrilldownsApplicability } as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      const results = manager.getApplicabilityResults();
      expect(results?.filters).toEqual([
        { key: 'env', applicable: true },
        { key: 'cluster', applicable: false, reason: 'not found' },
        { key: 'region', applicable: true, origin: 'dashboard' },
      ]);
      expect(results?.groupBy).toEqual([
        { key: 'namespace', applicable: true },
        { key: 'pod', applicable: false, reason: 'label not found' },
      ]);
    });

    it('should clear results when there are no filters or groupBy keys', async () => {
      const getDrilldownsApplicability = jest.fn();

      const manager = createManager({
        adhocVar: createAdhocVar([], undefined, true),
        groupByVar: createGroupByVar([], undefined, true),
      });

      const ds = { getDrilldownsApplicability } as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      expect(manager.getApplicabilityResults()).toBeUndefined();
      expect(getDrilldownsApplicability).not.toHaveBeenCalled();
    });

    it('should clear results when ds call throws', async () => {
      const getDrilldownsApplicability = jest.fn().mockRejectedValue(new Error('fail'));

      const manager = createManager({
        adhocVar: createAdhocVar([{ key: 'env', value: 'prod', operator: '=' }], undefined, true),
      });

      const ds = { getDrilldownsApplicability } as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      expect(manager.getApplicabilityResults()).toBeUndefined();
    });

    it('should skip when applicabilityEnabled is not set on any variable', async () => {
      const getDrilldownsApplicability = jest.fn();

      const manager = createManager({
        adhocVar: createAdhocVar([{ key: 'env', value: 'prod', operator: '=' }]),
        groupByVar: createGroupByVar(['namespace']),
      });

      const ds = { getDrilldownsApplicability } as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      expect(manager.getApplicabilityResults()).toBeUndefined();
      expect(getDrilldownsApplicability).not.toHaveBeenCalled();
    });

    it('should skip when ds does not support getDrilldownsApplicability', async () => {
      const manager = createManager({
        adhocVar: createAdhocVar([{ key: 'env', value: 'prod', operator: '=' }], undefined, true),
      });

      const ds = {} as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      expect(manager.getApplicabilityResults()).toBeUndefined();
    });
  });

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

    it('should exclude per-panel nonApplicable filters using key+origin matching', () => {
      const filters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'prod', operator: '=' },
        { key: 'cluster', value: 'us', operator: '=' },
      ];
      const originFilters: AdHocFilterWithLabels[] = [
        { key: 'region', value: 'eu', operator: '=', origin: 'dashboard' },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters, originFilters) });

      manager['_applicabilityResults'] = {
        filters: [
          { key: 'env', applicable: true },
          { key: 'cluster', applicable: false, reason: 'not found' },
          { key: 'region', applicable: true, origin: 'dashboard' },
        ],
        groupBy: [],
      };

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('env');
      expect(result[1].key).toBe('region');
    });

    it('should keep filters when no matching response entry exists', () => {
      const filters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'prod', operator: '=' },
        { key: 'extra', value: 'val', operator: '=' },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters) });

      manager['_applicabilityResults'] = {
        filters: [{ key: 'env', applicable: true }],
        groupBy: [],
      };

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('env');
      expect(result[1].key).toBe('extra');
    });

    it('should handle duplicate keys by matching positionally within the queue', () => {
      const filters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'prod', operator: '=' },
        { key: 'env', value: 'staging', operator: '=' },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters) });

      manager['_applicabilityResults'] = {
        filters: [
          { key: 'env', applicable: true },
          { key: 'env', applicable: false, reason: 'value not found' },
        ],
        groupBy: [],
      };

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('prod');
    });

    it('should separate user filters from origin filters with same key via origin', () => {
      const filters: AdHocFilterWithLabels[] = [{ key: 'env', value: 'prod', operator: '=' }];
      const originFilters: AdHocFilterWithLabels[] = [
        { key: 'env', value: 'staging', operator: '=', origin: 'dashboard' },
      ];

      const manager = createManager({ adhocVar: createAdhocVar(filters, originFilters) });

      manager['_applicabilityResults'] = {
        filters: [
          { key: 'env', applicable: false, reason: 'user filter overridden' },
          { key: 'env', applicable: true, origin: 'dashboard' },
        ],
        groupBy: [],
      };

      const result = manager.getFilters() ?? [];
      expect(result).toHaveLength(1);
      expect(result[0].origin).toBe('dashboard');
    });
  });

  describe('getGroupByKeys', () => {
    it('should return undefined when no groupByVar', () => {
      const manager = createManager({});
      expect(manager.getGroupByKeys()).toBeUndefined();
    });

    it('should return all keys when no applicability results', () => {
      const manager = createManager({ groupByVar: createGroupByVar(['ns', 'pod']) });
      expect(manager.getGroupByKeys()).toEqual(['ns', 'pod']);
    });

    it('should exclude per-panel nonApplicable groupBy keys', () => {
      const manager = createManager({ groupByVar: createGroupByVar(['ns', 'pod', 'container']) });

      manager['_applicabilityResults'] = {
        filters: [],
        groupBy: [
          { key: 'ns', applicable: true },
          { key: 'pod', applicable: false, reason: 'label not found' },
          { key: 'container', applicable: true },
        ],
      };

      expect(manager.getGroupByKeys()).toEqual(['ns', 'container']);
    });

    it('should keep keys with no matching response entry', () => {
      const manager = createManager({ groupByVar: createGroupByVar(['ns', 'pod']) });

      manager['_applicabilityResults'] = {
        filters: [],
        groupBy: [{ key: 'ns', applicable: true }],
      };

      expect(manager.getGroupByKeys()).toEqual(['ns', 'pod']);
    });

    it('should respect variable-level keysApplicability then per-panel results', () => {
      const manager = createManager({
        groupByVar: createGroupByVar(
          ['ns', 'pod', 'container'],
          [
            { key: 'ns', applicable: true },
            { key: 'pod', applicable: false },
            { key: 'container', applicable: true },
          ]
        ),
      });

      manager['_applicabilityResults'] = {
        filters: [],
        groupBy: [
          { key: 'ns', applicable: false, reason: 'per-panel not found' },
          { key: 'container', applicable: true },
        ],
      };

      // 'pod' excluded by variable-level keysApplicability
      // 'ns' further excluded by per-panel result
      expect(manager.getGroupByKeys()).toEqual(['container']);
    });

    it('should not cross-contaminate filter and groupBy results for same key', () => {
      const manager = createManager({
        adhocVar: createAdhocVar([{ key: 'env', value: 'prod', operator: '=' }]),
        groupByVar: createGroupByVar(['env']),
      });

      manager['_applicabilityResults'] = {
        filters: [{ key: 'env', applicable: true }],
        groupBy: [{ key: 'env', applicable: false, reason: 'groupBy env not found' }],
      };

      const filters = manager.getFilters() ?? [];
      expect(filters).toHaveLength(1);
      expect(filters[0].key).toBe('env');
      expect(manager.getGroupByKeys()).toEqual([]);
    });
  });

  describe('combined filters and groupBy', () => {
    it('should resolve and return both filters and groupBy keys through the full flow', async () => {
      const getDrilldownsApplicability = jest.fn().mockResolvedValue([
        { key: 'env', applicable: true },
        { key: 'cluster', applicable: false, reason: 'label not found' },
        { key: 'region', applicable: true, origin: 'dashboard' },
        { key: 'namespace', applicable: true },
        { key: 'pod', applicable: false, reason: 'label not found' },
      ]);

      const manager = createManager({
        adhocVar: createAdhocVar(
          [
            { key: 'env', value: 'prod', operator: '=' },
            { key: 'cluster', value: 'us', operator: '=' },
          ],
          [{ key: 'region', value: 'eu', operator: '=', origin: 'dashboard' }],
          true
        ),
        groupByVar: createGroupByVar(['namespace', 'pod'], undefined, true),
      });

      const ds = { getDrilldownsApplicability } as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      const filters = manager.getFilters() ?? [];
      expect(filters).toHaveLength(2);
      expect(filters[0].key).toBe('env');
      expect(filters[1].key).toBe('region');

      expect(manager.getGroupByKeys()).toEqual(['namespace']);
    });

    it('should handle filters-only response when both variables exist', async () => {
      const getDrilldownsApplicability = jest.fn().mockResolvedValue([
        { key: 'env', applicable: true },
        { key: 'cluster', applicable: false, reason: 'overridden' },
      ]);

      const manager = createManager({
        adhocVar: createAdhocVar(
          [
            { key: 'env', value: 'prod', operator: '=' },
            { key: 'cluster', value: 'us', operator: '=' },
          ],
          undefined,
          true
        ),
        groupByVar: createGroupByVar([], undefined, true),
      });

      const ds = { getDrilldownsApplicability } as unknown as DataSourceApi;
      await manager.resolveApplicability(ds, [], getDefaultTimeRange(), undefined);

      const filters = manager.getFilters() ?? [];
      expect(filters).toHaveLength(1);
      expect(filters[0].key).toBe('env');

      expect(manager.getGroupByKeys()).toEqual([]);
    });
  });
});

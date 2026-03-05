import {
  DataSourceApi,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  Scope,
  TimeRange,
} from '@grafana/data';
import {
  findClosestAdHocFilterInHierarchy,
  findGlobalAdHocFilterVariableByUid,
} from '../variables/adhoc/patchGetAdhocFilters';
import {
  findClosestGroupByInHierarchy,
  findGlobalGroupByVariableByUid,
} from '../variables/groupby/findActiveGroupByVariablesByUid';
import { GroupByVariable } from '../variables/groupby/GroupByVariable';
import {
  AdHocFilterWithLabels,
  AdHocFiltersVariable,
  isFilterApplicable,
  isFilterComplete,
} from '../variables/adhoc/AdHocFiltersVariable';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneDataQuery, SceneObject, SceneObjectState } from '../core/types';
import { buildApplicabilityMatcher } from '../variables/applicabilityUtils';

export interface ApplicabilityResults {
  filters: DrilldownsApplicability[];
  groupBy: DrilldownsApplicability[];
}

/**
 * Manages ad-hoc filters and group-by variables for data providers
 */
export class DrilldownDependenciesManager<TState extends SceneObjectState> {
  private _adhocFiltersVar?: AdHocFiltersVariable;
  private _groupByVar?: GroupByVariable;
  private _variableDependency: VariableDependencyConfig<TState>;
  private _applicabilityResults?: ApplicabilityResults;
  private _lastApplicabilityCacheKey?: string;

  public constructor(variableDependency: VariableDependencyConfig<TState>) {
    this._variableDependency = variableDependency;
  }

  /**
   * Find drilldown variables matching the given datasource UID.
   * When sceneObject is provided, walks up the hierarchy to find the closest match.
   * Otherwise falls back to searching the global active variable sets.
   */
  public findAndSubscribeToDrilldowns(interpolatedUid: string | undefined, sceneObject?: SceneObject) {
    const filtersVar = sceneObject
      ? findClosestAdHocFilterInHierarchy(interpolatedUid, sceneObject)
      : findGlobalAdHocFilterVariableByUid(interpolatedUid);
    const groupByVar = sceneObject
      ? findClosestGroupByInHierarchy(interpolatedUid, sceneObject)
      : findGlobalGroupByVariableByUid(interpolatedUid);

    let hasChanges = false;

    if (this._adhocFiltersVar !== filtersVar) {
      this._adhocFiltersVar = filtersVar;
      hasChanges = true;
    }

    if (this._groupByVar !== groupByVar) {
      this._groupByVar = groupByVar;
      hasChanges = true;
    }

    if (hasChanges) {
      this._updateExplicitDrilldownVariableDependencies();
    }
  }

  private _updateExplicitDrilldownVariableDependencies(): void {
    const explicitDependencies: string[] = [];

    if (this._adhocFiltersVar) {
      explicitDependencies.push(this._adhocFiltersVar.state.name);
    }

    if (this._groupByVar) {
      explicitDependencies.push(this._groupByVar.state.name);
    }

    this._variableDependency.setVariableNames(explicitDependencies);
  }

  public get adHocFiltersVar(): AdHocFiltersVariable | undefined {
    return this._adhocFiltersVar;
  }

  public get groupByVar(): GroupByVariable | undefined {
    return this._groupByVar;
  }

  /**
   * Resolves per-panel drilldown applicability before the data query runs.
   * All gating logic lives here so SceneQueryRunner stays thin.
   */
  public async resolveApplicability(
    ds: DataSourceApi,
    queries: SceneDataQuery[],
    timeRange: TimeRange,
    scopes: Scope[] | undefined
  ): Promise<void> {
    if (!this._adhocFiltersVar && !this._groupByVar) {
      return;
    }

    const filtersApplicabilityEnabled = this._adhocFiltersVar?.state.applicabilityEnabled;
    const groupByApplicabilityEnabled = this._groupByVar?.state.applicabilityEnabled;

    if (!filtersApplicabilityEnabled && !groupByApplicabilityEnabled) {
      return;
    }

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds.getDrilldownsApplicability) {
      return;
    }

    const filters = this._adhocFiltersVar
      ? [...(this._adhocFiltersVar.state.originFilters ?? []), ...this._adhocFiltersVar.state.filters]
      : [];
    const groupByKeys = this._groupByVar
      ? Array.isArray(this._groupByVar.state.value)
        ? this._groupByVar.state.value.map((v) => String(v))
        : this._groupByVar.state.value
        ? [String(this._groupByVar.state.value)]
        : []
      : [];

    if (filters.length === 0 && groupByKeys.length === 0) {
      this._clearPerPanelApplicability();
      this._lastApplicabilityCacheKey = undefined;
      return;
    }

    const cacheKey = this._buildApplicabilityCacheKey(filters, groupByKeys, queries, scopes);
    if (cacheKey === this._lastApplicabilityCacheKey && this._applicabilityResults) {
      return;
    }

    try {
      // @ts-expect-error (temporary till we update grafana/data)
      const results: DrilldownsApplicability[] = await ds.getDrilldownsApplicability({
        filters,
        groupByKeys,
        queries,
        timeRange,
        scopes,
      });
      this._setPerPanelApplicability({
        filters: results.slice(0, filters.length),
        groupBy: results.slice(filters.length),
      });
      this._lastApplicabilityCacheKey = cacheKey;
    } catch {
      this._clearPerPanelApplicability();
      this._lastApplicabilityCacheKey = undefined;
    }
  }

  /**
   * Returns the applicability results from the last resolveApplicability() call,
   * split into filter and groupBy portions.
   * Used by UI components to display which filters are non-applicable for this panel.
   */
  public getApplicabilityResults(): ApplicabilityResults | undefined {
    return this._applicabilityResults;
  }

  private _clearPerPanelApplicability(): void {
    this._applicabilityResults = undefined;
  }

  private _setPerPanelApplicability(results: ApplicabilityResults): void {
    this._applicabilityResults = results;
  }

  public getFilters(): AdHocFilterWithLabels[] | undefined {
    if (!this._adhocFiltersVar) {
      return undefined;
    }

    const stateFilters = this._adhocFiltersVar.state.filters;
    const originFilters = this._adhocFiltersVar.state.originFilters ?? [];

    const applicable = [...originFilters, ...stateFilters].filter((f) => isFilterComplete(f) && isFilterApplicable(f));

    if (!this._applicabilityResults) {
      return applicable;
    }

    const matchResult = buildApplicabilityMatcher(this._applicabilityResults.filters);

    return applicable.filter((f) => {
      const result = matchResult(f.key, f.origin);
      return !result || result.applicable;
    });
  }

  public getGroupByKeys(): string[] | undefined {
    if (!this._groupByVar) {
      return undefined;
    }

    const keys = this._groupByVar.getApplicableKeys();

    if (!this._applicabilityResults) {
      return keys;
    }

    const matchResult = buildApplicabilityMatcher(this._applicabilityResults.groupBy);

    return keys.filter((k) => {
      const result = matchResult(k);
      return !result || result.applicable;
    });
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
    this._groupByVar = undefined;
    this._lastApplicabilityCacheKey = undefined;
  }

  private _buildApplicabilityCacheKey(
    filters: AdHocFilterWithLabels[],
    groupByKeys: string[],
    queries: SceneDataQuery[],
    scopes: Scope[] | undefined
  ): string {
    return JSON.stringify({
      filters: filters.map((f) => ({ origin: f.origin, key: f.key, operator: f.operator, value: f.value })),
      groupByKeys,
      queries: queries.map((q) => ({ refId: q.refId, expr: q.expr ?? q.expression ?? q.query })),
      scopes: scopes?.map((s) => s.metadata.name),
    });
  }
}

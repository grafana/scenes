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
  drilldownApplicabilityKey,
  isFilterApplicable,
  isFilterComplete,
} from '../variables/adhoc/AdHocFiltersVariable';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneDataQuery, SceneObject, SceneObjectState } from '../core/types';

/**
 * Manages ad-hoc filters and group-by variables for data providers
 */
export class DrilldownDependenciesManager<TState extends SceneObjectState> {
  private _adhocFiltersVar?: AdHocFiltersVariable;
  private _groupByVar?: GroupByVariable;
  private _variableDependency: VariableDependencyConfig<TState>;
  private _applicabilityResults?: DrilldownsApplicability[];
  private _perPanelApplicability?: Map<string, DrilldownsApplicability>;

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

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds.getDrilldownsApplicability) {
      return;
    }

    const filters = this._adhocFiltersVar
      ? [...this._adhocFiltersVar.state.filters, ...(this._adhocFiltersVar.state.originFilters ?? [])]
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
      return;
    }

    try {
      // @ts-expect-error (temporary till we update grafana/data)
      const results = await ds.getDrilldownsApplicability({
        filters,
        groupByKeys,
        queries,
        timeRange,
        scopes,
      });
      this._setPerPanelApplicability(results);
    } catch {
      this._clearPerPanelApplicability();
    }
  }

  /**
   * Returns the raw applicability results from the last resolveApplicability() call.
   * Used by UI components to display which filters are non-applicable for this panel.
   */
  public getApplicabilityResults(): DrilldownsApplicability[] | undefined {
    return this._applicabilityResults;
  }

  private _clearPerPanelApplicability(): void {
    this._applicabilityResults = undefined;
    this._perPanelApplicability = undefined;
  }

  private _setPerPanelApplicability(results: DrilldownsApplicability[]): void {
    this._applicabilityResults = results;
    const map = new Map<string, DrilldownsApplicability>();
    results.forEach((r: DrilldownsApplicability) => {
      map.set(drilldownApplicabilityKey(r), r);
    });
    this._perPanelApplicability = map;
  }

  public getFilters(): AdHocFilterWithLabels[] | undefined {
    if (!this._adhocFiltersVar) {
      return undefined;
    }

    const stateFilters = this._adhocFiltersVar.state.filters;
    const originFilters = this._adhocFiltersVar.state.originFilters ?? [];

    // Reconstruct sent indices: resolveApplicability sends [...stateFilters, ...originFilters]
    const allWithIndex: Array<{ filter: AdHocFilterWithLabels; sentIndex: number }> = [
      ...originFilters.map((f, i) => ({ filter: f, sentIndex: stateFilters.length + i })),
      ...stateFilters.map((f, i) => ({ filter: f, sentIndex: i })),
    ].filter(({ filter: f }) => isFilterComplete(f) && isFilterApplicable(f));

    if (!this._perPanelApplicability) {
      return allWithIndex.map(({ filter }) => filter);
    }

    return allWithIndex
      .filter(({ filter: f, sentIndex }) => {
        const entry = this._perPanelApplicability!.get(
          drilldownApplicabilityKey({ key: f.key, origin: f.origin, index: sentIndex })
        );
        return !entry || entry.applicable;
      })
      .map(({ filter }) => filter);
  }

  public getGroupByKeys(): string[] | undefined {
    if (!this._groupByVar) {
      return undefined;
    }

    const keys = this._groupByVar.getApplicableKeys();

    if (!this._perPanelApplicability) {
      return keys;
    }

    // Rebuild the full sent groupByKeys to find each key's sent position
    const val = this._groupByVar.state.value;
    const allGroupByKeys = Array.isArray(val) ? val.map(String) : val ? [String(val)] : [];
    const filtersCount = this._adhocFiltersVar
      ? this._adhocFiltersVar.state.filters.length + (this._adhocFiltersVar.state.originFilters?.length ?? 0)
      : 0;

    return keys.filter((k) => {
      const sentIdx = allGroupByKeys.indexOf(k);
      if (sentIdx === -1) {
        return true;
      }
      const entry = this._perPanelApplicability!.get(
        drilldownApplicabilityKey({ key: k, index: filtersCount + sentIdx })
      );
      return !entry || entry.applicable;
    });
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
    this._groupByVar = undefined;
  }
}

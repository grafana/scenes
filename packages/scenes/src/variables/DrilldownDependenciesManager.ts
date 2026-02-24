import {
  DataSourceApi,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  Scope,
  TimeRange,
} from '@grafana/data';
import { findActiveAdHocFilterVariableByUid } from '../variables/adhoc/patchGetAdhocFilters';
import { findActiveGroupByVariablesByUid } from '../variables/groupby/findActiveGroupByVariablesByUid';
import { GroupByVariable } from '../variables/groupby/GroupByVariable';
import {
  AdHocFilterWithLabels,
  AdHocFiltersVariable,
  isFilterApplicable,
  isFilterComplete,
} from '../variables/adhoc/AdHocFiltersVariable';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneDataQuery, SceneObjectState } from '../core/types';

/**
 * Manages ad-hoc filters and group-by variables for data providers
 */
export class DrilldownDependenciesManager<TState extends SceneObjectState> {
  private _adhocFiltersVar?: AdHocFiltersVariable;
  private _groupByVar?: GroupByVariable;
  private _variableDependency: VariableDependencyConfig<TState>;
  private _perPanelApplicability?: Map<string, DrilldownsApplicability>;
  private _applicabilityResults?: DrilldownsApplicability[];

  public constructor(variableDependency: VariableDependencyConfig<TState>) {
    this._variableDependency = variableDependency;
  }

  /**
   * Walk up scene graph and find the closest filterset with matching data source
   */
  public findAndSubscribeToDrilldowns(interpolatedUid: string | undefined) {
    const filtersVar = findActiveAdHocFilterVariableByUid(interpolatedUid);
    const groupByVar = findActiveGroupByVariablesByUid(interpolatedUid);

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

    const adhocEnabled = this._adhocFiltersVar?.state.applicabilityEnabled;
    const groupByEnabled = this._groupByVar?.state.applicabilityEnabled;
    if (!adhocEnabled && !groupByEnabled) {
      return;
    }

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds.getDrilldownsApplicability) {
      return;
    }

    const filters = adhocEnabled
      ? [...this._adhocFiltersVar!.state.filters, ...(this._adhocFiltersVar!.state.originFilters ?? [])]
      : [];
    const groupByKeys = groupByEnabled
      ? Array.isArray(this._groupByVar!.state.value)
        ? this._groupByVar!.state.value.map((v) => String(v))
        : this._groupByVar!.state.value
        ? [String(this._groupByVar!.state.value)]
        : []
      : [];

    if (filters.length === 0 && groupByKeys.length === 0) {
      this._perPanelApplicability = undefined;
      this._applicabilityResults = undefined;
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
      this._perPanelApplicability = undefined;
      this._applicabilityResults = undefined;
    }
  }

  /**
   * Returns the raw applicability results from the last resolveApplicability() call.
   * Used by UI components to display which filters are non-applicable for this panel.
   */
  public getApplicabilityResults(): DrilldownsApplicability[] | undefined {
    return this._applicabilityResults;
  }

  private _setPerPanelApplicability(results: DrilldownsApplicability[]): void {
    this._applicabilityResults = results;
    const map = new Map<string, DrilldownsApplicability>();
    results.forEach((r: DrilldownsApplicability) => {
      map.set(r.origin ? `${r.key}-${r.origin}` : r.key, r);
    });
    this._perPanelApplicability = map;
  }

  public getFilters(): AdHocFilterWithLabels[] | undefined {
    if (!this._adhocFiltersVar) {
      return undefined;
    }

    const allFilters = [
      ...(this._adhocFiltersVar.state.originFilters ?? []),
      ...this._adhocFiltersVar.state.filters,
    ].filter((f) => isFilterComplete(f) && isFilterApplicable(f));

    if (!this._perPanelApplicability) {
      return allFilters;
    }

    return allFilters.filter((f) => {
      const key = f.origin ? `${f.key}-${f.origin}` : f.key;
      const entry = this._perPanelApplicability!.get(key);
      return !entry || entry.applicable;
    });
  }

  public getGroupByKeys(): string[] | undefined {
    if (!this._groupByVar) {
      return undefined;
    }

    const keys = this._groupByVar.getApplicableKeys();

    if (!this._perPanelApplicability) {
      return keys;
    }

    return keys.filter((k) => {
      const entry = this._perPanelApplicability!.get(k);
      return !entry || entry.applicable;
    });
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
    this._groupByVar = undefined;
    this._perPanelApplicability = undefined;
    this._applicabilityResults = undefined;
  }
}

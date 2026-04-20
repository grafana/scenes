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
  isGroupByFilter,
} from '../variables/adhoc/AdHocFiltersVariable';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneObject, SceneObjectState } from '../core/types';

/**
 * Manages ad-hoc filters and group-by variables for data providers.
 *
 * When the AdHocFiltersVariable has enableGroupBy=true, groupBy keys are sourced
 * from the adhoc filters array (operator === 'groupBy').
 * Otherwise falls back to the legacy GroupByVariable for backwards compatibility.
 */
export class DrilldownDependenciesManager<TState extends SceneObjectState> {
  private _adhocFiltersVar?: AdHocFiltersVariable;
  private _groupByVar?: GroupByVariable;
  private _variableDependency: VariableDependencyConfig<TState>;

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

    // Only look for a legacy GroupByVariable when the adhoc var doesn't handle groupBy natively
    const useAdhocGroupBy = filtersVar?.state.enableGroupBy === true;
    const groupByVar = useAdhocGroupBy
      ? undefined
      : sceneObject
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

  private _getAllFilters(): AdHocFilterWithLabels[] {
    if (!this._adhocFiltersVar) {
      return [];
    }
    return [...(this._adhocFiltersVar.state.originFilters ?? []), ...this._adhocFiltersVar.state.filters];
  }

  /**
   * Returns only "real" ad-hoc filters, excluding groupBy entries embedded in the filters array.
   */
  public getFilters(): AdHocFilterWithLabels[] | undefined {
    return this._adhocFiltersVar
      ? this._getAllFilters().filter((f) => isFilterComplete(f) && isFilterApplicable(f) && !isGroupByFilter(f))
      : undefined;
  }

  /**
   * Returns group-by keys. When the adhoc variable has enableGroupBy=true, extracts
   * them from the filters array (operator === 'groupBy'). Otherwise falls back to
   * the legacy GroupByVariable.
   */
  public getGroupByKeys(): string[] | undefined {
    if (this._adhocFiltersVar?.state.enableGroupBy) {
      const groupByKeys = this._getAllFilters()
        .filter((f) => isGroupByFilter(f) && isFilterComplete(f) && isFilterApplicable(f))
        .map((f) => f.key);

      return groupByKeys.length > 0 ? groupByKeys : undefined;
    }

    return this._groupByVar ? this._groupByVar.getApplicableKeys() : undefined;
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
    this._groupByVar = undefined;
  }
}

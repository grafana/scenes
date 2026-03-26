import {
  findClosestAdHocFilterInHierarchy,
  findGlobalAdHocFilterVariableByUid,
} from '../variables/adhoc/patchGetAdhocFilters';
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
 * Manages ad-hoc filters and group-by dimensions for data providers.
 *
 * Both regular filters and groupBy keys are sourced from AdHocFiltersVariable.
 * GroupBy entries are distinguished by operator === 'groupBy'.
 */
export class DrilldownDependenciesManager<TState extends SceneObjectState> {
  private _adhocFiltersVar?: AdHocFiltersVariable;
  private _variableDependency: VariableDependencyConfig<TState>;

  public constructor(variableDependency: VariableDependencyConfig<TState>) {
    this._variableDependency = variableDependency;
  }

  /**
   * Find the AdHocFiltersVariable matching the given datasource UID.
   * When sceneObject is provided, walks up the hierarchy to find the closest match.
   * Otherwise falls back to searching the global active variable sets.
   */
  public findAndSubscribeToDrilldowns(interpolatedUid: string | undefined, sceneObject?: SceneObject) {
    const filtersVar = sceneObject
      ? findClosestAdHocFilterInHierarchy(interpolatedUid, sceneObject)
      : findGlobalAdHocFilterVariableByUid(interpolatedUid);

    if (this._adhocFiltersVar !== filtersVar) {
      this._adhocFiltersVar = filtersVar;
      this._updateExplicitDrilldownVariableDependencies();
    }
  }

  private _updateExplicitDrilldownVariableDependencies(): void {
    const explicitDependencies: string[] = [];

    if (this._adhocFiltersVar) {
      explicitDependencies.push(this._adhocFiltersVar.state.name);
    }

    this._variableDependency.setVariableNames(explicitDependencies);
  }

  public get adHocFiltersVar(): AdHocFiltersVariable | undefined {
    return this._adhocFiltersVar;
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
   * Returns group-by keys extracted from the AdHocFiltersVariable (operator === 'groupBy').
   * Returns undefined when enableGroupBy is false or no groupBy entries are present.
   */
  public getGroupByKeys(): string[] | undefined {
    if (!this._adhocFiltersVar || !this._adhocFiltersVar.state.enableGroupBy) {
      return undefined;
    }

    const groupByKeys = this._getAllFilters()
      .filter((f) => isGroupByFilter(f) && isFilterComplete(f) && isFilterApplicable(f))
      .map((f) => f.key);

    return groupByKeys.length > 0 ? groupByKeys : undefined;
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
  }
}

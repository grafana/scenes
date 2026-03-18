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
import { SceneObject, SceneObjectState } from '../core/types';

/**
 * Manages ad-hoc filters and group-by variables for data providers
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

  public getFilters(): AdHocFilterWithLabels[] | undefined {
    return this._adhocFiltersVar
      ? [...(this._adhocFiltersVar.state.originFilters ?? []), ...this._adhocFiltersVar.state.filters].filter(
          (f) => isFilterComplete(f) && isFilterApplicable(f)
        )
      : undefined;
  }

  public getGroupByKeys(): string[] | undefined {
    return this._groupByVar ? this._groupByVar.getApplicableKeys() : undefined;
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
    this._groupByVar = undefined;
  }
}

import {
  findAllAdHocFiltersInHierarchy,
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
import { getAdHocFiltersFromScopes } from '../variables/adhoc/getAdHocFiltersFromScopes';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { SceneObject, SceneObjectState } from '../core/types';
import { getScopes } from '../core/sceneGraph/sceneGraph';
import { SCOPES_VARIABLE_NAME } from '../variables/constants';

/**
 * Manages ad-hoc filters and group-by variables for data providers.
 *
 * When the AdHocFiltersVariable has enableGroupBy=true, groupBy keys are sourced
 * from the adhoc filters array (operator === 'groupBy').
 * Otherwise falls back to the legacy GroupByVariable for backwards compatibility.
 *
 * Ad-hoc filters from ancestor variable sets (e.g. dashboard-level) are merged with
 * section-level filters at query time, and scope filters are injected so section
 * filters do not shadow scopes.
 */
export class DrilldownDependenciesManager<TState extends SceneObjectState> {
  /** Closest (section/local) AdHocFiltersVariable — kept for groupBy and callers */
  private _adhocFiltersVar?: AdHocFiltersVariable;
  /** All matching AdHocFiltersVariables from root → leaf for query-time merge */
  private _adhocFiltersVars: AdHocFiltersVariable[] = [];
  private _groupByVar?: GroupByVariable;
  private _sceneObject?: SceneObject;
  private _variableDependency: VariableDependencyConfig<TState>;

  public constructor(variableDependency: VariableDependencyConfig<TState>) {
    this._variableDependency = variableDependency;
  }

  /**
   * Find drilldown variables matching the given datasource UID.
   * When sceneObject is provided, walks up the hierarchy and collects all matches
   * so parent filters/scopes can be merged at query time.
   * Otherwise falls back to searching the global active variable sets.
   */
  public findAndSubscribeToDrilldowns(interpolatedUid: string | undefined, sceneObject?: SceneObject) {
    this._sceneObject = sceneObject;

    const filtersVars = sceneObject
      ? findAllAdHocFiltersInHierarchy(interpolatedUid, sceneObject)
      : (() => {
          const globalVar = findGlobalAdHocFilterVariableByUid(interpolatedUid);
          return globalVar ? [globalVar] : [];
        })();

    // Closest is last in root → leaf order
    const filtersVar = filtersVars.length > 0 ? filtersVars[filtersVars.length - 1] : undefined;

    // Only look for a legacy GroupByVariable when the closest adhoc var doesn't handle groupBy natively
    const useAdhocGroupBy = filtersVar?.state.enableGroupBy === true;
    const groupByVar = useAdhocGroupBy
      ? undefined
      : sceneObject
      ? findClosestGroupByInHierarchy(interpolatedUid, sceneObject)
      : findGlobalGroupByVariableByUid(interpolatedUid);

    let hasChanges = false;

    if (!areSameAdHocVars(this._adhocFiltersVars, filtersVars)) {
      this._adhocFiltersVars = filtersVars;
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

    for (const filtersVar of this._adhocFiltersVars) {
      explicitDependencies.push(filtersVar.state.name);
    }

    // Scope filters are merged into request.filters at query time; re-run when scopes change
    if (this._adhocFiltersVars.length > 0) {
      explicitDependencies.push(SCOPES_VARIABLE_NAME);
    }

    if (this._groupByVar) {
      explicitDependencies.push(this._groupByVar.state.name);
    }

    this._variableDependency.setVariableNames(explicitDependencies);
  }

  public get adHocFiltersVar(): AdHocFiltersVariable | undefined {
    return this._adhocFiltersVar;
  }

  public get adHocFiltersVars(): readonly AdHocFiltersVariable[] {
    return this._adhocFiltersVars;
  }

  public get groupByVar(): GroupByVariable | undefined {
    return this._groupByVar;
  }

  public isSubscribedAdHocFiltersVar(variable: AdHocFiltersVariable): boolean {
    return this._adhocFiltersVars.includes(variable);
  }

  private _getMergedFilters(): AdHocFilterWithLabels[] {
    if (this._adhocFiltersVars.length === 0) {
      return [];
    }

    const fromVars: AdHocFilterWithLabels[] = [];
    const seen = new Set<string>();
    const scopeKeysFromVars = new Set<string>();

    // Ancestor then section AdHoc originFilters + filters (root → leaf)
    for (const filtersVar of this._adhocFiltersVars) {
      for (const filter of [...(filtersVar.state.originFilters ?? []), ...filtersVar.state.filters]) {
        const key = filterIdentityKey(filter);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        if (filter.origin === 'scope') {
          scopeKeysFromVars.add(filter.key);
        }
        fromVars.push(filter);
      }
    }

    // Scope filters from the scene that are not already present on any AdHoc var
    // (covers section-only AdHoc before originFilters are populated)
    const fromScopes: AdHocFilterWithLabels[] = [];
    if (this._sceneObject) {
      const scopes = getScopes(this._sceneObject);
      if (scopes?.length) {
        for (const filter of getAdHocFiltersFromScopes(scopes)) {
          if (scopeKeysFromVars.has(filter.key)) {
            continue;
          }
          const key = filterIdentityKey(filter);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          fromScopes.push(filter);
        }
      }
    }

    return [...fromScopes, ...fromVars];
  }

  /**
   * Returns only "real" ad-hoc filters, excluding groupBy entries embedded in the filters array.
   * Merges scope + ancestor + section filters when multiple AdHoc vars exist in the hierarchy.
   */
  public getFilters(): AdHocFilterWithLabels[] | undefined {
    if (this._adhocFiltersVars.length === 0) {
      return undefined;
    }

    return this._getMergedFilters().filter((f) => isFilterComplete(f) && isFilterApplicable(f) && !isGroupByFilter(f));
  }

  /**
   * Returns group-by keys. When the closest adhoc variable has enableGroupBy=true, extracts
   * them from that variable's filters array (operator === 'groupBy'). Otherwise falls back to
   * the legacy GroupByVariable.
   */
  public getGroupByKeys(): string[] | undefined {
    if (this._adhocFiltersVar?.state.enableGroupBy) {
      const groupByKeys = [...(this._adhocFiltersVar.state.originFilters ?? []), ...this._adhocFiltersVar.state.filters]
        .filter((f) => isGroupByFilter(f) && isFilterComplete(f) && isFilterApplicable(f))
        .map((f) => f.key);

      return groupByKeys.length > 0 ? groupByKeys : undefined;
    }

    return this._groupByVar ? this._groupByVar.getApplicableKeys() : undefined;
  }

  public cleanup(): void {
    this._adhocFiltersVar = undefined;
    this._adhocFiltersVars = [];
    this._groupByVar = undefined;
    this._sceneObject = undefined;
  }
}

function areSameAdHocVars(a: AdHocFiltersVariable[], b: AdHocFiltersVariable[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((v, i) => v === b[i]);
}

function filterIdentityKey(filter: AdHocFilterWithLabels): string {
  const values = filter.values?.join(',') ?? filter.value;
  // Scope filters dedupe by key/operator/value so they are not applied twice when
  // both getScopes() and a variable's originFilters contain the same scope filter.
  return `${filter.origin ?? ''}|${filter.key}|${filter.operator}|${values}`;
}

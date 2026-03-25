import React from 'react';
import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  SelectableValue,
  store,
} from '@grafana/data';
import { sceneGraph } from '../../core/sceneGraph';
import { getEnrichedDataRequest } from '../../querying/getEnrichedDataRequest';
import { getQueriesForVariables } from '../utils';
import { getDataSource } from '../../utils/getDataSource';
import { DrilldownRecommendations, DrilldownPill } from '../components/DrilldownRecommendations';
import { ScopesVariable } from '../variants/ScopesVariable';
import { SCOPES_VARIABLE_NAME } from '../constants';
import { AdHocFilterWithLabels, AdHocFiltersVariable, isGroupByFilter } from './AdHocFiltersVariable';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../../core/types';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { VariableValueSingle } from '../types';
import { Unsubscribable } from 'rxjs';

export const MAX_RECENT_DRILLDOWNS = 3;
export const MAX_STORED_RECENT_DRILLDOWNS = 10;

export const getRecentFiltersKey = (datasourceUid: string | undefined) =>
  `grafana.filters.recent.${datasourceUid ?? 'default'}`;

export const getRecentGroupingKey = (datasourceUid: string | undefined) =>
  `grafana.grouping.recent.${datasourceUid ?? 'default'}`;

export interface AdHocFiltersRecommendationsState extends SceneObjectState {
  recentFilters?: AdHocFilterWithLabels[];
  recommendedFilters?: AdHocFilterWithLabels[];
  recentGrouping?: Array<SelectableValue<VariableValueSingle>>;
  recommendedGrouping?: Array<SelectableValue<VariableValueSingle>>;
  datasourceSupportsRecommendations?: boolean;
}

/**
 * Keeps only the last occurrence of each unique (key, operator, value) triple,
 * preserving the most-recent-wins ordering.
 */
function getFilterIdentity(filter: AdHocFilterWithLabels): string {
  return `${filter.key}|${filter.operator}|${filter.value}`;
}

function deduplicateFilters(filters: AdHocFilterWithLabels[]): AdHocFilterWithLabels[] {
  const filterMap = new Map<string, AdHocFilterWithLabels>();

  for (const filter of filters) {
    const identity = getFilterIdentity(filter);
    if (filterMap.has(identity)) {
      filterMap.delete(identity);
    }
    filterMap.set(identity, filter);
  }

  return Array.from(filterMap.values());
}

function deduplicateGroupings(
  groupings: Array<SelectableValue<VariableValueSingle>>
): Array<SelectableValue<VariableValueSingle>> {
  const seen = new Map<string, SelectableValue<VariableValueSingle>>();

  for (const g of groupings) {
    const key = String(g.value);
    if (seen.has(key)) {
      seen.delete(key);
    }
    seen.set(key, g);
  }

  return Array.from(seen.values());
}

export class AdHocFiltersRecommendations extends SceneObjectBase<AdHocFiltersRecommendationsState> {
  static Component = AdHocFiltersRecommendationsRenderer;

  public constructor(state: Partial<AdHocFiltersRecommendationsState> = {}) {
    super(state);

    this.addActivationHandler(this._activationHandler);
  }

  public get _adHocFilter(): AdHocFiltersVariable {
    if (!(this.parent instanceof AdHocFiltersVariable)) {
      throw new Error('AdHocFiltersRecommendations must be a child of AdHocFiltersVariable');
    }

    return this.parent;
  }

  private get _scopedVars() {
    return { __sceneObject: wrapInSafeSerializableSceneObject(this._adHocFilter) };
  }

  private get _isGroupByEnabled(): boolean {
    return this._adHocFilter.state.enableGroupBy === true;
  }

  private _activationHandler = () => {
    const filterJson = store.get(this._getFiltersStorageKey());
    const storedFilters = filterJson ? JSON.parse(filterJson) : [];

    if (storedFilters.length > 0) {
      this._verifyRecentFiltersApplicability(storedFilters);
    } else {
      this.setState({ recentFilters: [] });
    }

    if (this._isGroupByEnabled) {
      const groupingJson = store.get(this._getGroupingStorageKey());
      const storedGroupings = groupingJson ? JSON.parse(groupingJson) : [];

      if (storedGroupings.length > 0) {
        this._verifyRecentGroupingsApplicability(storedGroupings);
      } else {
        this.setState({ recentGrouping: [] });
      }
    }

    this._fetchRecommendedDrilldowns();

    const scopesVariable = sceneGraph.lookupVariable(SCOPES_VARIABLE_NAME, this._adHocFilter);
    let scopesSubscription: Unsubscribable | undefined;
    let adHocSubscription: Unsubscribable | undefined;

    if (scopesVariable instanceof ScopesVariable) {
      this._subs.add(
        (scopesSubscription = scopesVariable.subscribeToState((newState, prevState) => {
          if (newState.scopes !== prevState.scopes) {
            this._reloadStoredFilters();
            if (this._isGroupByEnabled) {
              this._reloadStoredGroupings();
            }
            this._fetchRecommendedDrilldowns();
          }
        }))
      );
    }

    this._subs.add(
      (adHocSubscription = this._adHocFilter.subscribeToState((newState, prevState) => {
        if (newState.filters !== prevState.filters) {
          this._reloadStoredFilters();
          if (this._isGroupByEnabled) {
            this._reloadStoredGroupings();
          }
          this._fetchRecommendedDrilldowns();
        }
      }))
    );

    return () => {
      scopesSubscription?.unsubscribe();
      adHocSubscription?.unsubscribe();
    };
  };

  private _reloadStoredFilters() {
    const json = store.get(this._getFiltersStorageKey());
    const storedFilters = json ? JSON.parse(json) : [];
    if (storedFilters.length > 0) {
      this._verifyRecentFiltersApplicability(storedFilters);
    }
  }

  private _reloadStoredGroupings() {
    const json = store.get(this._getGroupingStorageKey());
    const storedGroupings = json ? JSON.parse(json) : [];
    if (storedGroupings.length > 0) {
      this._verifyRecentGroupingsApplicability(storedGroupings);
    }
  }

  private _getFiltersStorageKey(): string {
    return getRecentFiltersKey(this._adHocFilter.state.datasource?.uid);
  }

  private _getGroupingStorageKey(): string {
    return getRecentGroupingKey(this._adHocFilter.state.datasource?.uid);
  }

  private async _fetchRecommendedDrilldowns() {
    const adhoc = this._adHocFilter;
    const ds = await getDataSource(adhoc.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getRecommendedDrilldowns) {
      this.setState({ datasourceSupportsRecommendations: false });
      return;
    }

    this.setState({ datasourceSupportsRecommendations: true });

    const queries = adhoc.state.useQueriesAsFilterForOptions ? getQueriesForVariables(adhoc) : undefined;
    const timeRange = sceneGraph.getTimeRange(adhoc).state.value;
    const scopes = sceneGraph.getScopes(adhoc);

    const allFilters = [...(adhoc.state.originFilters ?? []), ...adhoc.state.filters];
    const filters = allFilters.filter((f) => !isGroupByFilter(f));
    const groupByKeys = this._isGroupByEnabled
      ? allFilters.filter((f) => isGroupByFilter(f)).map((f) => f.key)
      : undefined;

    const enrichedRequest = getEnrichedDataRequest(adhoc);
    const dashboardUid = enrichedRequest?.dashboardUID;

    try {
      // @ts-expect-error (temporary till we update grafana/data)
      const recommendedDrilldowns = await ds.getRecommendedDrilldowns({
        timeRange,
        dashboardUid,
        queries: queries ?? [],
        filters,
        ...(groupByKeys ? { groupByKeys } : {}),
        scopes,
      });

      const stateUpdate: Partial<AdHocFiltersRecommendationsState> = {};

      if (recommendedDrilldowns?.filters) {
        stateUpdate.recommendedFilters = recommendedDrilldowns.filters;
      }

      if (this._isGroupByEnabled && recommendedDrilldowns?.groupByKeys) {
        stateUpdate.recommendedGrouping = recommendedDrilldowns.groupByKeys.map((key: string) => ({
          value: key,
          text: key,
        }));
      }

      this.setState(stateUpdate);
    } catch (error) {
      console.error('Failed to fetch recommended drilldowns:', error);
    }
  }

  private async _verifyRecentFiltersApplicability(storedFilters: AdHocFilterWithLabels[]) {
    const adhoc = this._adHocFilter;
    const queries = adhoc.state.useQueriesAsFilterForOptions ? getQueriesForVariables(adhoc) : undefined;
    const response = await adhoc.getFiltersApplicabilityForQueries(storedFilters, queries ?? []);

    if (!response) {
      const deduped = deduplicateFilters(storedFilters);
      this.setState({ recentFilters: deduped.slice(-MAX_RECENT_DRILLDOWNS) });
      return;
    }

    const applicabilityMap = new Map<string, boolean>();
    response.forEach((item: DrilldownsApplicability) => {
      applicabilityMap.set(item.key, item.applicable !== false);
    });

    const applicableFilters = storedFilters.filter((f) => {
      const isApplicable = applicabilityMap.get(f.key);
      return isApplicable === undefined || isApplicable === true;
    });

    const recentFilters = deduplicateFilters(applicableFilters).slice(-MAX_RECENT_DRILLDOWNS);

    this.setState({ recentFilters });
  }

  private async _verifyRecentGroupingsApplicability(storedGroupings: Array<SelectableValue<VariableValueSingle>>) {
    const adhoc = this._adHocFilter;
    const queries = adhoc.state.useQueriesAsFilterForOptions ? getQueriesForVariables(adhoc) : undefined;
    const groupByKeys = storedGroupings.map((g) => String(g.value));

    const response = await adhoc.getFiltersApplicabilityForQueries([], queries ?? [], groupByKeys);

    if (!response) {
      this.setState({ recentGrouping: deduplicateGroupings(storedGroupings).slice(-MAX_RECENT_DRILLDOWNS) });
      return;
    }

    const applicabilityMap = new Map<string, boolean>();
    response.forEach((item: DrilldownsApplicability) => {
      applicabilityMap.set(item.key, item.applicable !== false);
    });

    const applicableGroupings = deduplicateGroupings(storedGroupings)
      .filter((g) => {
        const isApplicable = applicabilityMap.get(String(g.value));
        return isApplicable === undefined || isApplicable === true;
      })
      .slice(-MAX_RECENT_DRILLDOWNS);

    this.setState({ recentGrouping: applicableGroupings });
  }

  /**
   * Stores a recent filter in localStorage and updates state.
   */
  public storeRecentFilter(filter: AdHocFilterWithLabels) {
    const key = this._getFiltersStorageKey();
    const storedFilters = store.get(key);
    const allRecentFilters = storedFilters ? JSON.parse(storedFilters) : [];

    const updatedStoredFilters = deduplicateFilters([...allRecentFilters, filter]).slice(-MAX_STORED_RECENT_DRILLDOWNS);
    store.set(key, JSON.stringify(updatedStoredFilters));

    const adhoc = this._adHocFilter;
    const existingFilter = adhoc.state.filters.find((f) => f.key === filter.key && !Boolean(f.nonApplicable));
    if (existingFilter && !Boolean(existingFilter.nonApplicable)) {
      this.setState({ recentFilters: updatedStoredFilters.slice(-MAX_RECENT_DRILLDOWNS) });
    }
  }

  /**
   * Stores a recent grouping key in localStorage and updates state.
   * No-op when enableGroupBy is false.
   */
  public storeRecentGrouping(groupByKey: string) {
    if (!this._isGroupByEnabled) {
      return;
    }

    const storageKey = this._getGroupingStorageKey();
    const storedGroupings = store.get(storageKey);
    const allRecentGroupings: Array<SelectableValue<VariableValueSingle>> = storedGroupings
      ? JSON.parse(storedGroupings)
      : [];

    const withoutDuplicate = allRecentGroupings.filter((g) => String(g.value) !== groupByKey);
    const updated = [...withoutDuplicate, { value: groupByKey, text: groupByKey }];
    const limited = updated.slice(-MAX_STORED_RECENT_DRILLDOWNS);

    store.set(storageKey, JSON.stringify(limited));

    this.setState({ recentGrouping: limited.slice(-MAX_RECENT_DRILLDOWNS) });
  }

  public addFilterToParent(filter: AdHocFilterWithLabels) {
    this._adHocFilter.updateFilters([...this._adHocFilter.state.filters, filter]);
  }

  public addGroupByToParent(key: string) {
    if (!this._isGroupByEnabled) {
      return;
    }

    const adhoc = this._adHocFilter;
    const exists = adhoc.state.filters.some((f) => isGroupByFilter(f) && f.key === key);
    if (exists) {
      return;
    }

    adhoc._addGroupByFilter({ value: key, label: key });
  }
}

function AdHocFiltersRecommendationsRenderer({ model }: SceneComponentProps<AdHocFiltersRecommendations>) {
  const { recentFilters, recommendedFilters, datasourceSupportsRecommendations } = model.useState();
  const { filters } = model._adHocFilter.useState();

  const recentDrilldowns: DrilldownPill[] | undefined = recentFilters?.map((filter) => ({
    label: `${filter.key} ${filter.operator} ${filter.value}`,
    onClick: () => {
      const exists = filters.some((f) => f.key === filter.key && f.value === filter.value);
      if (!exists) {
        model.addFilterToParent(filter);
      }
    },
  }));

  const recommendedDrilldowns: DrilldownPill[] | undefined = recommendedFilters?.map((filter) => ({
    label: `${filter.key} ${filter.operator} ${filter.value}`,
    onClick: () => {
      const exists = filters.some((f) => f.key === filter.key && f.value === filter.value);
      if (!exists) {
        model.addFilterToParent(filter);
      }
    },
  }));

  return (
    <DrilldownRecommendations
      recentDrilldowns={recentDrilldowns}
      recommendedDrilldowns={recommendedDrilldowns}
      showRecommended={datasourceSupportsRecommendations}
    />
  );
}

export function AdHocGroupByRecommendationsRenderer({ model }: SceneComponentProps<AdHocFiltersRecommendations>) {
  const { recentGrouping, recommendedGrouping, datasourceSupportsRecommendations } = model.useState();

  const recentDrilldowns: DrilldownPill[] | undefined = recentGrouping?.map((groupBy) => ({
    label: `${groupBy.value}`,
    onClick: () => {
      model.addGroupByToParent(String(groupBy.value));
    },
  }));

  const recommendedDrilldowns: DrilldownPill[] | undefined = recommendedGrouping?.map((groupBy) => ({
    label: `${groupBy.value}`,
    onClick: () => {
      model.addGroupByToParent(String(groupBy.value));
    },
  }));

  return (
    <DrilldownRecommendations
      recentDrilldowns={recentDrilldowns}
      recommendedDrilldowns={recommendedDrilldowns}
      showRecommended={datasourceSupportsRecommendations}
    />
  );
}

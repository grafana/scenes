import React from 'react';
import { config } from '@grafana/runtime';
import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  ScopedVar,
  store,
} from '@grafana/data';
import { Unsubscribable } from 'rxjs';
import { sceneGraph } from '../../core/sceneGraph';
import { getEnrichedDataRequest } from '../../querying/getEnrichedDataRequest';
import { getQueriesForVariables } from '../utils';
import { getDataSource } from '../../utils/getDataSource';
import { DrilldownRecommendations, DrilldownPill } from '../components/DrilldownRecommendations';
import { ScopesVariable } from '../variants/ScopesVariable';
import { SCOPES_VARIABLE_NAME } from '../constants';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from './AdHocFiltersVariable';

export const MAX_RECENT_DRILLDOWNS = 3;
export const MAX_STORED_RECENT_DRILLDOWNS = 10;

export const getRecentFiltersKey = (datasourceUid: string | undefined) =>
  `grafana.filters.recent.${datasourceUid ?? 'default'}`;

export class AdHocFiltersRecommendations {
  private _recentFilters?: AdHocFilterWithLabels[];
  private _recommendedFilters?: AdHocFilterWithLabels[];

  private adHocFilter: AdHocFiltersVariable;
  private scopesSubscription: Unsubscribable | undefined;

  private _scopedVars: { __sceneObject: ScopedVar };

  public constructor(adHocFilter: AdHocFiltersVariable, scopedVars: { __sceneObject: ScopedVar }) {
    this.adHocFilter = adHocFilter;
    this._scopedVars = scopedVars;
  }

  public get recentFilters(): AdHocFilterWithLabels[] | undefined {
    return this._recentFilters;
  }

  public get recommendedFilters(): AdHocFilterWithLabels[] | undefined {
    return this._recommendedFilters;
  }

  public init() {
    const json = store.get(this._getStorageKey());
    const storedFilters = json ? JSON.parse(json) : [];

    if (storedFilters.length > 0) {
      this._verifyRecentFiltersApplicability(storedFilters);
    } else {
      this._recentFilters = [];
    }

    this._fetchRecommendedDrilldowns();

    // Set up subscription to scopes variable
    const scopesVariable = sceneGraph.lookupVariable(SCOPES_VARIABLE_NAME, this.adHocFilter);

    if (scopesVariable instanceof ScopesVariable) {
      this.scopesSubscription = scopesVariable.subscribeToState((newState, prevState) => {
        if (newState.scopes !== prevState.scopes) {
          const json = store.get(this._getStorageKey());
          const storedFilters = json ? JSON.parse(json) : [];

          if (storedFilters.length > 0) {
            this._verifyRecentFiltersApplicability(storedFilters);
          }
        }
      });
    }
  }

  public deinit() {
    this.scopesSubscription?.unsubscribe();
  }

  private _getStorageKey(): string {
    return getRecentFiltersKey(this.adHocFilter.state.datasource?.uid);
  }

  private async _fetchRecommendedDrilldowns() {
    const adhoc = this.adHocFilter;
    const ds = await getDataSource(adhoc.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getRecommendedDrilldowns) {
      return;
    }

    const queries = adhoc.state.useQueriesAsFilterForOptions ? getQueriesForVariables(adhoc) : undefined;
    const timeRange = sceneGraph.getTimeRange(adhoc).state.value;
    const scopes = sceneGraph.getScopes(adhoc);
    const filters = [...(adhoc.state.originFilters ?? []), ...adhoc.state.filters];

    const enrichedRequest = getEnrichedDataRequest(adhoc);
    const dashboardUid = enrichedRequest?.dashboardUID;

    try {
      // @ts-expect-error (temporary till we update grafana/data)
      const recommendedDrilldowns = await ds.getRecommendedDrilldowns({
        timeRange,
        dashboardUid,
        queries: queries ?? [],
        filters,
        scopes,
        userId: config.bootData.user.id,
      });

      if (recommendedDrilldowns?.filters) {
        this._recommendedFilters = recommendedDrilldowns.filters;
      }
    } catch (error) {
      console.error('Failed to fetch recommended drilldowns:', error);
    }
  }

  private async _verifyRecentFiltersApplicability(storedFilters: AdHocFilterWithLabels[]) {
    const adhoc = this.adHocFilter;
    const queries = adhoc.state.useQueriesAsFilterForOptions ? getQueriesForVariables(adhoc) : undefined;
    const response = await adhoc.getFiltersApplicabilityForQueries(storedFilters, queries ?? []);

    if (!response) {
      this._recentFilters = storedFilters.slice(-MAX_RECENT_DRILLDOWNS);
      return;
    }

    const applicabilityMap = new Map<string, boolean>();
    response.forEach((item: DrilldownsApplicability) => {
      applicabilityMap.set(item.key, item.applicable !== false);
    });

    const applicableFilters = storedFilters
      .filter((f) => {
        const isApplicable = applicabilityMap.get(f.key);
        return isApplicable === undefined || isApplicable === true;
      })
      .slice(-MAX_RECENT_DRILLDOWNS);

    this._recentFilters = applicableFilters;
  }

  /**
   * Stores a recent filter in localStorage and updates state.
   * Should be called by the parent variable when a filter is added/updated.
   */
  public storeRecentFilter(filter: AdHocFilterWithLabels) {
    const key = this._getStorageKey();
    const storedFilters = store.get(key);
    const allRecentFilters = storedFilters ? JSON.parse(storedFilters) : [];

    const updatedStoredFilters = [...allRecentFilters, filter].slice(-MAX_STORED_RECENT_DRILLDOWNS);
    store.set(key, JSON.stringify(updatedStoredFilters));

    const adhoc = this.adHocFilter;
    const existingFilter = adhoc.state.filters.find((f) => f.key === filter.key && !Boolean(f.nonApplicable));
    if (existingFilter && !Boolean(existingFilter.nonApplicable)) {
      this._recentFilters = updatedStoredFilters.slice(-MAX_RECENT_DRILLDOWNS);
    }
  }

  public addFilterToParent(filter: AdHocFilterWithLabels) {
    this.adHocFilter.updateFilters([...this.adHocFilter.state.filters, filter]);
  }

  public render() {
    const { filters } = this.adHocFilter.useState();

    const recentDrilldowns: DrilldownPill[] | undefined = this.recentFilters?.map((filter) => ({
      label: `${filter.key} ${filter.operator} ${filter.value}`,
      onClick: () => {
        this.addFilterToParent(filter);
      },
    }));

    const recommendedDrilldowns: DrilldownPill[] | undefined = this.recommendedFilters?.map((filter) => ({
      label: `${filter.key} ${filter.operator} ${filter.value}`,
      onClick: () => {
        // Check if filter already exists
        const exists = filters.some((f) => f.key === filter.key && f.value === filter.value);
        if (!exists) {
          this.addFilterToParent(filter);
        }
      },
    }));

    return (
      <DrilldownRecommendations recentDrilldowns={recentDrilldowns} recommendedDrilldowns={recommendedDrilldowns} />
    );
  }
}

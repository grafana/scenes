import React from 'react';
import { config } from '@grafana/runtime';
import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  store,
} from '@grafana/data';
import { Unsubscribable } from 'rxjs';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneDataQuery, SceneObjectState } from '../../core/types';
import { sceneGraph } from '../../core/sceneGraph';
import { getEnrichedDataRequest } from '../../querying/getEnrichedDataRequest';
import { getQueriesForVariables } from '../utils';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { getDataSource } from '../../utils/getDataSource';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest';
import { DrilldownRecommendations, DrilldownPill } from '../components/DrilldownRecommendations';
import { ScopesVariable } from '../variants/ScopesVariable';
import { SCOPES_VARIABLE_NAME } from '../constants';
import {
  AdHocFilterWithLabels,
  AdHocFiltersVariable,
  getRecentFiltersKey,
  MAX_RECENT_DRILLDOWNS,
  MAX_STORED_RECENT_DRILLDOWNS,
} from './AdHocFiltersVariable';

export interface AdHocFiltersRecommendationsState extends SceneObjectState {
  /** Recent filters */
  recentFilters?: AdHocFilterWithLabels[];
  /** Recommended filters */
  recommendedFilters?: AdHocFilterWithLabels[];
}

/**
 * Scene object component that manages recommendations for AdHocFiltersVariable.
 * It handles fetching recommended drilldowns, verifying applicability of recent filters,
 * and storing/displaying recent filters.
 */
export class AdHocFiltersRecommendations extends SceneObjectBase<AdHocFiltersRecommendationsState> {
  static Component = AdHocFiltersRecommendationsRenderer;

  private _scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };

  // Store parent as a class property, not in state, to avoid circular parent references
  private _parentVariable: AdHocFiltersVariable;

  public constructor(parent: AdHocFiltersVariable) {
    super({});
    this._parentVariable = parent;
    this.addActivationHandler(this._activationHandler);
  }

  /**
   * Get the parent variable
   */
  public get parent(): AdHocFiltersVariable {
    return this._parentVariable;
  }

  private _activationHandler = () => {
    const json = store.get(this._getStorageKey());
    const storedFilters = json ? JSON.parse(json) : [];

    // Verify applicability of stored recent filters
    if (storedFilters.length > 0) {
      this._verifyRecentFiltersApplicability(storedFilters);
    } else {
      this.setState({ recentFilters: [] });
    }

    this._fetchRecommendedDrilldowns();

    // Subscribe to scopes variable changes
    const scopesVariable = sceneGraph.lookupVariable(SCOPES_VARIABLE_NAME, this);
    let scopesSubscription: Unsubscribable | undefined;

    if (scopesVariable instanceof ScopesVariable) {
      scopesSubscription = scopesVariable.subscribeToState((newState, prevState) => {
        // Check if scopes have changed
        if (newState.scopes !== prevState.scopes) {
          const json = store.get(this._getStorageKey());
          const storedFilters = json ? JSON.parse(json) : [];

          if (storedFilters.length > 0) {
            this._verifyRecentFiltersApplicability(storedFilters);
          }
        }
      });
    }

    return () => {
      scopesSubscription?.unsubscribe();
    };
  };

  private _getStorageKey(): string {
    return getRecentFiltersKey(this._parentVariable.state.datasource?.uid);
  }

  private async _fetchRecommendedDrilldowns() {
    const parent = this._parentVariable;
    const ds = await getDataSource(parent.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getRecommendedDrilldowns) {
      return;
    }

    const queries = parent.state.useQueriesAsFilterForOptions ? getQueriesForVariables(parent) : undefined;
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const scopes = sceneGraph.getScopes(this);
    const filters = [...(parent.state.originFilters ?? []), ...parent.state.filters];

    const enrichedRequest = getEnrichedDataRequest(this);
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
        this.setState({ recommendedFilters: recommendedDrilldowns.filters });
      }
    } catch (error) {
      console.error('Failed to fetch recommended drilldowns:', error);
    }
  }

  private async _verifyRecentFiltersApplicability(storedFilters: AdHocFilterWithLabels[]) {
    const parent = this._parentVariable;
    const queries = parent.state.useQueriesAsFilterForOptions ? getQueriesForVariables(parent) : undefined;
    const response = await this._getFiltersApplicabilityForQueries(storedFilters, queries ?? []);

    if (!response) {
      this.setState({ recentFilters: storedFilters.slice(-MAX_RECENT_DRILLDOWNS) });
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

    this.setState({ recentFilters: applicableFilters });
  }

  private async _getFiltersApplicabilityForQueries(
    filters: AdHocFilterWithLabels[],
    queries: SceneDataQuery[]
  ): Promise<DrilldownsApplicability[] | undefined> {
    const parent = this._parentVariable;
    const ds = await getDataSource(parent.state.datasource, this._scopedVars);
    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getDrilldownsApplicability) {
      return;
    }

    const timeRange = sceneGraph.getTimeRange(this).state.value;

    // @ts-expect-error (temporary till we update grafana/data)
    return await ds.getDrilldownsApplicability({
      filters,
      queries,
      timeRange,
      scopes: sceneGraph.getScopes(this),
      ...getEnrichedFiltersRequest(this),
    });
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

    const parent = this._parentVariable;
    const existingFilter = parent.state.filters.find((f) => f.key === filter.key && !Boolean(f.nonApplicable));
    if (existingFilter && !Boolean(existingFilter.nonApplicable)) {
      this.setState({ recentFilters: updatedStoredFilters.slice(-MAX_RECENT_DRILLDOWNS) });
    }
  }

  /**
   * Get the current filters from the parent variable
   */
  public getParentFilters(): AdHocFilterWithLabels[] {
    return this._parentVariable.state.filters;
  }

  /**
   * Add a filter to the parent variable
   */
  public addFilterToParent(filter: AdHocFilterWithLabels) {
    const parent = this._parentVariable;
    parent.updateFilters([...parent.state.filters, filter]);
  }
}

function AdHocFiltersRecommendationsRenderer({ model }: SceneComponentProps<AdHocFiltersRecommendations>) {
  const { recentFilters, recommendedFilters } = model.useState();
  const { filters } = model.parent.useState();

  const recentDrilldowns: DrilldownPill[] | undefined = recentFilters?.map((filter) => ({
    label: `${filter.key} ${filter.operator} ${filter.value}`,
    onClick: () => {
      model.addFilterToParent(filter);
    },
  }));

  const recommendedDrilldowns: DrilldownPill[] | undefined = recommendedFilters?.map((filter) => ({
    label: `${filter.key} ${filter.operator} ${filter.value}`,
    onClick: () => {
      // Check if filter already exists
      const exists = filters.some((f) => f.key === filter.key && f.value === filter.value);
      if (!exists) {
        model.addFilterToParent(filter);
      }
    },
  }));

  return <DrilldownRecommendations recentDrilldowns={recentDrilldowns} recommendedDrilldowns={recommendedDrilldowns} />;
}

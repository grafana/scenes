import React from 'react';
import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  store,
} from '@grafana/data';
import { sceneGraph } from '../../core/sceneGraph';
import { getEnrichedDataRequest } from '../../querying/getEnrichedDataRequest';
import { getQueriesForVariables } from '../utils';
import { getDataSource } from '../../utils/getDataSource';
import { DrilldownRecommendations, DrilldownPill } from '../components/DrilldownRecommendations';
import { ScopesVariable } from '../variants/ScopesVariable';
import { SCOPES_VARIABLE_NAME } from '../constants';
import { AdHocFilterWithLabels, AdHocFiltersVariable } from './AdHocFiltersVariable';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../../core/types';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { Unsubscribable } from 'rxjs';

export const MAX_RECENT_DRILLDOWNS = 3;
export const MAX_STORED_RECENT_DRILLDOWNS = 10;

export const getRecentFiltersKey = (datasourceUid: string | undefined) =>
  `grafana.filters.recent.${datasourceUid ?? 'default'}`;

export interface AdHocFiltersRecommendationsState extends SceneObjectState {
  recentFilters?: AdHocFilterWithLabels[];
  recommendedFilters?: AdHocFilterWithLabels[];
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

  private _activationHandler = () => {
    const json = store.get(this._getStorageKey());
    const storedFilters = json ? JSON.parse(json) : [];

    if (storedFilters.length > 0) {
      this._verifyRecentFiltersApplicability(storedFilters);
    } else {
      this.setState({ recentFilters: [] });
    }

    this._fetchRecommendedDrilldowns();

    // Set up subscription to scopes variable
    const scopesVariable = sceneGraph.lookupVariable(SCOPES_VARIABLE_NAME, this._adHocFilter);
    let scopesSubscription: Unsubscribable | undefined;

    if (scopesVariable instanceof ScopesVariable) {
      this._subs.add(
        (scopesSubscription = scopesVariable.subscribeToState((newState, prevState) => {
          if (newState.scopes !== prevState.scopes) {
            const json = store.get(this._getStorageKey());
            const storedFilters = json ? JSON.parse(json) : [];

            if (storedFilters.length > 0) {
              this._verifyRecentFiltersApplicability(storedFilters);
            }

            this._fetchRecommendedDrilldowns();
          }
        }))
      );
    }

    return () => {
      scopesSubscription?.unsubscribe();
    };
  };

  private _getStorageKey(): string {
    return getRecentFiltersKey(this._adHocFilter.state.datasource?.uid);
  }

  private async _fetchRecommendedDrilldowns() {
    const adhoc = this._adHocFilter;
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
      });

      if (recommendedDrilldowns?.filters) {
        this.setState({ recommendedFilters: recommendedDrilldowns.filters });
      }
    } catch (error) {
      console.error('Failed to fetch recommended drilldowns:', error);
    }
  }

  private async _verifyRecentFiltersApplicability(storedFilters: AdHocFilterWithLabels[]) {
    const adhoc = this._adHocFilter;
    const queries = adhoc.state.useQueriesAsFilterForOptions ? getQueriesForVariables(adhoc) : undefined;
    const response = await adhoc.getFiltersApplicabilityForQueries(storedFilters, queries ?? []);

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

    const adhoc = this._adHocFilter;
    const existingFilter = adhoc.state.filters.find((f) => f.key === filter.key && !Boolean(f.nonApplicable));
    if (existingFilter && !Boolean(existingFilter.nonApplicable)) {
      this.setState({ recentFilters: updatedStoredFilters.slice(-MAX_RECENT_DRILLDOWNS) });
    }
  }

  public addFilterToParent(filter: AdHocFilterWithLabels) {
    this._adHocFilter.updateFilters([...this._adHocFilter.state.filters, filter]);
  }
}

function AdHocFiltersRecommendationsRenderer({ model }: SceneComponentProps<AdHocFiltersRecommendations>) {
  const { recentFilters, recommendedFilters } = model.useState();
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

  return <DrilldownRecommendations recentDrilldowns={recentDrilldowns} recommendedDrilldowns={recommendedDrilldowns} />;
}

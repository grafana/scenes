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
import { GroupByVariable } from './GroupByVariable';
import { MAX_RECENT_DRILLDOWNS, MAX_STORED_RECENT_DRILLDOWNS } from '../adhoc/AdHocFiltersRecommendations';
import { VariableValueSingle } from '../types';
import { isArray } from 'lodash';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState } from '../../core/types';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { Unsubscribable } from 'rxjs';

export const getRecentGroupingKey = (datasourceUid: string | undefined) =>
  `grafana.grouping.recent.${datasourceUid ?? 'default'}`;

export interface GroupByRecommendationsState extends SceneObjectState {
  recentGrouping?: Array<SelectableValue<VariableValueSingle>>;
  recommendedGrouping?: Array<SelectableValue<VariableValueSingle>>;
}

export class GroupByRecommendations extends SceneObjectBase<GroupByRecommendationsState> {
  static Component = GroupByRecommendationsRenderer;

  public constructor(state: Partial<GroupByRecommendationsState> = {}) {
    super(state);

    this.addActivationHandler(this._activationHandler);
  }

  private get _groupBy(): GroupByVariable {
    if (!(this.parent instanceof GroupByVariable)) {
      throw new Error('GroupByRecommendations must be a child of GroupByVariable');
    }

    return this.parent;
  }

  private get _scopedVars() {
    return { __sceneObject: wrapInSafeSerializableSceneObject(this._groupBy) };
  }

  private _activationHandler = () => {
    const json = store.get(this._getStorageKey());
    const storedGroupings = json ? JSON.parse(json) : [];

    if (storedGroupings.length > 0) {
      this._verifyRecentGroupingsApplicability(storedGroupings);
    } else {
      this.setState({ recentGrouping: [] });
    }

    this._fetchRecommendedDrilldowns();

    // Subscribe to scopes variable changes
    const scopesVariable = sceneGraph.lookupVariable(SCOPES_VARIABLE_NAME, this._groupBy);
    let scopesSubscription: Unsubscribable | undefined;

    if (scopesVariable instanceof ScopesVariable) {
      this._subs.add(
        (scopesSubscription = scopesVariable.subscribeToState((newState, prevState) => {
          if (newState.scopes !== prevState.scopes) {
            const json = store.get(this._getStorageKey());
            const storedGroupings = json ? JSON.parse(json) : [];

            if (storedGroupings.length > 0) {
              this._verifyRecentGroupingsApplicability(storedGroupings);
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
    return getRecentGroupingKey(this._groupBy.state.datasource?.uid);
  }

  private async _fetchRecommendedDrilldowns() {
    const ds = await getDataSource(this._groupBy.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getRecommendedDrilldowns) {
      return;
    }

    const queries = getQueriesForVariables(this._groupBy);
    const timeRange = sceneGraph.getTimeRange(this._groupBy).state.value;
    const scopes = sceneGraph.getScopes(this._groupBy);
    const groupByKeys = Array.isArray(this._groupBy.state.value)
      ? this._groupBy.state.value.map((v) => String(v))
      : this._groupBy.state.value
      ? [String(this._groupBy.state.value)]
      : [];

    const enrichedRequest = getEnrichedDataRequest(this._groupBy);
    const dashboardUid = enrichedRequest?.dashboardUID;

    try {
      // @ts-expect-error (temporary till we update grafana/data)
      const recommendedDrilldowns = await ds.getRecommendedDrilldowns({
        timeRange,
        dashboardUid,
        queries,
        groupByKeys,
        scopes,
      });

      if (recommendedDrilldowns?.groupByKeys) {
        this.setState({
          recommendedGrouping: recommendedDrilldowns.groupByKeys.map((key: string) => ({ value: key, text: key })),
        });
      }
    } catch (error) {
      console.error('Failed to fetch recommended drilldowns:', error);
    }
  }

  private async _verifyRecentGroupingsApplicability(storedGroupings: Array<SelectableValue<VariableValueSingle>>) {
    const queries = getQueriesForVariables(this._groupBy);
    const keys = storedGroupings.map((g) => String(g.value));
    const response = await this._groupBy.getGroupByApplicabilityForQueries(keys, queries);

    if (!response) {
      this.setState({ recentGrouping: storedGroupings.slice(-MAX_RECENT_DRILLDOWNS) });
      return;
    }

    const applicabilityMap = new Map<string, boolean>();
    response.forEach((item: DrilldownsApplicability) => {
      applicabilityMap.set(item.key, item.applicable !== false);
    });

    const applicableGroupings = storedGroupings
      .filter((g) => {
        const isApplicable = applicabilityMap.get(String(g.value));
        return isApplicable === undefined || isApplicable === true;
      })
      .slice(-MAX_RECENT_DRILLDOWNS);

    this.setState({ recentGrouping: applicableGroupings });
  }

  /**
   * Stores recent groupings in localStorage and updates state.
   * Should be called by the parent variable when a grouping is added/updated.
   */
  public storeRecentGrouping(applicableValues: string[]) {
    if (applicableValues.length === 0) {
      return;
    }

    const key = this._getStorageKey();
    const storedGroupings = store.get(key);
    const allRecentGroupings: Array<SelectableValue<VariableValueSingle>> = storedGroupings
      ? JSON.parse(storedGroupings)
      : [];

    const existingWithoutApplicableValues = allRecentGroupings.filter(
      (grouping) => !applicableValues.includes(String(grouping.value))
    );
    const updatedStoredGroupings = [
      ...existingWithoutApplicableValues,
      ...applicableValues.map((value) => ({ value, text: value })),
    ];

    const limitedStoredGroupings = updatedStoredGroupings.slice(-MAX_STORED_RECENT_DRILLDOWNS);

    store.set(key, JSON.stringify(limitedStoredGroupings));

    this.setState({ recentGrouping: limitedStoredGroupings.slice(-MAX_RECENT_DRILLDOWNS) });
  }

  /**
   * Add a grouping value to the parent variable
   */
  public addValueToParent(newValue: VariableValueSingle, newText?: string) {
    const value = isArray(this._groupBy.state.value) ? this._groupBy.state.value : [this._groupBy.state.value];
    const text = isArray(this._groupBy.state.text)
      ? this._groupBy.state.text.map(String)
      : [String(this._groupBy.state.text)];

    // Check if value already exists
    if (value.includes(newValue)) {
      return;
    }

    this._groupBy.changeValueTo(
      [...value.filter((v) => v !== ''), newValue],
      [...text.filter((t) => t !== ''), newText ?? String(newValue)],
      true
    );
  }
}

function GroupByRecommendationsRenderer({ model }: SceneComponentProps<GroupByRecommendations>) {
  const { recentGrouping, recommendedGrouping } = model.useState();

  const recentDrilldowns: DrilldownPill[] | undefined = recentGrouping?.map((groupBy) => ({
    label: `${groupBy.value}`,
    onClick: () => {
      model.addValueToParent(groupBy.value!, groupBy.text ?? String(groupBy.value));
    },
  }));

  const recommendedDrilldowns: DrilldownPill[] | undefined = recommendedGrouping?.map((groupBy) => ({
    label: `${groupBy.value}`,
    onClick: () => {
      model.addValueToParent(groupBy.value!, groupBy.text ?? String(groupBy.value));
    },
  }));

  return <DrilldownRecommendations recentDrilldowns={recentDrilldowns} recommendedDrilldowns={recommendedDrilldowns} />;
}

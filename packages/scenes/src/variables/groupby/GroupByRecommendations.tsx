import React from 'react';
import { config } from '@grafana/runtime';
import {
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  SelectableValue,
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
import { GroupByVariable } from './GroupByVariable';
import { MAX_RECENT_DRILLDOWNS, MAX_STORED_RECENT_DRILLDOWNS } from '../adhoc/AdHocFiltersRecommendations';
import { VariableValue, VariableValueSingle } from '../types';
import { isArray } from 'lodash';

export const getRecentGroupingKey = (datasourceUid: string | undefined) =>
  `grafana.grouping.recent.${datasourceUid ?? 'default'}`;

export interface GroupByRecommendationsState extends SceneObjectState {
  /** Recent groupings */
  recentGrouping?: Array<SelectableValue<VariableValueSingle>>;
  /** Recommended groupings */
  recommendedGrouping?: Array<SelectableValue<VariableValueSingle>>;
}

/**
 * Scene object component that manages recommendations for GroupByVariable.
 * It handles fetching recommended drilldowns, verifying applicability of recent groupings,
 * and storing/displaying recent groupings.
 */
export class GroupByRecommendations extends SceneObjectBase<GroupByRecommendationsState> {
  static Component = GroupByRecommendationsRenderer;

  private _scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };

  // Store parent as a class property, not in state, to avoid circular parent references
  private _parentVariable: GroupByVariable;

  public constructor(parent: GroupByVariable) {
    super({});
    this._parentVariable = parent;
    this.addActivationHandler(this._activationHandler);
  }

  /**
   * Get the parent variable
   */
  public get parent(): GroupByVariable {
    return this._parentVariable;
  }

  private _activationHandler = () => {
    const json = store.get(this._getStorageKey());
    const storedGroupings = json ? JSON.parse(json) : [];

    // Verify applicability of stored recent groupings
    if (storedGroupings.length > 0) {
      this._verifyRecentGroupingsApplicability(storedGroupings);
    } else {
      this.setState({ recentGrouping: [] });
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
          const storedGroupings = json ? JSON.parse(json) : [];

          if (storedGroupings.length > 0) {
            this._verifyRecentGroupingsApplicability(storedGroupings);
          }
        }
      });
    }

    return () => {
      scopesSubscription?.unsubscribe();
    };
  };

  private _getStorageKey(): string {
    return getRecentGroupingKey(this._parentVariable.state.datasource?.uid);
  }

  private async _fetchRecommendedDrilldowns() {
    const parent = this._parentVariable;
    const ds = await getDataSource(parent.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getRecommendedDrilldowns) {
      return;
    }

    const queries = getQueriesForVariables(parent);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const scopes = sceneGraph.getScopes(this);
    const groupByKeys = Array.isArray(parent.state.value)
      ? parent.state.value.map((v) => String(v))
      : parent.state.value
      ? [String(parent.state.value)]
      : [];

    const enrichedRequest = getEnrichedDataRequest(this);
    const dashboardUid = enrichedRequest?.dashboardUID;

    try {
      // @ts-expect-error (temporary till we update grafana/data)
      const recommendedDrilldowns = await ds.getRecommendedDrilldowns({
        timeRange,
        dashboardUid,
        queries,
        groupByKeys,
        scopes,
        userId: config.bootData.user.id,
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
    const queries = getQueriesForVariables(this._parentVariable);
    const keys = storedGroupings.map((g) => String(g.value));
    const response = await this._getGroupByApplicabilityForQueries(keys, queries);

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

  private async _getGroupByApplicabilityForQueries(
    value: VariableValue,
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
      groupByKeys: Array.isArray(value) ? value.map((v) => String(v)) : value ? [String(value)] : [],
      queries,
      timeRange,
      scopes: sceneGraph.getScopes(this),
      ...getEnrichedFiltersRequest(this),
    });
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
   * Get the current values from the parent variable
   */
  public getParentValues(): { value: VariableValueSingle[]; text: string[] } {
    const parent = this._parentVariable;
    const value = isArray(parent.state.value) ? parent.state.value : [parent.state.value];
    const text = isArray(parent.state.text) ? parent.state.text.map(String) : [String(parent.state.text)];
    return { value, text };
  }

  /**
   * Add a grouping value to the parent variable
   */
  public addValueToParent(newValue: VariableValueSingle, newText?: string) {
    const parent = this._parentVariable;
    const { value, text } = this.getParentValues();

    // Check if value already exists
    if (value.includes(newValue)) {
      return;
    }

    parent.changeValueTo(
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

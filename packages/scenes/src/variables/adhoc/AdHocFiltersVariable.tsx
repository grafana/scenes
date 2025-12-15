import React, { useMemo } from 'react';
import {
  AdHocVariableFilter,
  GetTagResponse,
  GrafanaTheme2,
  MetricFindValue,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  Scope,
  SelectableValue,
  store,
} from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { ControlsLayout, SceneComponentProps, SceneDataQuery } from '../../core/types';
import { DataSourceRef } from '@grafana/schema';
import {
  dataFromResponse,
  escapeOriginFilterUrlDelimiters,
  getQueriesForVariables,
  renderPrometheusLabelFilters,
  responseHasError,
} from '../utils';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { useStyles2 } from '@grafana/ui';
import { sceneGraph } from '../../core/sceneGraph';
import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { config, getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersVariableUrlSyncHandler, toArray } from './AdHocFiltersVariableUrlSyncHandler';
import { css } from '@emotion/css';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest';
import { getEnrichedDataRequest } from '../../querying/getEnrichedDataRequest';
import { AdHocFiltersComboboxRenderer } from './AdHocFiltersCombobox/AdHocFiltersComboboxRenderer';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { debounce, isEqual } from 'lodash';
import { getAdHocFiltersFromScopes } from './getAdHocFiltersFromScopes';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { getQueryController } from '../../core/sceneGraph/getQueryController';
import { FILTER_REMOVED_INTERACTION, FILTER_RESTORED_INTERACTION } from '../../performance/interactionConstants';
import { AdHocFiltersVariableController } from './controller/AdHocFiltersVariableController';

export interface AdHocFilterWithLabels<M extends Record<string, any> = {}> extends AdHocVariableFilter {
  keyLabel?: string;
  valueLabels?: string[];
  // this is used to externally trigger edit mode in combobox filter UI
  forceEdit?: boolean;
  // hide the filter from AdHocFiltersVariableRenderer and the URL
  hidden?: boolean;
  meta?: M;
  // filter origin, it can be either scopes, dashboards or undefined,
  // which means it won't appear in the UI
  origin?: FilterOrigin;
  // whether this is basically a cancelled filter through filter-key =~ .*
  matchAllFilter?: boolean;
  // whether this specific filter is read-only and cannot be edited
  readOnly?: boolean;
  // whether this specific filter is restorable to some value from _originalValues
  restorable?: boolean;
  // sets this filter as non-applicable
  nonApplicable?: boolean;
  // reason with reason for nonApplicable filters
  nonApplicableReason?: string;
}

const ORIGIN_FILTERS_KEY: keyof AdHocFiltersVariableState = 'originFilters';

export const MAX_RECENT_DRILLDOWNS = 3;
export const MAX_STORED_RECENT_DRILLDOWNS = 10;

export const getRecentFiltersKey = (datasourceUid: string | undefined) =>
  `grafana.filters.recent.${datasourceUid ?? 'default'}`;

export type AdHocControlsLayout = ControlsLayout | 'combobox';

export type FilterOrigin = 'dashboard' | 'scope' | string;

export interface AdHocFiltersVariableState extends SceneVariableState {
  /** Optional text to display on the 'add filter' button */
  addFilterButtonText?: string;
  /** The visible filters */
  filters: AdHocFilterWithLabels[];
  /** Base filters to always apply when looking up keys*/
  baseFilters?: AdHocFilterWithLabels[];
  /** Filters originated from a source */
  originFilters?: AdHocFilterWithLabels[];
  /** Datasource to use for getTagKeys and getTagValues and also controls which scene queries the filters should apply to */
  datasource: DataSourceRef | null;
  /** Controls if the filters can be changed */
  readOnly?: boolean;
  /**
   * @experimental
   * Controls the layout and design of the label.
   */
  layout?: AdHocControlsLayout;
  /**
   * Defaults to automatic which means filters will automatically be applied to all queries with the same data source as this AdHocFilterSet.
   * In manual mode you either have to use the filters programmatically or as a variable inside query expressions.
   */
  applyMode: 'auto' | 'manual';
  /**
   * Filter out the keys that do not match the regex.
   */
  tagKeyRegexFilter?: RegExp;
  /**
   * Extension hook for customizing the key lookup.
   * Return replace: true if you want to override the default lookup
   * Return replace: false if you want to combine the results with the default lookup
   */
  getTagKeysProvider?: getTagKeysProvider;
  /**
   * Extension hook for customizing the value lookup.
   * Return replace: true if you want to override the default lookup.
   * Return replace: false if you want to combine the results with the default lookup
   */
  getTagValuesProvider?: getTagValuesProvider;

  /**
   * Optionally provide an array of static keys that override getTagKeys
   */
  defaultKeys?: MetricFindValue[];

  /**
   * This is the expression that the filters resulted in. Defaults to
   * Prometheus / Loki compatible label filter expression
   */
  filterExpression?: string;

  /**
   * The default builder creates a Prometheus/Loki compatible filter expression,
   * this can be overridden to create a different expression based on the current filters.
   */
  expressionBuilder?: AdHocVariableExpressionBuilderFn;

  /**
   * Whether the filter supports new multi-value operators like =| and !=|
   */
  supportsMultiValueOperators?: boolean;

  /**
   * When querying the datasource for label names and values to determine keys and values
   * for this ad hoc filter, consider the queries in the scene and use them as a filter.
   * This queries filter can be used to ensure that only ad hoc filter options that would
   * impact the current queries are presented to the user.
   */
  useQueriesAsFilterForOptions?: boolean;

  /**
   * Flag that decides whether custom values can be added to the filter
   */
  allowCustomValue?: boolean;

  /**
   * @internal state of the new filter being added
   */
  _wip?: AdHocFilterWithLabels;

  /**
   * Allows custom formatting of a value before saving to filter state
   */
  onAddCustomValue?: OnAddCustomValueFn;
  /**
   * state for checking whether drilldown applicability is enabled
   */
  applicabilityEnabled?: boolean;

  /**
   * contains stored recent filter
   */
  _recentFilters?: AdHocFilterWithLabels[];

  /**
   * contains recommended filters
   */
  _recommendedFilters?: AdHocFilterWithLabels[];

  /**
   * enables drilldown recommendations
   */
  drilldownRecommendationsEnabled?: boolean;
}

export type AdHocVariableExpressionBuilderFn = (filters: AdHocFilterWithLabels[]) => string;
export type OnAddCustomValueFn = (
  item: SelectableValue<string> & { isCustom?: boolean },
  filter: AdHocFilterWithLabels
) => { value: string | undefined; valueLabels: string[] };

export type getTagKeysProvider = (
  variable: AdHocFiltersVariable,
  currentKey: string | null,
  operators?: OperatorDefinition[]
) => Promise<{ replace?: boolean; values: GetTagResponse | MetricFindValue[] }>;

export type getTagValuesProvider = (
  variable: AdHocFiltersVariable,
  filter: AdHocFilterWithLabels
) => Promise<{ replace?: boolean; values: GetTagResponse | MetricFindValue[] }>;

export type AdHocFiltersVariableCreateHelperArgs = AdHocFiltersVariableState;

export type OperatorDefinition = {
  value: string;
  description?: string;
  isMulti?: Boolean;
  isRegex?: Boolean;
};

export const OPERATORS: OperatorDefinition[] = [
  {
    value: '=',
    description: 'Equals',
  },
  {
    value: '!=',
    description: 'Not equal',
  },
  {
    value: '=|',
    description: 'One of. Use to filter on multiple values.',
    isMulti: true,
  },
  {
    value: '!=|',
    description: 'Not one of. Use to exclude multiple values.',
    isMulti: true,
  },
  {
    value: '=~',
    description: 'Matches regex',
    isRegex: true,
  },
  {
    value: '!~',
    description: 'Does not match regex',
    isRegex: true,
  },
  {
    value: '<',
    description: 'Less than',
  },
  {
    value: '<=',
    description: 'Less than or equal to',
  },
  {
    value: '>',
    description: 'Greater than',
  },
  {
    value: '>=',
    description: 'Greater than or equal to',
  },
];

interface OriginalValue {
  value: string[];
  operator: string;
  nonApplicable?: boolean;
  nonApplicableReason?: string;
}

export class AdHocFiltersVariable
  extends SceneObjectBase<AdHocFiltersVariableState>
  implements SceneVariable<AdHocFiltersVariableState>
{
  static Component = AdHocFiltersVariableRenderer;

  private _scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };
  private _dataSourceSrv = getDataSourceSrv();
  // holds the originalValues of all baseFilters in a map. The values
  // are set on construct and used to restore a baseFilter with an origin
  // to its original value if edited at some point
  private _originalValues: Map<string, OriginalValue> = new Map();
  private _prevScopes: Scope[] = [];

  /** Needed for scopes dependency */
  protected _variableDependency = new VariableDependencyConfig(this, {
    dependsOnScopes: true,
    onReferencedVariableValueChanged: () => this._updateScopesFilters(),
  });

  protected _urlSync = new AdHocFiltersVariableUrlSyncHandler(this);

  private _debouncedVerifyApplicability = debounce(this._verifyApplicability, 100);

  public constructor(state: Partial<AdHocFiltersVariableState>) {
    super({
      type: 'adhoc',
      name: state.name ?? 'Filters',
      filters: [],
      datasource: null,
      applyMode: 'auto',
      filterExpression:
        state.filterExpression ??
        renderExpression(state.expressionBuilder, [...(state.originFilters ?? []), ...(state.filters ?? [])]),
      ...state,
    });

    if (this.state.applyMode === 'auto') {
      patchGetAdhocFilters(this);
    }

    this.state.originFilters?.forEach((filter) => {
      this._originalValues.set(`${filter.key}-${filter.origin}`, {
        operator: filter.operator,
        value: filter.values ?? [filter.value],
      });
    });

    this.addActivationHandler(this._activationHandler);
  }

  private _activationHandler = () => {
    this._debouncedVerifyApplicability();

    if (this.state.drilldownRecommendationsEnabled) {
      const json = store.get(getRecentFiltersKey(this.state.datasource?.uid));
      const storedFilters = json ? JSON.parse(json) : [];

      // Verify applicability of stored recent filters
      if (storedFilters.length > 0) {
        this._verifyRecentFiltersApplicability(storedFilters);
      } else {
        this.setState({ _recentFilters: [] });
      }

      this._fetchRecommendedDrilldowns();
    }

    return () => {
      this.state.originFilters?.forEach((filter) => {
        if (filter.restorable) {
          this.restoreOriginalFilter(filter);
        }
      });

      this.setState({ applicabilityEnabled: false });
    };
  };

  private async _fetchRecommendedDrilldowns() {
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds || !ds.getRecommendedDrilldowns) {
      return;
    }

    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const scopes = sceneGraph.getScopes(this);
    const filters = [...(this.state.originFilters ?? []), ...this.state.filters];

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
        this.setRecommendedFilters(recommendedDrilldowns.filters);
      }
    } catch (error) {
      console.error('Failed to fetch recommended drilldowns:', error);
    }
  }

  private _updateScopesFilters() {
    const scopes = sceneGraph.getScopes(this);

    if (!scopes || !scopes.length) {
      this.setState({
        originFilters: this.state.originFilters?.filter((filter) => filter.origin !== 'scope'),
      });
      return;
    }

    const scopeFilters = getAdHocFiltersFromScopes(scopes);

    if (!scopeFilters.length) {
      return;
    }

    let finalFilters = scopeFilters;
    const scopeInjectedFilters: AdHocFilterWithLabels[] = [];
    const remainingFilters: AdHocFilterWithLabels[] = [];

    // set original values for scope filters as well
    finalFilters.forEach((scopeFilter) => {
      this._originalValues.set(`${scopeFilter.key}-${scopeFilter.origin}`, {
        value: scopeFilter.values ?? [scopeFilter.value],
        operator: scopeFilter.operator,
      });
    });

    this.state.originFilters?.forEach((filter) => {
      if (filter.origin === 'scope') {
        scopeInjectedFilters.push(filter);
      } else {
        remainingFilters.push(filter);
      }
    });

    if (this._prevScopes.length) {
      this.setState({ originFilters: [...finalFilters, ...remainingFilters] });
      this._prevScopes = scopes;

      this._debouncedVerifyApplicability();
      return;
    }

    const editedScopeFilters = scopeInjectedFilters.filter((filter) => filter.restorable);
    const editedScopeFilterKeys = editedScopeFilters.map((filter) => filter.key);
    const scopeFilterKeys = scopeFilters.map((filter) => filter.key);

    // if the scope filters contain the key of an edited scope filter, we replace
    // with the edited filter. We also add the remaining unedited scope filters
    // when not overwriting
    finalFilters = [
      ...editedScopeFilters.filter((filter) => scopeFilterKeys.includes(filter.key)),
      ...scopeFilters.filter((filter) => !editedScopeFilterKeys.includes(filter.key)),
    ];

    // maintain other originFilters in the array, only update scopes ones
    this.setState({ originFilters: [...finalFilters, ...remainingFilters] });
    this._prevScopes = scopes;

    this._debouncedVerifyApplicability();
  }

  private async verifyApplicabilityAndStoreRecentFilter(update: AdHocFilterWithLabels) {
    await this._verifyApplicability();
    if (!this.state.drilldownRecommendationsEnabled) {
      return;
    }

    this.storeRecentFilter(update);
  }

  public setState(update: Partial<AdHocFiltersVariableState>): void {
    let filterExpressionChanged = false;

    if (
      ((update.filters && update.filters !== this.state.filters) ||
        (update.originFilters && update.originFilters !== this.state.originFilters)) &&
      !update.filterExpression
    ) {
      const filters = update.filters ?? this.state.filters;
      const originFilters = update.originFilters ?? this.state.originFilters;

      update.filterExpression = renderExpression(this.state.expressionBuilder, [...(originFilters ?? []), ...filters]);
      filterExpressionChanged = update.filterExpression !== this.state.filterExpression;
    }

    super.setState(update);

    if (filterExpressionChanged) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  /**
   * Updates the variable's `filters` and `filterExpression` state.
   * If `skipPublish` option is true, this will not emit the `SceneVariableValueChangedEvent`,
   * allowing consumers to update the filters without triggering dependent data providers.
   */
  public updateFilters(
    filters: AdHocFilterWithLabels[],
    options?: {
      skipPublish?: boolean;
      forcePublish?: boolean;
    }
  ): void {
    let filterExpressionChanged = false;
    let filterExpression: string | undefined = undefined;

    if (filters && filters !== this.state.filters) {
      filterExpression = renderExpression(this.state.expressionBuilder, [
        ...(this.state.originFilters ?? []),
        ...filters,
      ]);
      filterExpressionChanged = filterExpression !== this.state.filterExpression;
    }

    super.setState({
      filters,
      filterExpression,
    });

    if ((filterExpressionChanged && options?.skipPublish !== true) || options?.forcePublish) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  public restoreOriginalFilter(filter: AdHocFilterWithLabels) {
    const original: Partial<AdHocFilterWithLabels> = {
      matchAllFilter: false,
      restorable: false,
    };

    if (filter.restorable) {
      const originalFilter = this._originalValues.get(`${filter.key}-${filter.origin}`);

      if (!originalFilter) {
        return;
      }

      original.value = originalFilter?.value[0];
      original.values = originalFilter?.value;
      original.valueLabels = originalFilter?.value;
      original.operator = originalFilter?.operator;
      original.nonApplicable = originalFilter?.nonApplicable;
      const queryController = getQueryController(this);
      queryController?.startProfile(FILTER_RESTORED_INTERACTION);
      this._updateFilter(filter, original);
    }
  }

  public getValue(fieldPath?: string): VariableValue | undefined {
    if (fieldPath === ORIGIN_FILTERS_KEY) {
      const originFilters = this.state.originFilters;

      if (!originFilters || originFilters?.length === 0) {
        return [];
      }

      return [
        ...originFilters.map((filter) =>
          toArray(filter).map(escapeOriginFilterUrlDelimiters).join('|').concat(`#${filter.origin}`)
        ),
      ];
    }

    return this.state.filterExpression;
  }

  public _updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>) {
    const { originFilters, filters, _wip } = this.state;

    if (filter.origin) {
      const originalValues = this._originalValues.get(`${filter.key}-${filter.origin}`);
      const updateValues = update.values || (update.value ? [update.value] : undefined);

      if (
        (updateValues && !isEqual(updateValues, originalValues?.value)) ||
        (update.operator && update.operator !== originalValues?.operator)
      ) {
        update.restorable = true;
      } else if (updateValues && isEqual(updateValues, originalValues?.value)) {
        update.restorable = false;
      }

      const updatedFilters =
        originFilters?.map((f) => {
          return f === filter ? { ...f, ...update } : f;
        }) ?? [];
      this.setState({ originFilters: updatedFilters });

      return;
    }

    if (filter === _wip) {
      // If we set value we are done with this "work in progress" filter and we can add it
      if ('value' in update && update['value'] !== '') {
        this.setState({
          filters: [...filters, { ..._wip, ...update }],
          _wip: undefined,
        });
        this.verifyApplicabilityAndStoreRecentFilter({ ..._wip, ...update });
      } else {
        this.setState({ _wip: { ...filter, ...update } });
      }
      return;
    }

    const updatedFilters = this.state.filters.map((f) => {
      return f === filter ? { ...f, ...update } : f;
    });

    this.setState({ filters: updatedFilters });
    this.storeRecentFilter({ ...filter, ...update });
  }

  private storeRecentFilter(update: AdHocFilterWithLabels) {
    if (!this.state.drilldownRecommendationsEnabled) {
      return;
    }

    const key = getRecentFiltersKey(this.state.datasource?.uid);
    const storedFilters = store.get(key);
    const allRecentFilters = storedFilters ? JSON.parse(storedFilters) : [];

    const updatedStoredFilters = [...allRecentFilters, update].slice(-MAX_STORED_RECENT_DRILLDOWNS);
    store.set(key, JSON.stringify(updatedStoredFilters));

    const filter = this.state.filters.find((f) => f.key === update.key && !Boolean(f.nonApplicable));
    if (filter && !Boolean(filter.nonApplicable)) {
      this.setState({ _recentFilters: updatedStoredFilters.slice(-MAX_RECENT_DRILLDOWNS) });
    }
  }

  private async _verifyRecentFiltersApplicability(storedFilters: AdHocFilterWithLabels[]) {
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;
    const response = await this.getFiltersApplicabilityForQueries(storedFilters, queries ?? []);

    if (!response) {
      this.setState({ _recentFilters: storedFilters.slice(-MAX_RECENT_DRILLDOWNS) });
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

    this.setState({ _recentFilters: applicableFilters });
  }

  public updateToMatchAll(filter: AdHocFilterWithLabels) {
    this._updateFilter(filter, {
      operator: '=~',
      value: '.*',
      values: ['.*'],
      valueLabels: ['All'],
      matchAllFilter: true,
      nonApplicable: false,
      restorable: true,
    });
  }

  public _removeFilter(filter: AdHocFilterWithLabels) {
    if (filter === this.state._wip) {
      this.setState({ _wip: undefined });
      return;
    }
    const queryController = getQueryController(this);
    queryController?.startProfile(FILTER_REMOVED_INTERACTION);

    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
    this._debouncedVerifyApplicability();
  }

  public _removeLastFilter() {
    const filterToRemove = this.state.filters.at(-1);

    if (filterToRemove) {
      this._removeFilter(filterToRemove);
    }
  }

  public _handleComboboxBackspace(filter: AdHocFilterWithLabels) {
    if (this.state.filters.length) {
      // default forceEdit last filter (when triggering from wip filter)
      let filterToForceIndex = this.state.filters.length - 1;

      // adjust filterToForceIndex index to -1 if backspace triggered from non wip filter
      //  to avoid triggering forceEdit logic
      if (filter !== this.state._wip) {
        filterToForceIndex = -1;
      }

      this.setState({
        filters: this.state.filters.reduce<AdHocFilterWithLabels[]>((acc, f, index) => {
          // adjust forceEdit of preceding filter if not readOnly
          if (index === filterToForceIndex && !f.readOnly) {
            return [
              ...acc,
              {
                ...f,
                forceEdit: true,
              },
            ];
          }
          // remove current filter
          if (f === filter) {
            return acc;
          }

          return [...acc, f];
        }, []),
      });
    } else if (this.state.originFilters?.length) {
      // default forceEdit last filter (when triggering from wip filter)
      let filterToForceIndex = this.state.originFilters.length - 1;

      // adjust filterToForceIndex index to -1 if backspace triggered from non wip filter
      //  to avoid triggering forceEdit logic
      if (filter !== this.state._wip) {
        filterToForceIndex = -1;
      }

      this.setState({
        originFilters: this.state.originFilters.reduce<AdHocFilterWithLabels[]>((acc, f, index) => {
          // adjust forceEdit of preceding filter
          if (index === filterToForceIndex && !f.readOnly) {
            return [
              ...acc,
              {
                ...f,
                forceEdit: true,
              },
            ];
          }
          // remove current filter
          if (f === filter) {
            return acc;
          }

          return [...acc, f];
        }, []),
      });
    }
  }

  public setRecommendedFilters(recommendedFilters: AdHocFilterWithLabels[]) {
    this.setState({
      _recommendedFilters: recommendedFilters,
    });
  }

  public async getFiltersApplicabilityForQueries(
    filters: AdHocFilterWithLabels[],
    queries: SceneDataQuery[]
  ): Promise<DrilldownsApplicability[] | undefined> {
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
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

  public async _verifyApplicability() {
    const filters = [...this.state.filters, ...(this.state.originFilters ?? [])];
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;

    const response = await this.getFiltersApplicabilityForQueries(filters, queries ?? []);

    if (!response) {
      return;
    }

    const responseMap = new Map<string, DrilldownsApplicability>();
    response.forEach((filter: DrilldownsApplicability) => {
      responseMap.set(`${filter.key}${filter.origin ? `-${filter.origin}` : ''}`, filter);
    });

    const update = {
      applicabilityEnabled: true,
      filters: [...this.state.filters],
      originFilters: [...(this.state.originFilters ?? [])],
    };

    update.filters.forEach((f) => {
      const filter = responseMap.get(f.key);

      if (filter) {
        f.nonApplicable = !filter.applicable;
        f.nonApplicableReason = filter.reason;
      }
    });

    update.originFilters?.forEach((f) => {
      const filter = responseMap.get(`${f.key}-${f.origin}`);

      if (filter) {
        if (!f.matchAllFilter) {
          f.nonApplicable = !filter.applicable;
          f.nonApplicableReason = filter.reason;
        }

        const originalValue = this._originalValues.get(`${f.key}-${f.origin}`);
        if (originalValue) {
          originalValue.nonApplicable = !filter.applicable;
          originalValue.nonApplicableReason = filter?.reason;
        }
      }
    });

    this.setState(update);
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public async _getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>> {
    const override = await this.state.getTagKeysProvider?.(this, currentKey);

    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }

    if (this.state.defaultKeys) {
      return this.state.defaultKeys.map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
      return [];
    }

    const applicableOriginFilters = this.state.originFilters?.filter((f) => !f.nonApplicable) ?? [];
    const otherFilters = this.state.filters
      .filter((f) => f.key !== currentKey && !f.nonApplicable)
      .concat(this.state.baseFilters ?? [])
      .concat(applicableOriginFilters);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;
    const response = await ds.getTagKeys({
      filters: otherFilters,
      queries,
      timeRange,
      scopes: sceneGraph.getScopes(this),
      ...getEnrichedFiltersRequest(this),
    });

    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }

    let keys = dataFromResponse(response);
    if (override) {
      keys = keys.concat(dataFromResponse(override.values));
    }

    const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
    if (tagKeyRegexFilter) {
      keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
    }

    return keys.map(toSelectableValue);
  }

  /**
   * Get possible key values for a specific key given current filters. Do not call from plugins directly
   */
  public async _getValuesFor(filter: AdHocFilterWithLabels): Promise<Array<SelectableValue<string>>> {
    const override = await this.state.getTagValuesProvider?.(this, filter);

    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);

    if (!ds || !ds.getTagValues) {
      return [];
    }

    const originFilters = this.state.originFilters?.filter((f) => f.key !== filter.key) ?? [];
    // Filter out the current filter key from the list of all filters
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat(originFilters);

    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;

    let scopes = sceneGraph.getScopes(this);

    // if current filter is a scope originated one we need to filter out
    // filters with same key in scopes prop, similar to how we do in adhocFilters prop
    if (filter.origin === 'scope') {
      scopes = scopes?.map((scope) => {
        return {
          ...scope,
          spec: {
            ...scope.spec,
            filters: scope.spec.filters?.filter((f) => f.key !== filter.key),
          },
        };
      });
    }

    const response = await ds.getTagValues({
      key: filter.key,
      filters: otherFilters,
      timeRange,
      queries,
      scopes,
      ...getEnrichedFiltersRequest(this),
    });

    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }

    let values = dataFromResponse(response);
    if (override) {
      values = values.concat(dataFromResponse(override.values));
    }

    return values.map(toSelectableValue);
  }

  public _addWip() {
    this.setState({
      _wip: { key: '', value: '', operator: '=', condition: '' },
    });
  }

  public _getOperators() {
    const { supportsMultiValueOperators, allowCustomValue = true } = this.state;

    return OPERATORS.filter(({ isMulti, isRegex }) => {
      if (!supportsMultiValueOperators && isMulti) {
        return false;
      }
      if (!allowCustomValue && isRegex) {
        return false;
      }
      return true;
    }).map<SelectableValue<string>>(({ value, description }) => ({
      label: value,
      value,
      description,
    }));
  }
}

function renderExpression(
  builder: AdHocVariableExpressionBuilderFn | undefined,
  filters: AdHocFilterWithLabels[] | undefined
) {
  return (builder ?? renderPrometheusLabelFilters)(filters?.filter((f) => isFilterApplicable(f)) ?? []);
}

export function AdHocFiltersVariableRenderer({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters, readOnly, addFilterButtonText } = model.useState();
  const styles = useStyles2(getStyles);

  // Create controller adapter for combobox mode
  const controller = useMemo(
    () => (model.state.layout === 'combobox' ? new AdHocFiltersVariableController(model) : undefined),
    [model]
  );

  if (controller) {
    return <AdHocFiltersComboboxRenderer controller={controller} />;
  }

  return (
    <div className={styles.wrapper}>
      {filters
        .filter((filter) => !filter.hidden)
        .map((filter, index) => (
          <React.Fragment key={index}>
            <AdHocFilterRenderer filter={filter} model={model} />
          </React.Fragment>
        ))}

      {!readOnly && <AdHocFilterBuilder model={model} key="'builder" addFilterButtonText={addFilterButtonText} />}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(1),
  }),
});

export function toSelectableValue(input: MetricFindValue): SelectableValue<string> {
  const { text, value } = input;
  const result: SelectableValue<string> = {
    // converting text to string due to some edge cases where it can be a number
    // TODO: remove once https://github.com/grafana/grafana/issues/99021 is closed
    label: String(text),
    value: String(value ?? text),
  };

  if ('group' in input) {
    result.group = input.group;
  }

  if ('meta' in input) {
    result.meta = input.meta;
  }

  return result;
}

export function isMatchAllFilter(filter: AdHocFilterWithLabels): boolean {
  return filter.operator === '=~' && filter.value === '.*';
}

export function isFilterComplete(filter: AdHocFilterWithLabels): boolean {
  return filter.key !== '' && filter.operator !== '' && filter.value !== '';
}

export function isFilterApplicable(filter: AdHocFilterWithLabels): boolean {
  return !filter.nonApplicable;
}

export function isMultiValueOperator(operatorValue: string): boolean {
  const operator = OPERATORS.find((o) => o.value === operatorValue);
  if (!operator) {
    // default to false if operator is not found
    return false;
  }
  return Boolean(operator.isMulti);
}

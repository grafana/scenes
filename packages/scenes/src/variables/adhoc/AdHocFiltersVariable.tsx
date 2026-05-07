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
import { getDataSourceSrv } from '@grafana/runtime';
import { getAdHocFilterInteractionHandler } from '../../core/sceneGraph/getReportInteractionHandler';
import { AdHocFiltersVariableUrlSyncHandler, toArray } from './AdHocFiltersVariableUrlSyncHandler';
import { css } from '@emotion/css';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest';
import { AdHocFiltersComboboxRenderer } from './AdHocFiltersCombobox/AdHocFiltersComboboxRenderer';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { debounce, isEqual } from 'lodash';
import { getAdHocFiltersFromScopes } from './getAdHocFiltersFromScopes';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { getQueryController } from '../../core/sceneGraph/getQueryController';
import { FILTER_REMOVED_INTERACTION, FILTER_RESTORED_INTERACTION } from '../../performance/interactionConstants';
import { AdHocFiltersVariableController } from './controller/AdHocFiltersVariableController';
import { AdHocFiltersRecommendations } from './AdHocFiltersRecommendations';

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
  // whether this groupBy origin filter was dismissed by the user (hidden from UI but kept for restore tracking)
  dismissedGroupBy?: boolean;
  // sets this filter as non-applicable
  nonApplicable?: boolean;
  // reason with reason for nonApplicable filters
  nonApplicableReason?: string;
}

const ORIGIN_FILTERS_KEY: keyof AdHocFiltersVariableState = 'originFilters';

export type AdHocControlsLayout = ControlsLayout | 'combobox';

export type FilterOrigin = 'dashboard' | 'scope' | string;

export interface AdHocFiltersVariableState extends SceneVariableState {
  /** Optional text to display on the 'add filter' button */
  addFilterButtonText?: string;
  /** Optional placeholder text for the filter input field */
  inputPlaceholder?: string;
  /** Optional placeholder for the group-by key input */
  groupByInputPlaceholder?: string;
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
   * @deprecated The `layout` property is deprecated and scheduled for removal before grafana v14.
   * The `'horizontal'` and `'vertical'` options are no longer supported.
   * Use `'combobox'` instead or remove this property entirely.
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
   * Extension hook for customizing the group-by key lookup.
   * Return replace: true to override the default lookup (ds.getGroupByKeys or ds.getTagKeys).
   * Return replace: false to combine the results with the default lookup.
   */
  getGroupByKeysProvider?: getGroupByKeysProvider;
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
   * When true, enables a collapse button that appears when filters wrap to multiple lines.
   * Allows users to collapse the filter UI to save vertical space.
   */
  collapsible?: boolean;

  /**
   * enables drilldown recommendations
   */
  drilldownRecommendationsEnabled?: boolean;

  /**
   * When true, the "groupBy" operator is available and filters can be used as group-by dimensions.
   */
  enableGroupBy?: boolean;
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

export type getGroupByKeysProvider = (
  variable: AdHocFiltersVariable,
  currentKey?: string | null
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
  valueLabels?: string[];
  keyLabel?: string;
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

  private _recommendations: AdHocFiltersRecommendations | undefined;

  public constructor(state: Partial<AdHocFiltersVariableState>) {
    const { collapsible, defaultKeys, drilldownRecommendationsEnabled, ...restState } = state;
    const behaviors = state.$behaviors ?? [];
    const recommendations = state.drilldownRecommendationsEnabled ? new AdHocFiltersRecommendations() : undefined;

    if (recommendations) {
      behaviors.push(recommendations);
    }

    super({
      type: 'adhoc',
      name: state.name ?? 'Filters',
      filters: [],
      datasource: null,
      applyMode: 'auto',
      filterExpression:
        state.filterExpression ??
        renderExpression(state.expressionBuilder, [...(state.originFilters ?? []), ...(state.filters ?? [])]),
      ...restState,
      ...(behaviors.length > 0 && { $behaviors: behaviors }),
      ...(collapsible !== undefined && { collapsible }),
      ...(drilldownRecommendationsEnabled !== undefined && { drilldownRecommendationsEnabled }),
      ...(defaultKeys && { defaultKeys }),
      layout: state.layout || 'combobox',
    });

    this._recommendations = recommendations;

    if (this.state.applyMode === 'auto') {
      patchGetAdhocFilters(this);
    }

    this.state.originFilters?.forEach((filter) => {
      this._setOriginalValue(filter);
    });

    this.addActivationHandler(this._activationHandler);
  }

  private _activationHandler = () => {
    this._debouncedVerifyApplicability();

    return () => {
      // When the variable's component is temporarily unmounted (e.g. during panel edit)
      // but the variable set is still active, skip restoring defaults — the variable
      // is still logically part of the scene and its state should be preserved.
      if (this.parent?.isActive) {
        return;
      }

      this.state.originFilters?.forEach((filter) => {
        if (filter.restorable && !isGroupByFilter(filter)) {
          this.restoreOriginalFilter(filter);
        }
      });

      this.restoreOriginalGroupBy();
    };
  };

  public getRecommendations(): AdHocFiltersRecommendations | undefined {
    return this._recommendations;
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
      this._setOriginalValue(scopeFilter);
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
    this._recommendations?.storeRecentFilter(update);
  }

  public setState(update: Partial<AdHocFiltersVariableState>): void {
    let filterExpressionChanged = false;
    let groupByChanged = false;

    if (
      ((update.filters && update.filters !== this.state.filters) ||
        (update.originFilters && update.originFilters !== this.state.originFilters)) &&
      !update.filterExpression
    ) {
      const filters = update.filters ?? this.state.filters;
      const originFilters = update.originFilters ?? this.state.originFilters;

      update.filterExpression = renderExpression(this.state.expressionBuilder, [...(originFilters ?? []), ...filters]);
      filterExpressionChanged = update.filterExpression !== this.state.filterExpression;
      groupByChanged = haveGroupByKeysChanged(
        [...(this.state.originFilters ?? []), ...this.state.filters],
        [...(originFilters ?? []), ...filters]
      );
    }

    super.setState(update);

    if (filterExpressionChanged || groupByChanged) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  private _resolveOriginFlags(
    key: string,
    origin: string,
    values: string[],
    operator: string,
    singleValue: string
  ): { restorable: boolean; matchAllFilter: boolean } {
    const original = this._originalValues.get(originalValueKey({ key, origin, operator }));
    const isMatchAll = operator === '=~' && singleValue === '.*';
    const isRestorable = !isEqual(values, original?.value) || operator !== original?.operator;

    return {
      matchAllFilter: isMatchAll,
      restorable: isRestorable,
    };
  }

  public validateOriginFilters(filters: AdHocFilterWithLabels[]): AdHocFilterWithLabels[] {
    return filters.map((filter) => {
      if (!filter.origin) {
        return filter;
      }

      if (!this._originalValues.has(originalValueKey(filter))) {
        return filter;
      }

      const updateValues = filter.values || (filter.value ? [filter.value] : undefined);
      if (!updateValues) {
        return {
          ...filter,
          operator: '=~',
          value: '.*',
          values: ['.*'],
          valueLabels: ['All'],
          matchAllFilter: true,
          nonApplicable: false,
          restorable: true,
        };
      }

      const flags = this._resolveOriginFlags(filter.key, filter.origin, updateValues, filter.operator, filter.value);
      return { ...filter, ...flags };
    });
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
    let groupByChanged = false;
    let filterExpression: string | undefined = undefined;

    if (filters && filters !== this.state.filters) {
      filterExpression = renderExpression(this.state.expressionBuilder, [
        ...(this.state.originFilters ?? []),
        ...filters,
      ]);
      filterExpressionChanged = filterExpression !== this.state.filterExpression;
      groupByChanged = haveGroupByKeysChanged(this.state.filters, filters);
    }

    super.setState({
      filters,
      filterExpression,
    });

    if (((filterExpressionChanged || groupByChanged) && options?.skipPublish !== true) || options?.forcePublish) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  /**
   * Add a group-by filter (key only, operator 'groupBy', no value).
   * No-op when enableGroupBy is false.
   */
  public _addGroupByFilter(item: SelectableValue<string>): void {
    if (!this.state.enableGroupBy) {
      return;
    }

    const key = item.value ?? '';
    const keyLabel = item.label ?? key;
    const newFilter: AdHocFilterWithLabels = {
      key,
      keyLabel,
      operator: 'groupBy',
      value: '',
      condition: '',
    };
    this._recommendations?.storeRecentGrouping(key);
    this.updateFilters([...this.state.filters, newFilter]);
    getAdHocFilterInteractionHandler(this)?.onGroupByAdded?.({ key });
  }

  public restoreOriginalFilter(filter: AdHocFilterWithLabels) {
    if (!filter.restorable) {
      return;
    }

    const originalFilter = this._originalValues.get(originalValueKey(filter));
    if (!originalFilter) {
      return;
    }

    const queryController = getQueryController(this);
    queryController?.startProfile(FILTER_RESTORED_INTERACTION);
    this._updateFilter(filter, {
      value: originalFilter.value[0],
      values: isMultiValueOperator(originalFilter.operator) ? originalFilter.value : undefined,
      valueLabels: originalFilter.valueLabels ?? originalFilter.value,
      operator: originalFilter.operator,
      nonApplicable: originalFilter.nonApplicable,
    });
    getAdHocFilterInteractionHandler(this)?.onFilterRestored?.({ key: filter.key, origin: filter.origin });
  }

  /**
   * Get the original value for an origin filter before any user modifications.
   * Returns undefined if no original is tracked for this filter.
   */
  public getOriginalValue(
    filter: AdHocFilterWithLabels
  ): { value: string[]; operator: string; valueLabels?: string[]; keyLabel?: string } | undefined {
    return this._originalValues.get(originalValueKey(filter));
  }

  /**
   * Store a snapshot of the filter's current value and operator so it can be restored later.
   */
  private _setOriginalValue(filter: AdHocFilterWithLabels): void {
    const rawValues = filter.values ?? [filter.value];
    const value = rawValues.filter((v): v is string => v !== undefined && v !== null);

    if (!isGroupByFilter(filter) && value.length === 0) {
      return;
    }

    this._originalValues.set(originalValueKey(filter), {
      value,
      operator: filter.operator,
      ...(filter.valueLabels && { valueLabels: filter.valueLabels }),
      ...(filter.keyLabel && { keyLabel: filter.keyLabel }),
    });
  }

  /**
   * Get original filters from original values.
   * Returns filters from _originalValues map.
   */
  public getOriginalFilters(): AdHocFilterWithLabels[] {
    return [...this._originalValues.entries()].map(([mapKey, original]) => {
      const suffix = `${VALUE_KEY_DELIMITER}${GROUP_BY_OPERATOR}`;
      const isGroupBy = mapKey.endsWith(suffix);
      const baseKey = isGroupBy ? mapKey.slice(0, -suffix.length) : mapKey;

      const delimiter = baseKey.lastIndexOf(VALUE_KEY_DELIMITER);
      const key = baseKey.substring(0, delimiter);
      const origin = baseKey.substring(delimiter + VALUE_KEY_DELIMITER.length);

      return {
        key,
        origin,
        value: original.value[0],
        values: isMultiValueOperator(original.operator) ? original.value : undefined,
        valueLabels: original.valueLabels ?? original.value,
        keyLabel: original.keyLabel ?? key,
        operator: original.operator,
        nonApplicable: original.nonApplicable,
      } as AdHocFilterWithLabels;
    });
  }

  /**
   * Replace all stored original values from the given filters array.
   */
  public setOriginalFilters(filters: AdHocFilterWithLabels[]): void {
    this._originalValues.clear();
    filters.forEach((filter) => {
      this._setOriginalValue(filter);
    });
  }

  /**
   * Whether the groupBy state has diverged from defaults (any dismissed or user-added groupBys).
   */
  public isGroupByRestorable(): boolean {
    const originFilters = this.state.originFilters ?? [];
    const hasOriginGroupBy = originFilters.some((f) => isGroupByFilter(f) && f.origin);

    if (!hasOriginGroupBy) {
      return false;
    }

    const hasDismissedOrRestorable = originFilters.some((f) => isGroupByFilter(f) && f.origin && f.restorable);
    const hasUserGroupBy = this.state.filters.some(isGroupByFilter);

    return hasDismissedOrRestorable || hasUserGroupBy;
  }

  /**
   * Restore all original group by filters.
   */
  public restoreOriginalGroupBy(): void {
    const restoredOrigins = (this.state.originFilters ?? []).map((f) => {
      if (!isGroupByFilter(f) || !f.origin) {
        return f;
      }
      return { ...f, dismissedGroupBy: false, restorable: false };
    });

    const nonGroupByFilters = this.state.filters.filter((f) => !isGroupByFilter(f));

    this.setState({
      originFilters: restoredOrigins,
      filters: nonGroupByFilters,
    });
    getAdHocFilterInteractionHandler(this)?.onGroupByRestored?.();
  }

  /**
   * Clear all user-added filters and restore origin filters to their original values.
   */
  public clearAll(): void {
    const filtersCount = this.state.filters.length;
    const restorableCount = this.state.originFilters?.filter((f) => f.restorable && !isGroupByFilter(f)).length ?? 0;

    // Restore all restorable origin filters to their original values
    this.state.originFilters?.forEach((filter) => {
      if (filter.restorable && !isGroupByFilter(filter)) {
        this.restoreOriginalFilter(filter);
      }
    });

    // Restore groupBy defaults
    this.restoreOriginalGroupBy();

    // Clear all user-added filters
    this.setState({ filters: [] });

    getAdHocFilterInteractionHandler(this)?.onClearAll?.({
      filtersCleared: filtersCount,
      originsRestored: restorableCount,
    });
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

    if ('value' in update && !('values' in update)) {
      update = { ...update, values: undefined };
    }

    if (filter.origin) {
      if (isGroupByFilter(filter) && 'key' in update && update.key !== filter.key) {
        const updatedOrigins = (originFilters ?? []).map((f) => {
          if (f === filter) {
            return { ...f, dismissedGroupBy: true, restorable: true };
          }
          if (isGroupByFilter(f) && f.origin && !f.dismissedGroupBy) {
            return { ...f, restorable: true };
          }
          return f;
        });

        // The original default is dismissed (preserved for restore); the user's
        // new key becomes a separate user filter so it doesn't overwrite the default.
        const newFilter: AdHocFilterWithLabels = {
          key: update.key as string,
          keyLabel: (update.keyLabel as string) ?? (update.key as string),
          operator: 'groupBy',
          value: '',
          condition: '',
        };

        this.setState({
          originFilters: updatedOrigins,
          filters: [...filters, newFilter],
        });
        return;
      }

      const updateValues = update.values || (update.value ? [update.value] : undefined);

      if (updateValues) {
        const effectiveOperator = update.operator ?? filter.operator;
        const effectiveValue = update.value ?? filter.value;
        const flags = this._resolveOriginFlags(
          filter.key,
          filter.origin,
          updateValues,
          effectiveOperator,
          effectiveValue
        );
        Object.assign(update, flags);
      }

      const updatedFilters =
        originFilters?.map((f) => {
          if (f === filter) {
            return { ...f, ...update };
          }
          if (isGroupByFilter(filter) && update.restorable && isGroupByFilter(f) && f.origin && !f.restorable) {
            return { ...f, restorable: true };
          }
          return f;
        }) ?? [];
      this.setState({ originFilters: updatedFilters });

      return;
    }

    if (filter === _wip) {
      // If we set value we are done with this "work in progress" filter and we can add it
      if ('value' in update && update['value'] !== '') {
        const newFilter = { ..._wip, ...update };
        this.setState({
          filters: [...filters, newFilter],
          _wip: undefined,
        });
        this.verifyApplicabilityAndStoreRecentFilter(newFilter);
        getAdHocFilterInteractionHandler(this)?.onFilterAdded?.({ key: newFilter.key, operator: newFilter.operator });
      } else {
        this.setState({ _wip: { ...filter, ...update } });
      }
      return;
    }

    const updatedFilters = this.state.filters.map((f) => {
      return f === filter ? { ...f, ...update } : f;
    });

    this.setState({ filters: updatedFilters });

    const merged = { ...filter, ...update };
    if (isGroupByFilter(merged)) {
      this._recommendations?.storeRecentGrouping(merged.key);
    } else {
      this._recommendations?.storeRecentFilter(merged);
    }
  }

  public updateToMatchAll(filter: AdHocFilterWithLabels) {
    if (isGroupByFilter(filter) && filter.origin) {
      const updatedOrigins = (this.state.originFilters ?? []).map((f) => {
        if (f === filter) {
          return { ...f, dismissedGroupBy: true, restorable: true };
        }
        if (isGroupByFilter(f) && f.origin && !f.dismissedGroupBy) {
          return { ...f, restorable: true };
        }
        return f;
      });

      this.setState({ originFilters: updatedOrigins });
      getAdHocFilterInteractionHandler(this)?.onGroupByRemoved?.({ key: filter.key, origin: filter.origin });
    } else {
      this._updateFilter(filter, {
        operator: '=~',
        value: '.*',
        values: ['.*'],
        valueLabels: ['All'],
        matchAllFilter: true,
        nonApplicable: false,
        restorable: true,
      });
      getAdHocFilterInteractionHandler(this)?.onFilterMatchAll?.({ key: filter.key, origin: filter.origin });
    }
  }

  public _removeFilter(filter: AdHocFilterWithLabels) {
    if (filter === this.state._wip) {
      this.setState({ _wip: undefined });
      return;
    }

    const queryController = getQueryController(this);
    queryController?.startProfile(FILTER_REMOVED_INTERACTION);

    const isGroupBy = isGroupByFilter(filter);
    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
    this._debouncedVerifyApplicability();

    const handler = getAdHocFilterInteractionHandler(this);
    if (isGroupBy) {
      handler?.onGroupByRemoved?.({ key: filter.key });
    } else {
      handler?.onFilterRemoved?.({ key: filter.key });
    }
  }

  public _removeLastFilter() {
    const filterToRemove = this.state.filters.at(-1);

    if (filterToRemove) {
      this._removeFilter(filterToRemove);
    }
  }

  public _handleComboboxBackspace(filter: AdHocFilterWithLabels) {
    if (isGroupByFilter(filter)) {
      if (this.state.filters.includes(filter)) {
        this._removeFilter(filter);
      } else {
        for (let i = this.state.filters.length - 1; i >= 0; i--) {
          if (isGroupByFilter(this.state.filters[i]) && !this.state.filters[i].readOnly) {
            this._removeFilter(this.state.filters[i]);
            return;
          }
        }
        const origins = this.state.originFilters ?? [];
        for (let i = origins.length - 1; i >= 0; i--) {
          if (isGroupByFilter(origins[i]) && origins[i].origin && !origins[i].dismissedGroupBy) {
            this.updateToMatchAll(origins[i]);
            return;
          }
        }
      }
      return;
    }

    if (isFilterComplete(filter)) {
      const queryController = getQueryController(this);
      queryController?.startProfile(FILTER_REMOVED_INTERACTION);
    }

    const isWip = filter === this.state._wip;

    if (this.state.filters.length) {
      const filterToForceIndex = isWip ? findLastAdhocFilterIndex(this.state.filters) : -1;

      this.setState({
        filters: this.state.filters.reduce<AdHocFilterWithLabels[]>((acc, f, index) => {
          // adjust forceEdit of preceding filter if not readOnly
          if (index === filterToForceIndex && !f.readOnly) {
            return [...acc, { ...f, forceEdit: true }];
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
      const filterToForceIndex = isWip ? findLastAdhocFilterIndex(this.state.originFilters) : -1;

      this.setState({
        originFilters: this.state.originFilters.reduce<AdHocFilterWithLabels[]>((acc, f, index) => {
          // adjust forceEdit of preceding filter
          if (index === filterToForceIndex && !f.readOnly) {
            return [...acc, { ...f, forceEdit: true }];
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

  public async getFiltersApplicabilityForQueries(
    filters: AdHocFilterWithLabels[],
    queries: SceneDataQuery[],
    groupByKeys?: string[]
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
      ...(groupByKeys && groupByKeys.length > 0 ? { groupByKeys } : {}),
      ...getEnrichedFiltersRequest(this),
    });
  }

  public async _verifyApplicability() {
    if (!this.state.applicabilityEnabled) {
      return;
    }

    const allFilters = [...this.state.filters, ...(this.state.originFilters ?? [])];
    const filters = allFilters.filter((f) => !isGroupByFilter(f));
    const groupByKeys = this.state.enableGroupBy
      ? allFilters.filter((f) => isGroupByFilter(f)).map((f) => f.key)
      : undefined;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;

    const response = await this.getFiltersApplicabilityForQueries(filters, queries ?? [], groupByKeys);

    if (!response) {
      return;
    }

    const responseMap = new Map<string, DrilldownsApplicability>();
    response.forEach((filter: DrilldownsApplicability) => {
      responseMap.set(`${filter.key}${filter.origin ? `-${filter.origin}` : ''}`, filter);
    });

    const update = {
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

        const originalValue = this._originalValues.get(originalValueKey(f));
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

    const applicableOriginFilters =
      this.state.originFilters?.filter((f) => !f.nonApplicable && !isGroupByFilter(f) && !isMatchAllFilter(f)) ?? [];
    const otherFilters = this.state.filters
      .filter((f) => f.key !== currentKey && !f.nonApplicable && !isGroupByFilter(f) && !isMatchAllFilter(f))
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
   * Get possible group-by keys.
   * @param currentKey - The current key being edited (excluded from filters)
   * @param queries - Optional queries to scope the key lookup. When provided, these are used
   *   instead of discovering all queries in the scene via getQueriesForVariables.
   */
  public async _getGroupByKeys(
    currentKey: string | null,
    queries?: SceneDataQuery[]
  ): Promise<Array<SelectableValue<string>>> {
    if (!this.state.enableGroupBy) {
      return [];
    }

    const override = await this.state.getGroupByKeysProvider?.(this, currentKey);

    if (override && override.replace) {
      return dataFromResponse(override.values).map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    // @ts-expect-error (TODO: remove after upgrading with https://github.com/grafana/grafana/pull/118270)
    if (!ds || !ds.getGroupByKeys) {
      return override ? dataFromResponse(override.values).map(toSelectableValue) : [];
    }

    const applicableOriginFilters =
      this.state.originFilters?.filter((f) => !f.nonApplicable && !isGroupByFilter(f) && !isMatchAllFilter(f)) ?? [];
    const otherFilters = this.state.filters
      .filter((f) => f.key !== currentKey && !f.nonApplicable && !isGroupByFilter(f) && !isMatchAllFilter(f))
      .concat(this.state.baseFilters ?? [])
      .concat(applicableOriginFilters);
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queriesForKeys =
      queries ?? (this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined);

    // @ts-expect-error (TODO: remove after upgrading with https://github.com/grafana/grafana/pull/118270)
    const response = await ds.getGroupByKeys({
      filters: otherFilters,
      queries: queriesForKeys,
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

    const originFilters =
      this.state.originFilters?.filter((f) => f.key !== filter.key && !isGroupByFilter(f) && !isMatchAllFilter(f)) ??
      [];
    const otherFilters = this.state.filters
      .filter((f) => f.key !== filter.key && !isGroupByFilter(f) && !isMatchAllFilter(f))
      .concat(originFilters);

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
  return (builder ?? renderPrometheusLabelFilters)(
    filters?.filter((f) => isFilterApplicable(f) && !isGroupByFilter(f)) ?? []
  );
}

function getGroupByKeys(filters: AdHocFilterWithLabels[]): string[] {
  return filters
    .filter((f) => isGroupByFilter(f) && isFilterComplete(f) && !f.dismissedGroupBy)
    .map((f) => f.key)
    .sort();
}

function haveGroupByKeysChanged(prev: AdHocFilterWithLabels[], next: AdHocFilterWithLabels[]): boolean {
  const prevKeys = getGroupByKeys(prev);
  const nextKeys = getGroupByKeys(next);

  if (prevKeys.length !== nextKeys.length) {
    return true;
  }

  return prevKeys.some((key, i) => key !== nextKeys[i]);
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

export const GROUP_BY_OPERATOR = 'groupBy';
export const VALUE_KEY_DELIMITER = '::';

export function isGroupByFilter(filter: AdHocFilterWithLabels): boolean {
  return filter.operator === GROUP_BY_OPERATOR;
}

export function isFilterComplete(filter: AdHocFilterWithLabels): boolean {
  return filter.key !== '' && filter.operator !== '' && (isGroupByFilter(filter) || filter.value !== '');
}

export function isFilterApplicable(filter: AdHocFilterWithLabels): boolean {
  return !filter.nonApplicable;
}

function findLastAdhocFilterIndex(filters: AdHocFilterWithLabels[]): number {
  for (let i = filters.length - 1; i >= 0; i--) {
    if (!isGroupByFilter(filters[i])) {
      return i;
    }
  }
  return -1;
}

function originalValueKey({ key, origin, operator }: { key: string; origin?: string; operator: string }): string {
  return operator === GROUP_BY_OPERATOR
    ? `${key}${VALUE_KEY_DELIMITER}${origin}${VALUE_KEY_DELIMITER}${GROUP_BY_OPERATOR}`
    : `${key}${VALUE_KEY_DELIMITER}${origin}`;
}

export function isMultiValueOperator(operatorValue: string): boolean {
  const operator = OPERATORS.find((o) => o.value === operatorValue);
  if (!operator) {
    // default to false if operator is not found
    return false;
  }
  return Boolean(operator.isMulti);
}

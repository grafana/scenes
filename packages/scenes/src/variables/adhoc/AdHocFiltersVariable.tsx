import React from 'react';
import { AdHocVariableFilter, GetTagResponse, GrafanaTheme2, MetricFindValue, SelectableValue } from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { ControlsLayout, SceneComponentProps } from '../../core/types';
import { DataSourceRef } from '@grafana/schema';
import { dataFromResponse, getQueriesForVariables, renderPrometheusLabelFilters, responseHasError } from '../utils';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { useStyles2 } from '@grafana/ui';
import { sceneGraph } from '../../core/sceneGraph';
import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersVariableUrlSyncHandler } from './AdHocFiltersVariableUrlSyncHandler';
import { css } from '@emotion/css';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest';
import { AdHocFiltersComboboxRenderer } from './AdHocFiltersCombobox/AdHocFiltersComboboxRenderer';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { isEqual } from 'lodash';
import { getAdHocFiltersFromScopes } from './getAdHocFiltersFromScopes';
import { VariableDependencyConfig } from '../VariableDependencyConfig';

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
}

export type AdHocControlsLayout = ControlsLayout | 'combobox';

export type FilterOrigin = 'dashboard' | 'scope' | string;

export interface AdHocFiltersVariableState extends SceneVariableState {
  /** Optional text to display on the 'add filter' button */
  addFilterButtonText?: string;
  /** The visible filters */
  filters: AdHocFilterWithLabels[];
  /** Base filters to always apply when looking up keys*/
  baseFilters?: AdHocFilterWithLabels[];
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
    value: '>',
    description: 'Greater than',
  },
];

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
  private _originalValues: Map<string, { value: string[]; operator: string }> = new Map();

  /** Needed for scopes dependency */
  protected _variableDependency = new VariableDependencyConfig(this, {
    dependsOnScopes: true,
    onReferencedVariableValueChanged: () => this._updateScopesFilters(),
  });

  protected _urlSync = new AdHocFiltersVariableUrlSyncHandler(this);

  public constructor(state: Partial<AdHocFiltersVariableState>) {
    super({
      type: 'adhoc',
      name: state.name ?? 'Filters',
      filters: [],
      datasource: null,
      applyMode: 'auto',
      filterExpression:
        state.filterExpression ??
        renderExpression(state.expressionBuilder, [
          ...(state.baseFilters?.filter((filter) => filter.origin) ?? []),
          ...(state.filters ?? []),
        ]),
      ...state,
    });

    if (this.state.applyMode === 'auto') {
      patchGetAdhocFilters(this);
    }

    // set dashboard lvl original values in constructor, since we have them from schema
    this.state.baseFilters?.forEach((baseFilter) => {
      if (baseFilter.origin === 'dashboard') {
        this._originalValues.set(baseFilter.key, {
          operator: baseFilter.operator,
          value: baseFilter.values ?? [baseFilter.value],
        });
      }
    });

    this.addActivationHandler(this._activationHandler);
  }

  private _activationHandler = () => {
    this._updateScopesFilters();

    return () => {
      // we clear both scopes and dashboard level filters before leaving a dashboard to maintain accuracy for both
      // when/if we return to the same dashboard
      // e.g.: we edit a scope filter and go to another dashboard, it gets carried over, but then on that dashboard
      // we reset the value, and then come back to the initial dashboard, that dashboard still has the edited scope
      // because the URL will not hold any value, since on reset we clear the url, but the initial dashboard still
      // has the changed value in the schema, unless we reset it here
      if (this.state.baseFilters?.length) {
        this.setState({
          baseFilters: [...this.state.baseFilters.filter((filter) => filter.origin !== 'scope')],
        });
        // same for dashboard level filters if we edit one and go to another dashboard, reset to whatever initial value is there
        // and come back to the initial one it will use the last modified value it has, since URL is empty from the reset done
        // before
        this.state.baseFilters?.forEach((filter) => {
          if (filter.origin === 'dashboard' && filter.restorable) {
            this.restoreOriginalFilter(filter);
          }
        });
      }
    };
  };

  private _updateScopesFilters() {
    const scopes = sceneGraph.getScopes(this);

    if (!scopes) {
      return;
    }

    if (!scopes.length) {
      this.setState({
        baseFilters: this.state.baseFilters?.filter((filter) => filter.origin !== 'scope'),
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
      this._originalValues.set(scopeFilter.key, {
        value: scopeFilter.values ?? [scopeFilter.value],
        operator: scopeFilter.operator,
      });
    });

    this.state.baseFilters?.forEach((filter) => {
      if (filter.origin === 'scope') {
        scopeInjectedFilters.push(filter);
      } else {
        remainingFilters.push(filter);
      }
    });

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

    // maintain other baseFilters in the array, only update scopes ones
    this.setState({ baseFilters: [...finalFilters, ...remainingFilters] });
  }

  public setState(update: Partial<AdHocFiltersVariableState>): void {
    let filterExpressionChanged = false;

    if (
      ((update.filters && update.filters !== this.state.filters) ||
        (update.baseFilters && update.baseFilters !== this.state.baseFilters)) &&
      !update.filterExpression
    ) {
      const filters = update.filters ?? this.state.filters;
      const baseFilters = update.baseFilters ?? this.state.baseFilters;

      update.filterExpression = renderExpression(this.state.expressionBuilder, [
        ...(baseFilters?.filter((filter) => filter.origin) ?? []),
        ...(filters ?? []),
      ]);
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
        ...(this.state.baseFilters?.filter((filter) => filter.origin) ?? []),
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
      const originalFilter = this._originalValues.get(filter.key);

      original.value = originalFilter?.value[0];
      original.values = originalFilter?.value;
      // we don't care much about the labels in this injected filters scenario
      // but this is needed to rerender the filter with the proper values
      // in the UI. E.g.: in a multi-value on hover, it shows the correct values
      original.valueLabels = originalFilter?.value;
      original.operator = originalFilter?.operator;
    }

    this._updateFilter(filter, original);
  }

  public getValue(): VariableValue | undefined {
    return this.state.filterExpression;
  }

  public _updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>) {
    const { baseFilters, filters, _wip } = this.state;

    if (filter.origin) {
      const originalValues = this._originalValues.get(filter.key);
      const updateValues = update.values || (update.value ? [update.value] : undefined);

      // if we don't have the restorable prop set but values differ we set it true
      // this happens when editing the value of an injected filter
      // we also make sure to set restorable false if values are the same as original
      // e.g.: if we edit the value of a filter to whatever the original was, manually
      // 'restoring' the filter
      const isRestorableOverride = update.hasOwnProperty('restorable');
      if (
        !isRestorableOverride &&
        ((updateValues && !isEqual(updateValues, originalValues?.value)) ||
          (update.operator && update.operator !== originalValues?.operator))
      ) {
        update.restorable = true;
      } else if (updateValues && isEqual(updateValues, originalValues?.value)) {
        update.restorable = false;
      }

      const updatedBaseFilters =
        baseFilters?.map((f) => {
          return f === filter ? { ...f, ...update } : f;
        }) ?? [];
      this.setState({ baseFilters: updatedBaseFilters });

      return;
    }

    if (filter === _wip) {
      // If we set value we are done with this "work in progress" filter and we can add it
      if ('value' in update && update['value'] !== '') {
        this.setState({ filters: [...filters, { ..._wip, ...update }], _wip: undefined });
      } else {
        this.setState({ _wip: { ...filter, ...update } });
      }
      return;
    }

    const updatedFilters = this.state.filters.map((f) => {
      return f === filter ? { ...f, ...update } : f;
    });

    this.setState({ filters: updatedFilters });
  }

  public updateToMatchAll(filter: AdHocFilterWithLabels) {
    this._updateFilter(filter, {
      operator: '=~',
      value: '.*',
      values: ['.*'],
      valueLabels: ['All'],
      matchAllFilter: true,
      restorable: true,
    });
  }

  public _removeFilter(filter: AdHocFilterWithLabels) {
    if (filter === this.state._wip) {
      this.setState({ _wip: undefined });
      return;
    }

    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
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
    } else if (this.state.baseFilters?.length) {
      // default forceEdit last filter (when triggering from wip filter)
      let filterToForceIndex = this.state.baseFilters.length - 1;

      // adjust filterToForceIndex index to -1 if backspace triggered from non wip filter
      //  to avoid triggering forceEdit logic
      if (filter !== this.state._wip) {
        filterToForceIndex = -1;
      }

      this.setState({
        baseFilters: this.state.baseFilters.reduce<AdHocFilterWithLabels[]>((acc, f, index) => {
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

    const otherFilters = this.state.filters.filter((f) => f.key !== currentKey).concat(this.state.baseFilters ?? []);
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

    const filteredBaseFilters = this.state.baseFilters?.filter((f) => f.origin && f.key !== filter.key) ?? [];
    // Filter out the current filter key from the list of all filters
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat(filteredBaseFilters);

    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this.state.useQueriesAsFilterForOptions ? getQueriesForVariables(this) : undefined;

    let scopes = sceneGraph.getScopes(this);

    // if current filter is a scope injected one we need to filter out
    // filters with same key in scopes prop, similar to how we do in adhocFilters prop
    if (filter.origin === 'scope') {
      scopes = scopes?.map((scope) => {
        return {
          ...scope,
          spec: {
            ...scope.spec,
            filters: scope.spec.filters.filter((f) => f.key !== filter.key),
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
  return (builder ?? renderPrometheusLabelFilters)(filters ?? []);
}

export function AdHocFiltersVariableRenderer({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters, readOnly, addFilterButtonText } = model.useState();
  const styles = useStyles2(getStyles);

  if (model.state.layout === 'combobox') {
    return <AdHocFiltersComboboxRenderer model={model} />;
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

export function isMultiValueOperator(operatorValue: string): boolean {
  const operator = OPERATORS.find((o) => o.value === operatorValue);
  if (!operator) {
    // default to false if operator is not found
    return false;
  }
  return Boolean(operator.isMulti);
}

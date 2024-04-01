import React from 'react';
import { AdHocVariableFilter, GrafanaTheme2, MetricFindValue, SelectableValue } from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { ControlsLayout, SceneComponentProps } from '../../core/types';
import { DataSourceRef } from '@grafana/schema';
import { renderPrometheusLabelFilters } from '../utils';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { useStyles2 } from '@grafana/ui';
import { sceneGraph } from '../../core/sceneGraph';
import { DataQueryExtended, SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersVariableUrlSyncHandler } from './AdHocFiltersVariableUrlSyncHandler';
import { css } from '@emotion/css';

export interface AdHocFiltersVariableState extends SceneVariableState {
  /** Optional text to display on the 'add filter' button */
  addFilterButtonText?: string;
  /** The visible filters */
  filters: AdHocVariableFilter[];
  /** Base filters to always apply when looking up keys*/
  baseFilters?: AdHocVariableFilter[];
  /** Datasource to use for getTagKeys and getTagValues and also controls which scene queries the filters should apply to */
  datasource: DataSourceRef | null;
  /** Controls if the filters can be changed */
  readOnly?: boolean;
  /**
   * @experimental
   * Controls the layout and design of the label.
   * Vertical layout does not yet support operator selector.
   */
  layout?: ControlsLayout;
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
  expressionBuilder?: (filters: AdHocVariableFilter[]) => string;

  /**
   * @internal state of the new filter being added
   */
  _wip?: AdHocVariableFilter;
}

export type getTagKeysProvider = (
  variable: AdHocFiltersVariable,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export type getTagValuesProvider = (
  variable: AdHocFiltersVariable,
  filter: AdHocVariableFilter
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export type AdHocFiltersVariableCreateHelperArgs = AdHocFiltersVariableState;

export class AdHocFiltersVariable
  extends SceneObjectBase<AdHocFiltersVariableState>
  implements SceneVariable<AdHocFiltersVariableState>
{
  static Component = AdHocFiltersVariableRenderer;

  private _scopedVars = { __sceneObject: { value: this } };
  private _dataSourceSrv = getDataSourceSrv();

  protected _urlSync = new AdHocFiltersVariableUrlSyncHandler(this);

  public constructor(state: Partial<AdHocFiltersVariableState>) {
    super({
      type: 'adhoc',
      name: state.name ?? 'Filters',
      filters: [],
      datasource: null,
      applyMode: 'auto',
      filterExpression: state.filterExpression ?? renderExpression(state),
      ...state,
    });

    if (this.state.applyMode === 'auto') {
      patchGetAdhocFilters(this);
    }

    // Subscribe to filter changes and up the variable value (filterExpression)
    this.addActivationHandler(() => {
      this._subs.add(
        this.subscribeToState((newState, prevState) => {
          if (newState.filters !== prevState.filters) {
            this._updateFilterExpression(newState, true);
          }
        })
      );

      this._updateFilterExpression(this.state, false);
    });
  }

  public getValue(): VariableValue | undefined {
    return this.state.filterExpression;
  }

  private _updateFilterExpression(state: Partial<AdHocFiltersVariableState>, publishEvent: boolean) {
    let expr = renderExpression(state);

    if (expr === this.state.filterExpression) {
      return;
    }

    this.setState({ filterExpression: expr });

    if (publishEvent) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  public _updateFilter(filter: AdHocVariableFilter, prop: keyof AdHocVariableFilter, value: string | undefined | null) {
    if (value == null) {
      return;
    }

    const { filters, _wip } = this.state;

    if (filter === _wip) {
      // If we set value we are done with this "work in progress" filter and we can add it
      if (prop === 'value') {
        this.setState({ filters: [...filters, { ..._wip, [prop]: value }], _wip: undefined });
      } else {
        this.setState({ _wip: { ...filter, [prop]: value } });
      }
      return;
    }

    const updatedFilters = this.state.filters.map((f) => {
      if (f === filter) {
        return { ...f, [prop]: value };
      }
      return f;
    });

    this.setState({ filters: updatedFilters });
  }

  public _removeFilter(filter: AdHocVariableFilter) {
    if (filter === this.state._wip) {
      this.setState({ _wip: undefined });
      return;
    }

    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public async _getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>> {
    const override = await this.state.getTagKeysProvider?.(this, currentKey);

    if (override && override.replace) {
      return override.values.map(toSelectableValue);
    }

    if (this.state.defaultKeys) {
      return this.state.defaultKeys.map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
      return [];
    }

    const otherFilters = this.state.filters.filter((f) => f.key !== currentKey).concat(this.state.baseFilters ?? []);
    const queries = this._getSceneQueries();
    // @ts-expect-error TODO: remove this once 10.4.0 is released
    let keys = await ds.getTagKeys({ filters: otherFilters, queries });

    if (override) {
      keys = keys.concat(override.values);
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
  public async _getValuesFor(filter: AdHocVariableFilter): Promise<Array<SelectableValue<string>>> {
    const override = await this.state.getTagValuesProvider?.(this, filter);

    if (override && override.replace) {
      return override.values.map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);

    if (!ds || !ds.getTagValues) {
      return [];
    }

    // Filter out the current filter key from the list of all filters
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat(this.state.baseFilters ?? []);

    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const queries = this._getSceneQueries();
    // @ts-expect-error TODO: remove this once 10.4.2 is released
    let values = await ds.getTagValues({ key: filter.key, filters: otherFilters, timeRange, queries });

    if (override) {
      values = values.concat(override.values);
    }

    return values.map(toSelectableValue);
  }

  public _addWip() {
    this.setState({ _wip: { key: '', value: '', operator: '=', condition: '' } });
  }

  public _getOperators() {
    return ['=', '!=', '<', '>', '=~', '!~'].map<SelectableValue<string>>((value) => ({
      label: value,
      value,
    }));
  }

  /**
   * Get all queries in the scene that have the same datasource as this AdHocFilterSet
   */
  private _getSceneQueries(): DataQueryExtended[] {
    const runners = sceneGraph.findAllObjects(
      this.getRoot(),
      (o) => o instanceof SceneQueryRunner
    ) as SceneQueryRunner[];

    const applicableRunners = runners.filter((r) => r.state.datasource?.uid === this.state.datasource?.uid);

    if (applicableRunners.length === 0) {
      return [];
    }

    const result: DataQueryExtended[] = [];
    applicableRunners.forEach((r) => {
      result.push(...r.state.queries);
    });

    return result;
  }
}

function renderExpression(state: Partial<AdHocFiltersVariableState>) {
  return (state.expressionBuilder ?? renderPrometheusLabelFilters)(state.filters ?? []);
}

export function AdHocFiltersVariableRenderer({ model }: SceneComponentProps<AdHocFiltersVariable>) {
  const { filters, readOnly, addFilterButtonText } = model.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      {filters.map((filter, index) => (
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
    gap: theme.spacing(2),
    alignItems: 'flex-end',
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    paddingRight: theme.spacing(0.5),
  }),
});

export function toSelectableValue({ text, value }: MetricFindValue): SelectableValue<string> {
  return {
    label: text,
    value: String(value ?? text),
  };
}

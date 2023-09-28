import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  AdHocVariableFilter,
  DataSourceInstanceSettings,
  GrafanaTheme2,
  MetricFindValue,
  SelectableValue,
} from '@grafana/data';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneComponentProps, SceneObject, SceneObjectState, SceneObjectUrlSyncHandler } from '../../core/types';
import { AdHocFiltersVariableUrlSyncHandler } from './AdHocFiltersVariableUrlSyncHandler';
import { useStyles2 } from '@grafana/ui';
import React from 'react';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { AdHocFilterRenderer } from './AdHocFilterRenderer';
import { AdHocFilterBuilder } from './AdHocFilterBuilder';
import { css } from '@emotion/css';

export interface AdHocFilterSetState extends SceneObjectState {
  /** Defaults to Filters */
  name?: string;
  /** The visible filters */
  filters: AdHocVariableFilter[];
  /** Base filters to always apply when looking up keys*/
  baseFilters?: AdHocVariableFilter[];
  /** Datasource to use for getTagKeys and getTagValues and also controls which scene queries the filters should apply to */
  datasource: DataSourceRef | null;
  /** Controls if the filters can be changed */
  readOnly?: boolean;
  /**
   * Defaults to same-datasource which means filters will automatically be applied to all queries with the same data source as this AdHocFilterSet.
   * In manual mode no queries are rerun on changes and you have to manual apply the filter to what ever queries you want.
   */
  applyMode?: 'same-datasource' | 'manual';
  /**
   * Extension hook for customizing the key lookup.
   * Return replace: true if you want to override the default lookup and
   * Return replace: false will just combine the results.
   */
  getTagKeysProvider?: getTagKeysProvider;
  /**
   * Extension hook for customizing the value lookup.
   * Return replace: true if you want to override the default lookup.
   * Return replace: false to combine the results.
   */
  getTagValuesProvider?: getTagValuesProvider;

  /**
   * @internal state of the new filter being added
   */
  _wip?: AdHocVariableFilter;
}

export type getTagKeysProvider = (
  set: AdHocFilterSet,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export type getTagValuesProvider = (
  set: AdHocFilterSet,
  filter: AdHocVariableFilter
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export class AdHocFilterSet extends SceneObjectBase<AdHocFilterSetState> {
  static Component = AdHocFiltersSetRenderer;

  protected _urlSync: SceneObjectUrlSyncHandler = new AdHocFiltersVariableUrlSyncHandler(this);

  private _scopedVars = { __sceneObject: { value: this } };
  private _dataSourceSrv = getDataSourceSrv();

  public constructor(initialState: Partial<AdHocFilterSetState>) {
    super({
      name: 'Filters',
      filters: [],
      baseFilters: [],
      datasource: null,
      applyMode: 'same-datasource',
      ...initialState,
    });

    if (this.state.applyMode === 'same-datasource') {
      patchGetAdhocFilters(this);
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
        this._runSceneQueries();
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

    this.updateFilters(updatedFilters);
  }

  public _removeFilter(filter: AdHocVariableFilter) {
    if (filter === this.state._wip) {
      this.setState({ _wip: undefined });
      return;
    }

    this.updateFilters(this.state.filters.filter((f) => f !== filter));
  }

  public updateFilters(filters: AdHocVariableFilter[]) {
    this.setState({ filters });
    this._runSceneQueries();
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public async _getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>> {
    const override = await this.state.getTagKeysProvider?.(this, currentKey);

    if (override && override.replace) {
      return override.values.map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
      return [];
    }

    const otherFilters = this.state.filters.filter((f) => f.key !== currentKey).concat(this.state.baseFilters!);
    let keys = await ds.getTagKeys({ filters: otherFilters });

    if (override) {
      keys = keys.concat(override.values);
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
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat(this.state.baseFilters!);
    let values = await ds.getTagValues({ key: filter.key, filters: otherFilters });

    if (override) {
      values = values.concat(override.values);
    }

    return values.map(toSelectableValue);
  }

  public _addWip() {
    this.setState({ _wip: { key: '', value: '', operator: '=' } });
  }

  public _getOperators() {
    return ['=', '!=', '<', '>', '=~', '!~'].map<SelectableValue<string>>((value) => ({
      label: value,
      value,
    }));
  }

  private _runSceneQueries() {
    // In manual mode we do not trigger any queries
    if (this.state.applyMode === 'manual') {
      return;
    }

    const startingPoint = this.parent;
    if (!startingPoint) {
      console.error('AdHocFiltersVariable could not find a parent scene to broadcast changes to');
      return;
    }

    const ourDS = this._dataSourceSrv.getInstanceSettings(this.state.datasource, this._scopedVars);
    if (!ourDS) {
      console.error('AdHocFiltersVariable ds not found', this.state.datasource);
      return;
    }

    const triggerQueriesRecursive = (startingPoint: SceneObject) => {
      if (startingPoint instanceof SceneQueryRunner && this._isSameDS(ourDS, startingPoint.state.datasource)) {
        startingPoint.runQueries();
      } else {
        startingPoint.forEachChild(triggerQueriesRecursive);
      }
    };

    triggerQueriesRecursive(startingPoint);
  }

  private _isSameDS(ourDS: DataSourceInstanceSettings, queryRunnerDS: DataSourceRef | null | undefined) {
    // This function does some initial checks to try to avoid haing to call _dataSourceSrv.getInstanceSettings
    // Which is only needed when queryRunner is using data source variable but the adhoc filter is not

    if (this.state.datasource === queryRunnerDS) {
      return true;
    }

    // This works when both are using a variable as well
    if (this.state.datasource?.uid === queryRunnerDS?.uid) {
      return true;
    }

    // Finally the fool proof check that works when either we or the query runner is using a variable ds
    const resolved = this._dataSourceSrv.getInstanceSettings(queryRunnerDS, this._scopedVars);
    return ourDS?.uid === resolved?.uid;
  }
}

export function AdHocFiltersSetRenderer({ model }: SceneComponentProps<AdHocFilterSet>) {
  const { filters, readOnly } = model.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      <ControlsLabel label="Filters" icon="filter" />

      {filters.map((filter, index) => (
        <React.Fragment key={index}>
          <AdHocFilterRenderer filter={filter} model={model} />
        </React.Fragment>
      ))}

      {!readOnly && <AdHocFilterBuilder model={model} key="'builder" />}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  filterIcon: css({
    color: theme.colors.text.secondary,
    paddingRight: theme.spacing(0.5),
  }),
});

function toSelectableValue({ text, value }: MetricFindValue): SelectableValue<string> {
  return {
    label: text,
    value: String(value ?? text),
  };
}

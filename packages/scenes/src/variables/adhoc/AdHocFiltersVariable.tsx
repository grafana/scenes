import { SceneVariableState } from '../types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter, DataSourceInstanceSettings, SelectableValue, VariableHide } from '@grafana/data';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersUI } from './AdHocFiltersUI';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneObject, SceneObjectUrlSyncHandler } from '../../core/types';
import { AdHocFiltersVariableUrlSyncHandler } from './AdHocFiltersVariableUrlSyncHandler';

export interface AdHocFiltersVariableState extends SceneVariableState {
  filters: AdHocVariableFilter[];
  baseFilters: AdHocVariableFilter[];
  datasource: DataSourceRef | null;
  readOnly?: boolean;
  /**
   * If you want to use the adhoc filter in queries and control how it's applied manually like a normal template variable then you
   * need to set this property.
   */
  expressionRenderer?: (filters: AdHocVariableFilter[]) => string;
  /** New filter being added */
  _wip?: AdHocVariableFilter;
}

export class AdHocFiltersVariable extends SceneObjectBase<AdHocFiltersVariableState> {
  static Component = AdHocFiltersUI;

  protected _urlSync: SceneObjectUrlSyncHandler = new AdHocFiltersVariableUrlSyncHandler(this);

  private _scopedVars = { __sceneObject: { value: this } };
  private _dataSourceSrv = getDataSourceSrv();

  public constructor(initialState: Partial<AdHocFiltersVariableState>) {
    super({
      type: 'adhoc',
      name: '',
      filters: [],
      baseFilters: [],
      datasource: null,
      hide: VariableHide.hideLabel,

      ...initialState,
    });

    this.addActivationHandler(() => {
      patchGetAdhocFilters(this.parent! as SceneVariableSet);
    });
  }

  public getValue() {
    return 'NA';
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
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
      return [];
    }

    const otherFilters = this.state.filters.filter((f) => f.key !== currentKey).concat(this.state.baseFilters);
    const metrics = await ds.getTagKeys({ filters: otherFilters });
    return metrics.map((m) => ({ label: m.text, value: m.text }));
  }

  /**
   * Get possible key values for a specific key given current filters. Do not call from plugins directly
   */
  public async _getValuesFor(filter: AdHocVariableFilter): Promise<Array<SelectableValue<string>>> {
    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);

    if (!ds || !ds.getTagValues) {
      return [];
    }

    // Filter out the current filter key from the list of all filters
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat(this.state.baseFilters);
    const metrics = await ds.getTagValues({ key: filter.key, filters: otherFilters });
    return metrics.map((m) => ({ label: m.text, value: m.text }));
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
    const startingPoint = this.parent?.parent;
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

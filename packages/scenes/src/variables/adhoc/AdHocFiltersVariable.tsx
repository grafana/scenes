import { SceneVariableState } from '../types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter, SelectableValue, VariableHide } from '@grafana/data';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersUI } from './AdHocFiltersUI';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneObject } from '../../core/types';

export interface AdHocFiltersVariableState extends SceneVariableState {
  filters: AdHocVariableFilter[];
  baseFilters: AdHocVariableFilter[];
  datasource: DataSourceRef | null;
  readOnly?: boolean;
  /** New filter being added */
  _wip?: AdHocVariableFilter;
}

export class AdHocFiltersVariable extends SceneObjectBase<AdHocFiltersVariableState> {
  static Component = AdHocFiltersUI;

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

    this.setState({ filters: updatedFilters });
    this._runSceneQueries();
  }

  public _removeFilter(filter: AdHocVariableFilter) {
    if (filter === this.state._wip) {
      this.setState({ _wip: undefined });
      return;
    }

    this.setState({ filters: this.state.filters.filter((f) => f !== filter) });
    this._runSceneQueries();
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public async _getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>> {
    const ds = await getDataSourceSrv().get(this.state.datasource);
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
    const ds = await getDataSourceSrv().get(this.state.datasource);

    if (!ds || !ds.getTagValues) {
      return [];
    }

    // Filter out the current filter key from the list of all filters
    const otherFilters = this.state.filters.filter((f) => f.key !== filter.key).concat(this.state.baseFilters);
    const metrics = await ds.getTagValues({ key: filter.key, filters: otherFilters });
    return metrics.map((m) => ({ label: m.text, value: m.text }));
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

  private _runSceneQueries() {
    const startingPoint = this.parent?.parent;
    if (!startingPoint) {
      console.error('AdHocFiltersVariable could not find a parent scene to broadcast changes to');
      return;
    }

    const triggerQueriesRecursive = (startingPoint: SceneObject) => {
      if (startingPoint instanceof SceneQueryRunner) {
        startingPoint.runQueries();
      } else {
        startingPoint.forEachChild(triggerQueriesRecursive);
      }
    };

    triggerQueriesRecursive(startingPoint);
  }
}

import { SceneVariableState } from '../types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter, SelectableValue } from '@grafana/data';
import { patchGetAdhocVariables } from './patchGetAdhocVariables';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { AdHocFiltersUI } from './AdHocFiltersUI';

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
      ...initialState,
    });

    this.addActivationHandler(() => {
      patchGetAdhocVariables(this.parent! as SceneVariableSet);
    });
  }

  public getValue() {
    return 'NA';
  }

  public _updateFilter(filter: AdHocVariableFilter, prop: keyof AdHocVariableFilter, value: string | undefined | null) {
    if (value == null) {
      return;
    }

    if (filter === this.state._wip) {
      this.setState({ _wip: { ...filter, [prop]: value } });
    } else {
      const updatedFilters = this.state.filters.map((f) => {
        if (f === filter) {
          return { ...f, [prop]: value };
        }
        return f;
      });
      this.setState({ filters: updatedFilters });
    }
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

  public _addWip(key: string | null | undefined) {
    if (key != null) {
      this.setState({ _wip: { key, value: '', operator: '=', condition: '' } });
    }
  }
}

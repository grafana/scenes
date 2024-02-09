import { AdHocVariableFilter, DataSourceApi, MetricFindValue } from '@grafana/data';
import { allActiveGroupByVariables } from './findActiveGroupByVariablesByUid';
import { DataSourceRef, VariableType } from '@grafana/schema';
import { SceneComponentProps, ControlsLayout } from '../../core/types';
import { DataQueryExtended, SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { sceneGraph } from '../../core/sceneGraph';
import { ValidateAndUpdateResult, VariableValueOption } from '../types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../variants/MultiValueVariable';
import { from, map, mergeMap, Observable, of, take } from 'rxjs';
import { getDataSource } from '../../utils/getDataSource';
import { renderSelectForVariable } from '../components/VariableValueSelect';

export interface GroupByVariableState extends MultiValueVariableState {
  /** Defaults to "Group" */
  name: string;
  /** The visible keys to group on */
  // TODO review this type and name (naming is hard)
  defaultOptions?: MetricFindValue[];
  /** Base filters to always apply when looking up keys */
  baseFilters?: AdHocVariableFilter[];
  /** Datasource to use for getTagKeys and also controls which scene queries the group by should apply to */
  datasource: DataSourceRef | null;
  /** Controls if the group by can be changed */
  readOnly?: boolean;
  /**
   * @experimental
   * Controls the layout and design of the label.
   * Vertical layout does not yet support operator selector.
   */
  layout?: ControlsLayout;
  /**
   * Defaults to same-datasource which means group by will automatically be applied to all queries with the same data source as this GroupBySet.
   * In manual mode no queries are re-run on changes, and you have to manually apply the filter to whatever queries you want.
   */
  applyMode?: 'auto' | 'manual';
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
}

export type getTagKeysProvider = (
  set: GroupByVariable,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export class GroupByVariable extends MultiValueVariable<GroupByVariableState> {
  static Component = GroupByVariableRenderer;

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    return this.getValueOptions({}).pipe(
      map((options) => {
        this._updateValueGivenNewOptions(options);
        return {};
      })
    );
  }

  private _updateValueGivenNewOptions(options: VariableValueOption[]) {
    const { value: currentValue, text: currentText } = this.state;

    const stateUpdate: Partial<MultiValueVariableState> = {
      options,
      loading: false,
      value: currentValue ?? [],
      text: currentText ?? [],
    };

    this.setState(stateUpdate);
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    // When default dimensions are provided, return the static list
    if (this.state.defaultOptions) {
      return of(
        this.state.defaultOptions.map((o) => ({
          label: o.text,
          value: String(o.value),
        }))
      );
    }

    this.setState({ loading: true, error: null });

    return from(
      getDataSource(this.state.datasource, {
        __sceneObject: { text: '__sceneObject', value: this },
      })
    ).pipe(
      mergeMap((ds) => {
        return from(this._getKeys(ds)).pipe(
          take(1),
          mergeMap((data: MetricFindValue[]) => {
            const a: VariableValueOption[] = data.map((i) => {
              return {
                label: i.text,
                value: i.value ? String(i.value) : i.text,
              };
            });
            return of(a);
          })
        );
      })
    );
  }

  public constructor(initialState: Partial<GroupByVariableState>) {
    super({
      isMulti: true,
      name: '',
      value: [],
      text: [],
      options: [],
      datasource: null,
      baseFilters: [],
      applyMode: 'auto',
      layout: 'horizontal',
      type: 'groupby' as VariableType,
      ...initialState,
      noValueOnClear: true,
    });

    this.addActivationHandler(() => {
      allActiveGroupByVariables.add(this);

      return () => allActiveGroupByVariables.delete(this);
    });
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public _getKeys = async (ds: DataSourceApi) => {
    // TODO:  provide current dimensions?
    const override = await this.state.getTagKeysProvider?.(this, null);

    if (override && override.replace) {
      return override.values;
    }

    if (this.state.defaultOptions) {
      return this.state.defaultOptions.concat(override?.values ?? []);
    }

    if (!ds.getTagKeys) {
      return [];
    }

    const queries = this._getSceneQueries();
    const otherFilters = this.state.baseFilters;
    let keys = await ds.getTagKeys({ filters: otherFilters, queries });

    if (override) {
      keys = keys.concat(override.values);
    }

    const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
    if (tagKeyRegexFilter) {
      keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
    }

    return keys;
  };

  /**
   * Allows clearing the value of the variable to an empty value. Overrides default behavior of a MultiValueVariable
   */
  public getDefaultMultiState(options: VariableValueOption[]) {
    return { value: [], text: [] };
  }

  /**
   * Get all queries in the scene that have the same datasource as this AggregationsSet
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

export function GroupByVariableRenderer({ model }: SceneComponentProps<MultiValueVariable>) {
  return renderSelectForVariable(model);
}

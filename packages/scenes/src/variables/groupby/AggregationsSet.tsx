import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter, GrafanaTheme2, MetricFindValue, SelectableValue } from '@grafana/data';
import { allActiveAggregationsSets } from './findActiveAggregationsSetByUid';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectState, ControlsLayout, SceneObjectUrlSyncHandler } from '../../core/types';
import { AsyncMultiSelect, useStyles2 } from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { css } from '@emotion/css';
import { AggregationsSetUrlSyncHandler } from './AggregationsSetUrlSyncHandler';
import { DataQueryExtended, SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { sceneGraph } from '../../core/sceneGraph';

export interface AggregationsSetState extends SceneObjectState {
  /** Defaults to "Group" */
  name?: string;
  /** The visible keys to group on */
  // TODO review this type
  dimensions: string[];
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
  applyMode?: 'same-datasource' | 'manual';
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
  set: AggregationsSet,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export class AggregationsSet extends SceneObjectBase<AggregationsSetState> {
  static Component = AggregationsSetRenderer;

  protected _urlSync: SceneObjectUrlSyncHandler = new AggregationsSetUrlSyncHandler(this);

  private _scopedVars = { __sceneObject: { value: this } };
  private _dataSourceSrv = getDataSourceSrv();

  public constructor(initialState: Partial<AggregationsSetState>) {
    super({
      name: 'Group',
      dimensions: [],
      baseFilters: [],
      datasource: null,
      applyMode: 'same-datasource',
      layout: 'horizontal',
      ...initialState,
    });

    this.addActivationHandler(() => {
      allActiveAggregationsSets.add(this);
      return () => allActiveAggregationsSets.delete(this);
    });
  }

  public _update = (newState: Array<SelectableValue<string>>) => {
    // TODO review this to see if we can remove the !
    this.setState({ dimensions: newState.map((x) => x.value!) });
  }

  public getSelectableValue = () => {
    return this.state.dimensions.map((x) => ({ value: x, label: x }));
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public _getKeys = async (currentKey: string | null): Promise<Array<SelectableValue<string>>> => {
    if (this.state.defaultOptions) {
      return this.state.defaultOptions.map(toSelectableValue);
    }

    const override = await this.state.getTagKeysProvider?.(this, currentKey);

    if (override && override.replace) {
      return override.values.map(toSelectableValue);
    }

    const ds = await this._dataSourceSrv.get(this.state.datasource, this._scopedVars);
    if (!ds || !ds.getTagKeys) {
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

    return keys.map(toSelectableValue);
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

export function AggregationsSetRenderer({ model }: SceneComponentProps<AggregationsSet>) {
  const { layout, name, key } = model.useState();
  const styles = useStyles2(getStyles);

  // To not trigger queries on every selection we store this state locally here and only update the variable onBlur
  const [uncommittedValue, setUncommittedValue] = useState<Array<SelectableValue<string>>>(model.getSelectableValue());

  // Detect value changes outside
  useEffect(() => {
    setUncommittedValue(model.getSelectableValue());
  }, [model]);

  return (
    <div className={styles.wrapper}>
      {layout !== 'vertical' && <ControlsLabel label={name ?? 'Group'} icon="filter" />}
      <AsyncMultiSelect<string>
        id={key}
        placeholder="Select value"
        width="auto"
        value={uncommittedValue}
        // TODO remove after grafana/ui upgrade to 10.3
        // @ts-expect-error
        noMultiValueWrap
        maxVisibleValues={5}
        tabSelectsValue={false}
        loadOptions={model._getKeys}
        closeMenuOnSelect={false}
        isClearable
        // onInputChange={onInputChange}
        onBlur={() => {
          model._update(uncommittedValue);
        }}
        // this retrieves the options on mount of the component
        // ideally we would retrieve these options on open of the dropdown
        // need to investigate why it doesn't work without setting defaultOptions
        // TODO refactor to remove defaultOptions
        defaultOptions
        onChange={setUncommittedValue}
      />
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

function toSelectableValue({ text, value }: MetricFindValue): SelectableValue<string> {
  return {
    label: text,
    value: String(value ?? text),
  };
}

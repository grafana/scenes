import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter, GrafanaTheme2, MetricFindValue, SelectableValue } from '@grafana/data';
import { allActiveAggregationSets } from './findActiveAggregationsSetByUid';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectState, ControlsLayout } from '../../core/types';
import { AsyncMultiSelect, useStyles2 } from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { css } from '@emotion/css';

export interface GroupBySetState extends SceneObjectState {
  /** Defaults to "Group by" */
  name?: string;
  /** The visible keys to group on */
  // TODO review this type
  groupBy: string[];
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
  set: GroupBySet,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] }>;

export class GroupBySet extends SceneObjectBase<GroupBySetState> {
  static Component = GroupBySetRenderer;

  // TODO we need to reimplement this
  // protected _urlSync: SceneObjectUrlSyncHandler = new AdHocFiltersVariableUrlSyncHandler(this);

  private _scopedVars = { __sceneObject: { value: this } };
  private _dataSourceSrv = getDataSourceSrv();

  public constructor(initialState: Partial<GroupBySetState>) {
    super({
      name: 'Group by',
      groupBy: [],
      baseFilters: [],
      datasource: null,
      applyMode: 'same-datasource',
      layout: 'horizontal',
      ...initialState,
    });

    this.addActivationHandler(() => {
      allActiveAggregationSets.add(this);
      return () => allActiveAggregationSets.delete(this);
    });
  }

  public _update = (newState: Array<SelectableValue<string>>) => {
    // TODO what do we do here?
    // this.state.groupBy = newState.map((x) => x.value!);
    console.log('updated!')
  }

  public getSelectableValue = () => {
    return this.state.groupBy.map((x) => ({ value: x, label: x }));
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

    // TODO need to pass the queries here as well as other filters to narrow the getTagKeys call
    const otherFilters = this.state.baseFilters;
    let keys = await ds.getTagKeys({ filters: otherFilters });

    if (override) {
      keys = keys.concat(override.values);
    }

    const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
    if (tagKeyRegexFilter) {
      keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
    }

    return keys.map(toSelectableValue);
  }
}

export function GroupBySetRenderer({ model }: SceneComponentProps<GroupBySet>) {
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
      {layout !== 'vertical' && <ControlsLabel label={name ?? 'Group by'} icon="filter" />}
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

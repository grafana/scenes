import { SceneObjectBase } from '../../core/SceneObjectBase';
import { AdHocVariableFilter, GrafanaTheme2, MetricFindValue, SelectableValue } from '@grafana/data';
import { patchGetAdhocFilters } from './patchGetAdhocFilters';
import { DataSourceRef } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectState, SceneObjectUrlSyncHandler, ControlsLayout } from '../../core/types';
import { AdHocFiltersVariableUrlSyncHandler } from './GroupByVariableUrlSyncHandler';
import { useStyles2 } from '@grafana/ui';
import React from 'react';
import { ControlsLabel } from '../../utils/ControlsLabel';
import { css } from '@emotion/css';
import { VariableValueSelectMulti } from '../components/VariableValueSelect';

export interface GroupBySetState extends SceneObjectState {
  /** Defaults to "Group by" */
  name?: string;
  /** The visible keys to group on */
  groupBy: string[];
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

  protected _urlSync: SceneObjectUrlSyncHandler = new AdHocFiltersVariableUrlSyncHandler(this);

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

    if (this.state.applyMode === 'same-datasource') {
      patchGetAdhocFilters(this);
    }
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
  const { layout, name } = model.useState();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      {layout !== 'vertical' && <ControlsLabel label={name ?? 'Group by'} icon="filter" />}
      <VariableValueSelectMulti model={model} />
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

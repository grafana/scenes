import React from 'react';
import { SceneVariableValueChangedEvent } from '../types';
import { GroupBySet, GroupBySetState } from './GroupBySet';
import { SceneComponentProps } from '../../core/types';
import { VariableHide } from '@grafana/schema';
import { MultiValueVariable, MultiValueVariableState } from '../variants/MultiValueVariable';

export interface GroupByVariableState extends MultiValueVariableState {
  /**
   * Important that you set applyFiltersTo: 'manual' when you create the set.
   */
  set: GroupBySet;
  /**
   * This is the expression that the groupby resulted in. Defaults to
   * Prometheus / Loki compatible label filter expression
   */
  groupByExpression?: string;
}

export type GroupByVariableCreateHelperArgs = Pick<
  GroupBySetState,
  'name' | 'groupBy' | 'baseFilters' | 'datasource' | 'tagKeyRegexFilter' | 'getTagKeysProvider' | 'name' | 'layout'
>;

export class GroupByVariable extends MultiValueVariable<GroupByVariableState> {
  /** Helper factory function that makes sure GroupBySet is created correctly  */
  public static create(state: GroupByVariableCreateHelperArgs): GroupByVariable {
    return new GroupByVariable({
      type: 'adhoc-group',
      hide: VariableHide.hideLabel,
      name: state.name ?? 'Filters',
      set: new GroupBySet({
        ...state,
        // Main reason for this helper factory function
        applyMode: 'manual',
      }),
    });
  }

  public constructor(state: GroupByVariableState) {
    super({
      ...state,
      groupByExpression: state.groupByExpression ?? renderGroupByExpression(state.set.state.groupBy),
    });

    // Subscribe to filter changes and up the variable value (filterExpression)
    this.addActivationHandler(() => {
      this._subs.add(
        this.state.set.subscribeToState((newState, prevState) => {
          if (newState.groupBy !== prevState.groupBy) {
            this._updateGroupByExpression(newState.groupBy, true);
          }
        })
      );

      this._updateGroupByExpression(this.state.set.state.groupBy, false);
    });
  }

  // TODO
  public getValueOptions() {

  }

  public getValue() {
    return this.state.groupByExpression;
  }

  private _updateGroupByExpression(groupBy: string[], publishEvent: boolean) {
    let expr = renderGroupByExpression(groupBy);

    if (expr === this.state.groupByExpression) {
      return;
    }

    this.setState({ groupByExpression: expr });

    if (publishEvent) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  public static Component = ({ model }: SceneComponentProps<GroupByVariable>) => {
    return <GroupBySet.Component model={model.state.set} />;
  };
}

// TODO what should this be?
function renderGroupByExpression(groupBy: string[]) {
  if (groupBy.length > 0) {
    return `(${groupBy.join(',')})`;
  }

  return '';
}

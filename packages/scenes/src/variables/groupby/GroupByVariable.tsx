import React from 'react';
import { AdHocVariableFilter } from '@grafana/data';
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
   * This is the expression that the filters resulted in. Defaults to
   * Prometheus / Loki compatible label filter expression
   */
  filterExpression?: string;
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
      filterExpression: state.filterExpression ?? renderFilters(state.set.state.filters),
    });

    // Subscribe to filter changes and up the variable value (filterExpression)
    this.addActivationHandler(() => {
      this._subs.add(
        this.state.set.subscribeToState((newState, prevState) => {
          if (newState.filters !== prevState.filters) {
            this._updateFilterExpression(newState.filters, true);
          }
        })
      );

      this._updateFilterExpression(this.state.set.state.filters, false);
    });
  }

  // TODO
  public getValueOptions() {

  }

  public getValue() {
    return this.state.filterExpression;
  }

  private _updateFilterExpression(filters: AdHocVariableFilter[], publishEvent: boolean) {
    let expr = renderFilters(filters);

    if (expr === this.state.filterExpression) {
      return;
    }

    this.setState({ filterExpression: expr });

    if (publishEvent) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  public static Component = ({ model }: SceneComponentProps<GroupByVariable>) => {
    return <GroupBySet.Component model={model.state.set} />;
  };
}

function renderFilters(filters: AdHocVariableFilter[]) {
  let expr = '';
  for (const filter of filters) {
    expr += `${renderFilter(filter)},`;
  }

  if (expr.length > 0) {
    expr = expr.slice(0, -1);
  }

  return expr;
}

function renderFilter(filter: AdHocVariableFilter) {
  let value = '';

  if (filter.operator === '=~' || filter.operator === '!~¨') {
    value = escapeLabelValueInRegexSelector(filter.value);
  } else {
    value = escapeLabelValueInExactSelector(filter.value);
  }

  return `${filter.key}${filter.operator}"${value}"`;
}

// based on the openmetrics-documentation, the 3 symbols we have to handle are:
// - \n ... the newline character
// - \  ... the backslash character
// - "  ... the double-quote character
export function escapeLabelValueInExactSelector(labelValue: string): string {
  return labelValue.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

export function escapeLabelValueInRegexSelector(labelValue: string): string {
  return escapeLabelValueInExactSelector(escapeLokiRegexp(labelValue));
}

// Loki regular-expressions use the RE2 syntax (https://github.com/google/re2/wiki/Syntax),
// so every character that matches something in that list has to be escaped.
// the list of meta characters is: *+?()|\.[]{}^$
// we make a javascript regular expression that matches those characters:
const RE2_METACHARACTERS = /[*+?()|\\.\[\]{}^$]/g;
function escapeLokiRegexp(value: string): string {
  return value.replace(RE2_METACHARACTERS, '\\$&');
}

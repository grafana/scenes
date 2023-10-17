import React from 'react';
import { AdHocVariableFilter } from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent } from '../types';
import { AdHocFilterSet, AdHocFilterSetState } from './AdHocFiltersSet';
import { SceneComponentProps } from '../../core/types';
import { VariableHide } from '@grafana/schema';

export interface AdHocFiltersVariableState extends SceneVariableState {
  /**
   * Important that you set applyFiltersTo: 'manual' when you create the set.
   */
  set: AdHocFilterSet;
  /**
   * This is the expression that the filters resulted in. Defaults to
   * Prometheus / Loki compatible label fitler expression
   */
  filterExpression?: string;
}

export type AdHocFiltersVariableCreateHelperArgs = Pick<
  AdHocFilterSetState,
  'name' | 'filters' | 'baseFilters' | 'datasource' | 'getTagKeysProvider' | 'getTagValuesProvider'
>;

export class AdHocFiltersVariable
  extends SceneObjectBase<AdHocFiltersVariableState>
  implements SceneVariable<AdHocFiltersVariableState>
{
  /** Helper factory function that makes sure AdHocFilterSet is created correctly  */
  public static create(state: AdHocFiltersVariableCreateHelperArgs): AdHocFiltersVariable {
    return new AdHocFiltersVariable({
      type: 'adhoc',
      hide: VariableHide.hideLabel,
      name: state.name ?? 'Filters',
      set: new AdHocFilterSet({
        ...state,
        // Main reason for this helper factory functyion
        applyMode: 'manual',
      }),
    });
  }

  public constructor(state: AdHocFiltersVariableState) {
    super(state);

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

  public getValue() {
    return this.state.filterExpression;
  }

  private _updateFilterExpression(filters: AdHocVariableFilter[], publishEvent: boolean) {
    let expr = '';

    for (const filter of filters) {
      expr += `${this._renderFilter(filter)},`;
    }

    if (expr.length > 0) {
      expr = expr.slice(0, -1);
    }

    if (expr === this.state.filterExpression) {
      return;
    }

    this.setState({ filterExpression: expr });
    if (publishEvent) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  private _renderFilter(filter: AdHocVariableFilter) {
    let value = '';

    if (filter.operator === '=~' || filter.operator === '!~¨') {
      value = escapeLabelValueInRegexSelector(filter.value);
    } else {
      value = escapeLabelValueInExactSelector(filter.value);
    }

    return `${filter.key}${filter.operator}"${value}"`;
  }

  // Same UI as the standalone AdHocFilterSet
  public static Component = ({ model }: SceneComponentProps<AdHocFiltersVariable>) => {
    return <AdHocFilterSet.Component model={model.state.set} />;
  };
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

export function isRegexSelector(selector?: string) {
  if (selector && (selector.includes('=~') || selector.includes('!~'))) {
    return true;
  }
  return false;
}

// Loki regular-expressions use the RE2 syntax (https://github.com/google/re2/wiki/Syntax),
// so every character that matches something in that list has to be escaped.
// the list of meta characters is: *+?()|\.[]{}^$
// we make a javascript regular expression that matches those characters:
const RE2_METACHARACTERS = /[*+?()|\\.\[\]{}^$]/g;
function escapeLokiRegexp(value: string): string {
  return value.replace(RE2_METACHARACTERS, '\\$&');
}

import React from 'react';
import { AdHocVariableFilter } from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent } from '../types';
import { AdHocFilterSet } from './AdHocFiltersSet';
import { SceneComponentProps } from '../../core/types';
import { VariableHide } from '@grafana/schema';

export interface AdHocFiltersVariableState extends SceneVariableState {
  set: AdHocFilterSet;
  /**
   * This is the expression that the filters resulted in. Defaults to
   * Prometheus / Loki compatible label fitler expression
   */
  filterExpression?: string;
}

export class AdHocFiltersVariable
  extends SceneObjectBase<AdHocFiltersVariableState>
  implements SceneVariable<AdHocFiltersVariableState>
{
  public constructor(state: Partial<AdHocFiltersVariableState>) {
    super({
      type: 'adhoc',
      hide: VariableHide.hideLabel,
      name: state.name ?? state.set?.state.name ?? 'Filters',
      set: state.set ?? new AdHocFilterSet({}),
      ...state,
    });

    // Subscribe to filter changes and up the variable value (filterExpression)
    this.addActivationHandler(() => {
      this._subs.add(
        this.state.set.subscribeToState((newState, prevState) => {
          if (newState.filters !== prevState.filters) {
            this._filtersChanged(newState.filters);
          }
        })
      );
      this._filtersChanged(this.state.set.state.filters);
    });
  }

  public getValue() {
    return this.state.filterExpression;
  }

  private _filtersChanged(filters: AdHocVariableFilter[]) {
    let expr = '';

    for (const filter of filters) {
      expr += `${this._renderFilter(filter)},`;
    }

    this.setState({ filterExpression: expr });
    this.publishEvent(new SceneVariableValueChangedEvent(this), true);
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

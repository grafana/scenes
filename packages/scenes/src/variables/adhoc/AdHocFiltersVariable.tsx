import React from 'react';
import { AdHocVariableFilter } from '@grafana/data';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneVariable, SceneVariableState, SceneVariableValueChangedEvent, VariableValue } from '../types';
import { AdHocFilterSet, AdHocFilterSetState } from './AdHocFiltersSet';
import { SceneComponentProps } from '../../core/types';
import { VariableHide } from '@grafana/schema';
import { renderPrometheusLabelFilters } from '../utils';

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
  | 'name'
  | 'filters'
  | 'baseFilters'
  | 'datasource'
  | 'tagKeyRegexFilter'
  | 'getTagKeysProvider'
  | 'getTagValuesProvider'
  | 'name'
  | 'layout'
  | 'applyMode'
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
        // The applyMode defaults to 'manual' when used through the variable as it is the most frecuent use case
        applyMode: 'manual',
        ...state,
      }),
    });
  }

  public constructor(state: AdHocFiltersVariableState) {
    super({
      ...state,
      filterExpression: state.filterExpression ?? renderPrometheusLabelFilters(state.set.state.filters),
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

  public getValue(): VariableValue | undefined {
    return this.state.filterExpression;
  }

  private _updateFilterExpression(filters: AdHocVariableFilter[], publishEvent: boolean) {
    let expr = renderPrometheusLabelFilters(filters);

    if (expr === this.state.filterExpression) {
      return;
    }

    this.setState({ filterExpression: expr });

    if (publishEvent) {
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }

  // Same UI as the standalone AdHocFilterSet
  public static Component = ({ model }: SceneComponentProps<AdHocFiltersVariable>) => {
    return <model.state.set.Component model={model.state.set} />;
  };
}

import { t } from '@grafana/i18n';
import { Observable, Subject } from 'rxjs';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';
import { queryMetricTree } from '../../utils/metricTree';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';
import { VariableRefresh } from '@grafana/data';
import { getClosest } from '../../core/sceneGraph/utils';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { SceneQueryControllerEntry } from '../../behaviors/types';
import React from 'react';

export interface TestVariableState extends MultiValueVariableState {
  query: string;
  delayMs?: number;
  issuedQuery?: string;
  refresh?: VariableRefresh;
  throwError?: string;
  optionsToReturn?: VariableValueOption[];
  updateOptions?: boolean;
}

/**
 * This variable is only designed for unit tests and potentially e2e tests.
 */
export class TestVariable extends MultiValueVariable<TestVariableState> {
  private completeUpdate = new Subject<number>();
  public isGettingValues = true;
  public getValueOptionsCount = 0;
  isLazy = false;

  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['query'],
  });

  public constructor(initialState: Partial<TestVariableState>, isLazy = false) {
    super({
      type: 'custom',
      name: 'Test',
      value: 'Value',
      text: t('grafana-scenes.variables.test-variable.text.text', 'Text'),
      query: 'Query',
      options: [],
      refresh: VariableRefresh.onDashboardLoad,
      updateOptions: true,
      ...initialState,
    });
    this.isLazy = isLazy;
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    const { delayMs } = this.state;

    this.getValueOptionsCount += 1;

    const queryController = sceneGraph.getQueryController(this);

    return new Observable<VariableValueOption[]>((observer) => {
      const queryEntry: SceneQueryControllerEntry = {
        type: 'variable',
        origin: this,
        cancel: () => observer.complete(),
      };

      if (queryController) {
        queryController.queryStarted(queryEntry);
      }

      this.setState({ loading: true });

      if (this.state.throwError) {
        throw new Error(this.state.throwError);
      }

      const interpolatedQuery = sceneGraph.interpolate(this, this.state.query);
      const options = this.getOptions(interpolatedQuery);

      const sub = this.completeUpdate.subscribe({
        next: () => {
          const newState: Partial<TestVariableState> = { issuedQuery: interpolatedQuery, loading: false };

          if (this.state.updateOptions) {
            newState.options = options;
          }

          this.setState(newState);
          observer.next(options);
          observer.complete();
        },
      });

      let timeout: number | undefined;
      if (delayMs) {
        timeout = window.setTimeout(() => this.signalUpdateCompleted(), delayMs);
      } else if (delayMs === 0) {
        this.signalUpdateCompleted();
      }

      this.isGettingValues = true;

      return () => {
        sub.unsubscribe();
        window.clearTimeout(timeout);
        this.isGettingValues = false;

        if (this.state.loading) {
          this.setState({ loading: false });
        }

        if (queryController) {
          queryController.queryCompleted(queryEntry);
        }
      };
    });
  }

  public cancel() {
    const sceneVarSet = getClosest(this, (s) => (s instanceof SceneVariableSet ? s : undefined));
    sceneVarSet?.cancel(this);
  }

  private getOptions(interpolatedQuery: string) {
    if (this.state.optionsToReturn) {
      return this.state.optionsToReturn;
    }

    return queryMetricTree(interpolatedQuery).map((x) => ({ label: x.name, value: x.name }));
  }

  /** Useful from tests */
  public signalUpdateCompleted() {
    this.completeUpdate.next(1);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}

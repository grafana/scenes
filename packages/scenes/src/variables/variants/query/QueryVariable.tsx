import { lastValueFrom, Observable, of } from 'rxjs';

import { VariableRefresh, VariableSort } from '@grafana/data';

import { SceneComponentProps, SceneDataQuery } from '../../../core/types';
import { VariableDependencyConfig } from '../../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../../components/VariableValueSelect';
import { VariableValueOption } from '../../types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../MultiValueVariable';

import { DataQuery, DataSourceRef } from '@grafana/schema';
import { debounce } from 'lodash';
import React from 'react';
import { SEARCH_FILTER_VARIABLE } from '../../constants';
import { safeStringifyValue } from '../../utils';
import { buildOptionsProvider, OptionsProviderSettings } from '../CustomOptionsProviders';

export interface QueryVariableState extends MultiValueVariableState {
  type: 'query';
  datasource: DataSourceRef | null;
  query: string | SceneDataQuery;
  regex: string;
  refresh: VariableRefresh;
  sort: VariableSort;

  // works the same as query for custom variable, adding additional static options to ones returned by data source query
  staticOptions?: VariableValueOption[];

  // how to order static options in relation to options returned by query
  staticOptionsOrder?: 'before' | 'after' | 'sorted';
  /** @internal Only for use inside core dashboards */
  definition?: string;
  optionsProvider: OptionsProviderSettings;
}

export class QueryVariable extends MultiValueVariable<QueryVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['regex', 'query', 'datasource'],
  });

  public constructor(initialState: Partial<QueryVariableState>) {
    super({
      type: 'query',
      name: '',
      value: '',
      text: '',
      options: [],
      datasource: null,
      regex: '',
      query: '',
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.disabled,
      ...initialState,
      optionsProvider: { ...initialState.optionsProvider, type: 'query' },
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    if (!this.state.query) {
      return of([]);
    }

    this.setState({ loading: true, error: null });

    return new Observable((subscriber) => {
      buildOptionsProvider(this as unknown as MultiValueVariable)
        .getOptions(args)
        .subscribe({
          next: (options) => {
            if (!options.length) {
              this.skipNextValidation = true;
            }
            this.setState({ loading: false });
            subscriber.next(options);
          },
          error: (error) => {
            this.setState({ loading: false, error });
            subscriber.error(error);
          },
          complete: () => {
            this.setState({ loading: false });
            subscriber.complete();
          },
        });
    });
  }

  onSearchChange = (searchFilter: string) => {
    if (!containsSearchFilter(this.state.query)) {
      return;
    }

    this._updateOptionsBasedOnSearchFilter(searchFilter);
  };

  private _updateOptionsBasedOnSearchFilter = debounce(async (searchFilter: string) => {
    const result = await lastValueFrom(this.getValueOptions({ searchFilter }));
    this.setState({ options: result, loading: false });
  }, 400);

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}

function containsSearchFilter(query: string | DataQuery) {
  const str = safeStringifyValue(query);
  return str.indexOf(SEARCH_FILTER_VARIABLE) > -1;
}

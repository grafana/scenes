import { t } from '@grafana/i18n';
import { Observable, from, of, tap } from 'rxjs';

import { stringToJsRegex } from '@grafana/data';
import { getDataSourceInstanceList, getDefaultDataSourceInstanceListItem } from '@grafana/plugin-compat/datasources';

import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps } from '../../core/types';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { MultiOrSingleValueSelect } from '../components/VariableValueSelect';
import { VariableValueOption } from '../types';

import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from './MultiValueVariable';
import React from 'react';

export interface DataSourceVariableState extends MultiValueVariableState {
  /**
   * Include all data source instances with this plugin id
   */
  pluginId: string;
  /**
   * Filter data source instances based on name
   */
  regex: string;
  /**
   * For backwards compatability with old dashboards, will likely be removed
   */
  defaultOptionEnabled?: boolean;
}

export class DataSourceVariable extends MultiValueVariable<DataSourceVariableState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['regex'],
  });

  public constructor(initialState: Partial<DataSourceVariableState>) {
    super({
      type: 'datasource',
      value: '',
      text: '',
      options: [],
      name: '',
      regex: '',
      pluginId: '',
      ...initialState,
    });
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    if (!this.state.pluginId) {
      return of([]);
    }

    return from(this.getOptions()).pipe(
      tap((options) => {
        if (options.length === 0) {
          this.setState({ error: 'No data sources found' });
        } else if (this.state.error) {
          this.setState({ error: null });
        }
      })
    );
  }

  private async getOptions(): Promise<VariableValueOption[]> {
    let regex;
    if (this.state.regex) {
      const interpolated = sceneGraph.interpolate(this, this.state.regex, undefined, 'regex');
      regex = stringToJsRegex(interpolated);
    }

    const dataSources = await getDataSourceInstanceList({
      metrics: true,
      variables: false,
      pluginId: this.state.pluginId,
    });

    const defaultDataSource = this.state.defaultOptionEnabled
      ? await getDefaultDataSourceInstanceListItem(dataSources)
      : undefined;

    const options: VariableValueOption[] = [];

    for (const source of dataSources) {
      if (isValid(source, regex)) {
        options.push({ label: source.name, value: source.uid });
      }

      if (defaultDataSource?.uid === source.uid && isDefaultValid(regex)) {
        options.push({
          label: t('grafana-scenes.variables.data-source-variable.label.default', 'default'),
          value: 'default',
        });
      }
    }

    return options;
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}

function isValid(source: { name: string }, regex?: RegExp) {
  if (!regex) {
    return true;
  }

  return regex.exec(source.name);
}

function isDefaultValid(regex?: RegExp) {
  if (!regex) {
    return true;
  }

  return regex.exec('default');
}

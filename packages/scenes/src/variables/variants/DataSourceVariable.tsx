import { t } from '@grafana/i18n';
import { Observable, of } from 'rxjs';

import { stringToJsRegex, DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

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

    const dataSources = getDataSourceSrv().getList({ metrics: true, variables: false, pluginId: this.state.pluginId });

    let regex;
    if (this.state.regex) {
      const interpolated = sceneGraph.interpolate(this, this.state.regex, undefined, 'regex');
      regex = stringToJsRegex(interpolated);
    }

    const options: VariableValueOption[] = [];

    for (let i = 0; i < dataSources.length; i++) {
      const source = dataSources[i];

      if (isValid(source, regex)) {
        options.push({ label: source.name, value: source.uid });
      }

      if (this.state.defaultOptionEnabled && isDefault(source, regex)) {
        options.push({
          label: t('grafana-scenes.variables.data-source-variable.label.default', 'default'),
          value: 'default',
        });
      }
    }

    if (options.length === 0) {
      this.setState({ error: 'No data sources found' });
    } else if (this.state.error) {
      this.setState({ error: null });
    }

    return of(options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    return <MultiOrSingleValueSelect model={model} />;
  };
}

function isValid(source: DataSourceInstanceSettings, regex?: RegExp) {
  if (!regex) {
    return true;
  }

  return regex.exec(source.name);
}

function isDefault(source: DataSourceInstanceSettings, regex?: RegExp) {
  if (!source.isDefault) {
    return false;
  }

  if (!regex) {
    return true;
  }

  return regex.exec('default');
}

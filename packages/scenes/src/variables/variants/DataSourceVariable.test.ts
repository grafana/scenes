import { lastValueFrom } from 'rxjs';

import { DataSourceInstanceSettings, ScopedVars, PluginType } from '@grafana/data';

import { SceneObject } from '../../core/types';

import { DataSourceVariable } from './DataSourceVariable';
import { VariableCustomFormatterFn } from '../types';

function getDataSource(name: string, type: string, isDefault = false): DataSourceInstanceSettings {
  return {
    id: 1,
    uid: 'c8eceabb-0275-4108-8f03-8f74faf4bf6d',
    type,
    name,
    meta: {
      id: type,
      name,
      type: PluginType.datasource,
      info: {
        author: { name: 'Grafana Labs' },
        description: 'Grafana Data Source',
        logos: {
          small: 'public/img/icn-datasource.svg',
          large: 'public/img/icn-datasource.svg',
        },
        links: [{ name: 'project', url: 'one link' }],
        screenshots: [{ path: `screenshot`, name: 'test' }],
        updated: '2018-09-26',
        version: '1',
      },
      module: 'path/to/module',
      baseUrl: 'path/to/plugin',
    },
    jsonData: {},
    access: 'proxy',
    readOnly: false,
    isDefault,
  };
}

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => ({
    getList: () => [
      getDataSource('prometheus-mocked', 'prometheus'),
      getDataSource('slow-prometheus-mocked', 'prometheus', true),
      getDataSource('elastic-mocked', 'elastic'),
    ],
  }),
}));

jest.mock('../../core/sceneGraph', () => {
  return {
    ...jest.requireActual('../../core/sceneGraph'),
    sceneGraph: {
      interpolate: (
        sceneObject: SceneObject,
        value: string | undefined | null,
        scopedVars?: ScopedVars,
        format?: string | VariableCustomFormatterFn
      ) => {
        return value?.replace('$variable-1', 'slow');
      },
    },
  };
});

describe('DataSourceVariable', () => {
  describe('When empty query is provided', () => {
    it('Should default to empty options and empty value', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: '',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([]);
    });
  });

  describe('When query is provided', () => {
    it('Should default to non datasources found options for invalid query', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: 'non-existant-datasource',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([
        {
          label: 'No data sources found',
          value: '',
        },
      ]);
    });

    it('Should default to first item datasource when options available', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: 'prometheus',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('prometheus-mocked');
      expect(variable.state.text).toEqual('prometheus-mocked');
      expect(variable.state.options).toEqual([
        {
          label: 'prometheus-mocked',
          value: 'prometheus-mocked',
        },
        {
          label: 'slow-prometheus-mocked',
          value: 'slow-prometheus-mocked',
        },
        {
          label: 'default',
          value: 'default',
        },
      ]);
    });

    it('Should generate correctly the options including only datasources with the queried type', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: 'prometheus',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('prometheus-mocked');
      expect(variable.state.text).toEqual('prometheus-mocked');
      expect(variable.state.options).toEqual([
        { label: 'prometheus-mocked', value: 'prometheus-mocked' },
        { label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked' },
        { label: 'default', value: 'default' },
      ]);
    });
  });

  describe('When regex is provided', () => {
    it('Should generate correctly the options including only datasources with matching', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: 'prometheus',
        regex: 'slow.*',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('slow-prometheus-mocked');
      expect(variable.state.text).toEqual('slow-prometheus-mocked');
      expect(variable.state.options).toEqual([{ label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked' }]);
    });

    it('Should generate correctly the options after interpolating variables', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: 'prometheus',
        regex: '$variable-1.*',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('slow-prometheus-mocked');
      expect(variable.state.text).toEqual('slow-prometheus-mocked');
      expect(variable.state.options).toEqual([{ label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked' }]);
    });
  });

  describe('When value is provided', () => {
    it('Should keep current value if current value is valid', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        pluginId: 'prometheus',
        value: 'slow-prometheus-mocked',
        text: 'slow-prometheus-mocked',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('slow-prometheus-mocked');
      expect(variable.state.text).toBe('slow-prometheus-mocked');
    });

    it('Should maintain the valid values when multiple selected', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        isMulti: true,
        pluginId: 'prometheus',
        value: ['prometheus-mocked', 'slow-prometheus-mocked', 'elastic-mocked'],
        text: ['prometheus-mocked', 'slow-prometheus-mocked', 'elastic-mocked'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['prometheus-mocked', 'slow-prometheus-mocked']);
      expect(variable.state.text).toEqual(['prometheus-mocked', 'slow-prometheus-mocked']);
    });

    it('Should pick first option if none of the current values are valid', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        isMulti: true,
        pluginId: 'elastic',
        value: ['prometheus-mocked', 'slow-prometheus-mocked'],
        text: ['prometheus-mocked', 'slow-prometheus-mocked'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['elastic-mocked']);
      expect(variable.state.text).toEqual(['elastic-mocked']);
    });
  });
});

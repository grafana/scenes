import { lastValueFrom } from 'rxjs';

import { DataSourceInstanceSettings, PluginType } from '@grafana/data';

import { SceneObject, SceneObjectState } from '../../core/types';

import { DataSourceVariable } from './DataSourceVariable';
import { DataSourceSrv, GetDataSourceListFilters, setDataSourceSrv } from '@grafana/runtime';
import { sceneGraph } from '../../core/sceneGraph';

function getDataSource(overrides: Partial<DataSourceInstanceSettings>): DataSourceInstanceSettings {
  return {
    id: 1,
    uid: '1',
    type: 'prometheus',
    name: 'name',
    meta: {
      id: 'prometheus',
      name: 'name',
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
    isDefault: false,
    ...overrides,
  };
}

const getDataSourceListMock = jest.fn().mockImplementation((filters: GetDataSourceListFilters) => {
  if (filters.pluginId === 'prometheus') {
    return [
      getDataSource({ name: 'prometheus-mocked', type: 'prometheus', uid: 'prometheus-mocked-uid' }),
      getDataSource({
        name: 'slow-prometheus-mocked',
        type: 'prometheus',
        uid: 'slow-prometheus-mocked-uid',
        isDefault: true,
      }),
    ];
  }

  if (filters.pluginId === 'elastic') {
    return [getDataSource({ name: 'elastic-mocked', type: 'elastic', uid: 'elastic-mocked-uid' })];
  }

  return [];
});

setDataSourceSrv({
  getList: getDataSourceListMock,
} as any as DataSourceSrv);

describe('DataSourceVariable', () => {
  beforeAll(() => {
    jest
      .spyOn(sceneGraph, 'interpolate')
      .mockImplementation((_sceneObject: SceneObject<SceneObjectState>, value: string | null | undefined) => {
        return value?.replace('$variable-1', 'slow') ?? '';
      });
  });

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
      expect(variable.state.error).toEqual('No data sources found');
    });

    it('Should add default as first item when defaultOptionEnabled is true', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        pluginId: 'prometheus',
        defaultOptionEnabled: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('prometheus-mocked-uid');
      expect(variable.state.text).toEqual('prometheus-mocked');
      expect(variable.state.options).toEqual([
        {
          label: 'prometheus-mocked',
          value: 'prometheus-mocked-uid',
        },
        {
          label: 'slow-prometheus-mocked',
          value: 'slow-prometheus-mocked-uid',
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

      expect(variable.state.value).toEqual('prometheus-mocked-uid');
      expect(variable.state.text).toEqual('prometheus-mocked');
      expect(variable.state.options).toEqual([
        { label: 'prometheus-mocked', value: 'prometheus-mocked-uid' },
        { label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked-uid' },
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

      expect(variable.state.value).toEqual('slow-prometheus-mocked-uid');
      expect(variable.state.text).toEqual('slow-prometheus-mocked');
      expect(variable.state.options).toEqual([
        { label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked-uid' },
      ]);
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

      expect(variable.state.value).toEqual('slow-prometheus-mocked-uid');
      expect(variable.state.text).toEqual('slow-prometheus-mocked');
      expect(variable.state.options).toEqual([
        { label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked-uid' },
      ]);
    });
  });

  describe('When value is provided', () => {
    it('Should keep current value if current value is valid', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        pluginId: 'prometheus',
        value: 'slow-prometheus-mocked-uid',
        text: 'slow-prometheus-mocked',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('slow-prometheus-mocked-uid');
      expect(variable.state.text).toBe('slow-prometheus-mocked');
    });

    it('Should maintain the valid values when multiple selected', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        isMulti: true,
        pluginId: 'prometheus',
        value: ['prometheus-mocked-uid', 'slow-prometheus-mocked-uid', 'elastic-mocked-uid'],
        text: ['prometheus-mocked', 'slow-prometheus-mocked', 'elastic-mocked'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['prometheus-mocked-uid', 'slow-prometheus-mocked-uid']);
      expect(variable.state.text).toEqual(['prometheus-mocked', 'slow-prometheus-mocked']);
    });

    it('Should pick first option if none of the current values are valid', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        options: [],
        isMulti: true,
        pluginId: 'elastic',
        value: ['prometheus-mocked-uid', 'slow-prometheus-mocked-uid'],
        text: ['prometheus-mocked', 'slow-prometheus-mocked'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['elastic-mocked-uid']);
      expect(variable.state.text).toEqual(['elastic-mocked']);
    });
  });
});

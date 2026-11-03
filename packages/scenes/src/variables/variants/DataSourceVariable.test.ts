import { lastValueFrom } from 'rxjs';

import { PluginType } from '@grafana/data';
import { getDataSourceInstanceList, getDefaultDataSourceInstanceListItem } from '@grafana/plugin-compat/datasources';

import { SceneObject, SceneObjectState } from '../../core/types';

import { DataSourceVariable } from './DataSourceVariable';
import { sceneGraph } from '../../core/sceneGraph';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  getDataSourceInstanceList: jest.fn(),
  getDefaultDataSourceInstanceListItem: jest.fn(),
}));

type DataSourceInstanceListItem = Awaited<ReturnType<typeof getDataSourceInstanceList>>[number];

const getDataSourceInstanceListMock = jest.mocked(getDataSourceInstanceList);
const getDefaultDataSourceInstanceListItemMock = jest.mocked(getDefaultDataSourceInstanceListItem);

function getDataSource(overrides: Partial<DataSourceInstanceListItem>): DataSourceInstanceListItem {
  return {
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
    ...overrides,
  };
}

const prometheus = getDataSource({ name: 'prometheus-mocked', type: 'prometheus', uid: 'prometheus-mocked-uid' });
const slowPrometheus = getDataSource({
  name: 'slow-prometheus-mocked',
  type: 'prometheus',
  uid: 'slow-prometheus-mocked-uid',
});
const elastic = getDataSource({ name: 'elastic-mocked', type: 'elastic', uid: 'elastic-mocked-uid' });

describe('DataSourceVariable', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getDataSourceInstanceListMock.mockImplementation(async (filters) => {
      if (filters?.pluginId === 'prometheus') {
        return [prometheus, slowPrometheus];
      }

      if (filters?.pluginId === 'elastic') {
        return [elastic];
      }

      return [];
    });

    getDefaultDataSourceInstanceListItemMock.mockImplementation(async (items) =>
      items.find((item) => item.uid === slowPrometheus.uid)
    );
  });

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

  describe('When resolving data sources', () => {
    it('Should request only metrics data sources of the plugin id without variables', async () => {
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'prometheus' });

      await lastValueFrom(variable.validateAndUpdate());

      expect(getDataSourceInstanceListMock).toHaveBeenCalledWith({
        metrics: true,
        variables: false,
        pluginId: 'prometheus',
      });
    });

    it('Should not look up the default data source when defaultOptionEnabled is not set', async () => {
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'prometheus' });

      await lastValueFrom(variable.validateAndUpdate());

      expect(getDefaultDataSourceInstanceListItemMock).not.toHaveBeenCalled();
    });

    it('Should add the default option right after the default data source', async () => {
      getDefaultDataSourceInstanceListItemMock.mockResolvedValue(prometheus);
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'prometheus', defaultOptionEnabled: true });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { label: 'prometheus-mocked', value: 'prometheus-mocked-uid' },
        { label: 'default', value: 'default' },
        { label: 'slow-prometheus-mocked', value: 'slow-prometheus-mocked-uid' },
      ]);
    });

    it('Should not add the default option when the default data source is not among the plugin id matches', async () => {
      getDefaultDataSourceInstanceListItemMock.mockResolvedValue(undefined);
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'elastic', defaultOptionEnabled: true });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([{ label: 'elastic-mocked', value: 'elastic-mocked-uid' }]);
    });

    it('Should pass the unfiltered list of the plugin id to the default lookup', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        pluginId: 'prometheus',
        regex: 'prometheus-mocked',
        defaultOptionEnabled: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(getDefaultDataSourceInstanceListItemMock).toHaveBeenCalledWith([prometheus, slowPrometheus]);
    });

    it('Should surface errors from listing data sources', async () => {
      getDataSourceInstanceListMock.mockRejectedValue(new Error('boom'));
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'prometheus' });

      await expect(lastValueFrom(variable.validateAndUpdate())).rejects.toThrow('boom');
    });

    it('Should not set the error when the request was unsubscribed before it resolved', async () => {
      let resolveList: (items: DataSourceInstanceListItem[]) => void = () => {};
      getDataSourceInstanceListMock.mockReturnValue(new Promise((resolve) => (resolveList = resolve)));
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'prometheus' });

      const subscription = variable.getValueOptions({}).subscribe();
      subscription.unsubscribe();
      resolveList([]);
      await Promise.resolve();

      expect(variable.state.error).toBeUndefined();
    });

    it('Should clear a previous error once data sources are found', async () => {
      const variable = new DataSourceVariable({ name: 'test', pluginId: 'prometheus', error: 'No data sources found' });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.error).toBeNull();
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

    it('Should match the regex against "default" independently of the default data source name', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        pluginId: 'prometheus',
        regex: '^default$',
        defaultOptionEnabled: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([{ label: 'default', value: 'default' }]);
    });

    it('Should not add the default option when the regex does not match "default"', async () => {
      const variable = new DataSourceVariable({
        name: 'test',
        pluginId: 'prometheus',
        regex: 'slow.*',
        defaultOptionEnabled: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

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

import React from 'react';
import { act, getAllByRole, render, waitFor, screen } from '@testing-library/react';
import { SceneVariableValueChangedEvent } from '../types';
import { AdHocFiltersVariable, AdHocFiltersVariableState } from './AdHocFiltersVariable';
import {
  DataSourceSrv,
  config,
  locationService,
  setDataSourceSrv,
  setRunRequest,
  setTemplateSrv,
} from '@grafana/runtime';
import {
  AdHocVariableFilter,
  DataQueryRequest,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
} from '@grafana/data';
import { Observable, of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexLayout, SceneFlexItem } from '../../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { select } from 'react-select-event';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { subscribeToStateUpdates } from '../../../utils/test/utils';
import { TestContextProvider } from '../../../utils/test/TestContextProvider';
import { FiltersRequestEnricher } from '../../core/types';

const templateSrv = {
  getAdhocFilters: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as any;

describe('templateSrv.getAdhocFilters patch ', () => {
  it('calls original when scene object is not active', async () => {
    const { unmount } = setup();
    unmount();

    const result = templateSrv.getAdhocFilters('name');
    expect(result[0].key).toBe('origKey');
  });
});

// 11.1.2 - will use SafeSerializableSceneObject
// 11.1.1 - will NOT use SafeSerializableSceneObject
describe.each(['11.1.2', '11.1.1'])('AdHocFiltersVariable', (v) => {
  beforeEach(() => {
    config.buildInfo.version = v;
  });
  it('renders filters', async () => {
    setup();
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.getByText('val1')).toBeInTheDocument();
    expect(screen.getByText('key2')).toBeInTheDocument();
    expect(screen.getByText('val2')).toBeInTheDocument();
  });

  it('adds filter', async () => {
    const { filtersVar } = setup();

    // Select key
    await userEvent.click(screen.getByTestId('AdHocFilter-add'));
    const wrapper = screen.getByTestId('AdHocFilter-');

    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[0], 'Key 3', { container: document.body }));
    await waitFor(() => select(selects[2], 'val3', { container: document.body }));

    expect(filtersVar.state.filters.length).toBe(3);
  });

  it('removes filter', async () => {
    const { filtersVar } = setup();

    await userEvent.click(screen.getByTestId('AdHocFilter-remove-key1'));

    expect(filtersVar.state.filters.length).toBe(1);
  });

  it('changes filter', async () => {
    const { filtersVar, runRequest } = setup();

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[2], 'val4', { container: document.body }));

    // should run new query when filter changed
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersVar.state.filters[0].value).toBe('val4');
  });

  it('clears the value of a filter if the key is changed', async () => {
    const { filtersVar } = setup();

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[0], 'Key 3', { container: document.body }));

    expect(filtersVar.state.filters[0].value).toBe('');
  });

  it('can set a custom value', async () => {
    const { filtersVar, runRequest } = setup();

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await userEvent.type(selects[2], 'myVeryCustomValue{enter}');

    // should run new query when filter changed
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersVar.state.filters[0].value).toBe('myVeryCustomValue');
  });

  it('shows key groups and orders according to first occurence of a group item', async () => {
    const { runRequest } = setup({
      getTagKeysProvider: async () => ({
        replace: true,
        values: [
          {
            text: 'Alice',
            value: 'alice',
            group: 'People',
          },
          {
            text: 'Bar',
            value: 'bar',
          },
          {
            text: 'Cat',
            value: 'cat',
            group: 'Animals',
          },
          {
            text: 'Bob',
            value: 'bob',
            group: 'People',
          },
          {
            text: 'Dog',
            value: 'dog',
            group: 'Animals',
          },
          {
            text: 'Foo',
            value: 'foo',
          },
        ],
      }),
    });

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await userEvent.click(selects[0]);

    // Check the group headers are visible
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Animals')).toBeInTheDocument();

    // Check the correct options exist
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(6);
    expect(options[0]).toHaveTextContent('Alice');
    expect(options[1]).toHaveTextContent('Bob');
    expect(options[2]).toHaveTextContent('Bar');
    expect(options[3]).toHaveTextContent('Cat');
    expect(options[4]).toHaveTextContent('Dog');
    expect(options[5]).toHaveTextContent('Foo');
  });

  it('shows value groups and orders according to first occurence of a group item', async () => {
    const { runRequest } = setup({
      getTagValuesProvider: async () => ({
        replace: true,
        values: [
          {
            text: 'Alice',
            value: 'alice',
            group: 'People',
          },
          {
            text: 'Bar',
            value: 'bar',
          },
          {
            text: 'Cat',
            value: 'cat',
            group: 'Animals',
          },
          {
            text: 'Bob',
            value: 'bob',
            group: 'People',
          },
          {
            text: 'Dog',
            value: 'dog',
            group: 'Animals',
          },
          {
            text: 'Foo',
            value: 'foo',
          },
        ],
      }),
    });

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await userEvent.click(selects[2]);

    // Check the group headers are visible
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Animals')).toBeInTheDocument();

    // Check the correct options exist
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(6);
    expect(options[0]).toHaveTextContent('Alice');
    expect(options[1]).toHaveTextContent('Bob');
    expect(options[2]).toHaveTextContent('Bar');
    expect(options[3]).toHaveTextContent('Cat');
    expect(options[4]).toHaveTextContent('Dog');
    expect(options[5]).toHaveTextContent('Foo');
  });

  it('can set the same custom value again', async () => {
    const { filtersVar, runRequest } = setup();

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await userEvent.type(selects[2], 'myVeryCustomValue{enter}');

    // should run new query when filter changed
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersVar.state.filters[0].value).toBe('myVeryCustomValue');

    await userEvent.click(selects[2]);
    await userEvent.clear(selects[2]);
    await userEvent.type(selects[2], 'myVeryCustomValue');

    expect(screen.getByText('Use custom value: myVeryCustomValue')).toBeInTheDocument();

    await userEvent.type(selects[2], '{enter}');

    // should not run a new query since the value is the same
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersVar.state.filters[0].value).toBe('myVeryCustomValue');
  });

  it('Can set a custom value before the list of values returns', async () => {
    let resolveCallback = (v: string) => {};
    const delayingPromise = new Promise<string>((resolve) => (resolveCallback = resolve));

    const { filtersVar, runRequest } = setup({
      getTagValuesProvider: async () => {
        await delayingPromise;
        return {
          replace: true,
          values: [{ text: 'Value 3', value: 'value3' }],
        };
      },
    });

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');
    await userEvent.type(selects[2], 'myVeryCustomValue');

    // resolve the delaying promise
    act(() => resolveCallback(''));

    await userEvent.type(selects[2], '{enter}');

    // check the value has been set
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersVar.state.filters[0].value).toBe('myVeryCustomValue');

    // check the menu hasn't been opened now that the values have resolved
    expect(screen.queryByText('Value 3')).not.toBeInTheDocument();
  });

  describe('By default, Without altering `useQueriesAsFilterForOptions`', () => {
    it('Should not collect and pass respective data source queries to getTagKeys call', async () => {
      const { getTagKeysSpy, timeRange } = setup({ filters: [] });

      // Select key
      await userEvent.click(screen.getByTestId('AdHocFilter-add'));
      expect(getTagKeysSpy).toBeCalledTimes(1);
      expect(getTagKeysSpy).toBeCalledWith({
        filters: [],
        queries: undefined,
        timeRange: timeRange.state.value,
      });
    });

    it('Should not collect and pass respective data source queries to getTagValues call', async () => {
      const { getTagValuesSpy, timeRange } = setup({ filters: [] });

      // Select key
      const key = 'Key 3';
      await userEvent.click(screen.getByTestId('AdHocFilter-add'));
      const selects = getAllByRole(screen.getByTestId('AdHocFilter-'), 'combobox');
      await waitFor(() => select(selects[0], key, { container: document.body }));
      await userEvent.click(selects[2]);

      expect(getTagValuesSpy).toBeCalledTimes(1);
      expect(getTagValuesSpy).toBeCalledWith({
        filters: [],
        key: 'key3',
        queries: undefined,
        timeRange: timeRange.state.value,
      });
    });
  });

  describe('When `useQueriesAsFilterForOptions` is set to `true`', () => {
    it('Should collect and pass respective data source queries to getTagKeys call', async () => {
      const { getTagKeysSpy, timeRange } = setup({ filters: [], useQueriesAsFilterForOptions: true });

      // Select key
      await userEvent.click(screen.getByTestId('AdHocFilter-add'));
      expect(getTagKeysSpy).toBeCalledTimes(1);
      expect(getTagKeysSpy).toBeCalledWith({
        filters: [],
        queries: [
          {
            expr: 'my_metric{}',
            refId: 'A',
          },
        ],
        timeRange: timeRange.state.value,
      });
    });

    it('Should apply the filters request enricher to getTagKeys call', async () => {
      const { getTagKeysSpy, timeRange } = setup({ filters: [], useQueriesAsFilterForOptions: true }, () => ({
        key: 'overwrittenKey',
      }));

      await userEvent.click(screen.getByTestId('AdHocFilter-add'));
      expect(getTagKeysSpy).toHaveBeenCalledWith({
        filters: [],
        queries: [
          {
            expr: 'my_metric{}',
            refId: 'A',
          },
        ],
        timeRange: timeRange.state.value,
        key: 'overwrittenKey',
      });
    });

    it('Should collect and pass respective data source queries to getTagValues call', async () => {
      const { getTagValuesSpy, timeRange } = setup({ filters: [], useQueriesAsFilterForOptions: true });

      // Select key
      const key = 'Key 3';
      await userEvent.click(screen.getByTestId('AdHocFilter-add'));
      const selects = getAllByRole(screen.getByTestId('AdHocFilter-'), 'combobox');
      await waitFor(() => select(selects[0], key, { container: document.body }));
      await userEvent.click(selects[2]);

      expect(getTagValuesSpy).toBeCalledTimes(1);
      expect(getTagValuesSpy).toBeCalledWith({
        filters: [],
        key: 'key3',
        queries: [
          {
            expr: 'my_metric{}',
            refId: 'A',
          },
        ],
        timeRange: timeRange.state.value,
      });
    });

    it('Should apply the filters request enricher to getTagValues call', async () => {
      const { getTagKeysSpy, timeRange } = setup({ filters: [], useQueriesAsFilterForOptions: true }, () => ({
        key: 'overwrittenKey',
      }));

      const key = 'Key 3';
      await userEvent.click(screen.getByTestId('AdHocFilter-add'));
      const selects = getAllByRole(screen.getByTestId('AdHocFilter-'), 'combobox');
      await waitFor(() => select(selects[0], key, { container: document.body }));
      await userEvent.click(selects[2]);

      expect(getTagKeysSpy).toHaveBeenCalledWith({
        filters: [],
        key: 'overwrittenKey',
        queries: [
          {
            expr: 'my_metric{}',
            refId: 'A',
          },
        ],
        timeRange: timeRange.state.value,
      });
    });
  });

  it('url sync works', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue', valueLabels: ['newValue'] });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=key1%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({ 'var-filters': ['key1|=|valUrl', 'keyUrl|=~|urlVal'] });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'key1',
      keyLabel: 'key1',
      operator: '=',
      value: 'valUrl',
      valueLabels: ['valUrl'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'keyUrl',
      keyLabel: 'keyUrl',
      operator: '=~',
      value: 'urlVal',
      valueLabels: ['urlVal'],
      condition: '',
    });
  });

  it('overrides state when url has empty key', () => {
    const { filtersVar } = setup();

    act(() => {
      locationService.partial({ 'var-filters': '' });
    });

    expect(filtersVar.state.filters.length).toBe(0);
  });

  it('reflects emtpy state in url', async () => {
    const { filtersVar } = setup();

    await userEvent.click(screen.getByTestId('AdHocFilter-remove-key1'));
    await userEvent.click(screen.getByTestId('AdHocFilter-remove-key2'));

    expect(filtersVar.state.filters.length).toBe(0);
    expect(locationService.getLocation().search).toBe('?var-filters=');
  });

  it('url sync from empty filters array works', async () => {
    const { filtersVar } = setup({ filters: [] });

    act(() => {
      locationService.partial({ 'var-filters': ['key1|=|valUrl', 'keyUrl|=~|urlVal'] });
    });

    expect(filtersVar.state.filters.length).toEqual(2);
  });

  it('url sync with both key and value labels', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey', keyLabel: 'New Key' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue', valueLabels: ['New Value'] });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=newKey,New%20Key%7C%3D%7CnewValue,New%20Value&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({
        'var-filters': ['newKey,New Key|=|newValue,New Value', 'newKey2,New Key 2|=~|newValue2,New Value 2'],
      });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'newKey',
      keyLabel: 'New Key',
      operator: '=',
      value: 'newValue',
      valueLabels: ['New Value'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'New Key 2',
      operator: '=~',
      value: 'newValue2',
      valueLabels: ['New Value 2'],
      condition: '',
    });
  });

  it('url sync with key label and no value label', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey', keyLabel: 'New Key' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue' });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=newKey,New%20Key%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({
        'var-filters': ['newKey,New Key|=|newValue', 'newKey2,New Key 2|=~|newValue2'],
      });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'newKey',
      keyLabel: 'New Key',
      operator: '=',
      value: 'newValue',
      valueLabels: ['newValue'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'New Key 2',
      operator: '=~',
      value: 'newValue2',
      valueLabels: ['newValue2'],
      condition: '',
    });
  });

  it('url sync with no key label and value label', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue', valueLabels: ['New Value'] });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=newKey%7C%3D%7CnewValue,New%20Value&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({
        'var-filters': ['newKey|=|newValue,New Value', 'newKey2|=~|newValue2,New Value 2'],
      });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'newKey',
      keyLabel: 'newKey',
      operator: '=',
      value: 'newValue',
      valueLabels: ['New Value'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'newKey2',
      operator: '=~',
      value: 'newValue2',
      valueLabels: ['New Value 2'],
      condition: '',
    });
  });

  it('url sync with no key and value labels', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue' });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=newKey%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({
        'var-filters': ['newKey|=|newValue', 'newKey2|=~|newValue2'],
      });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'newKey',
      keyLabel: 'newKey',
      operator: '=',
      value: 'newValue',
      valueLabels: ['newValue'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'newKey2',
      operator: '=~',
      value: 'newValue2',
      valueLabels: ['newValue2'],
      condition: '',
    });
  });

  it('url sync with both key and value labels with commas', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'new,Key', keyLabel: 'New,Key' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'new,Value', valueLabels: ['New,Value'] });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=new__gfc__Key,New__gfc__Key%7C%3D%7Cnew__gfc__Value,New__gfc__Value&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({
        'var-filters': [
          'new__gfc__Key,New__gfc__Key|=|new__gfc__Value,New__gfc__Value',
          'new__gfc__Key__gfc__2,New__gfc__Key__gfc__2|=~|new__gfc__Value__gfc__2,New__gfc__Value__gfc__2',
        ],
      });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'new,Key',
      keyLabel: 'New,Key',
      operator: '=',
      value: 'new,Value',
      valueLabels: ['New,Value'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'new,Key,2',
      keyLabel: 'New,Key,2',
      operator: '=~',
      value: 'new,Value,2',
      valueLabels: ['New,Value,2'],
      condition: '',
    });
  });

  it('url sync with identical key and value labels', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey', keyLabel: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue', valueLabels: ['newValue'] });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=newKey%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.partial({
        'var-filters': ['newKey|=|newValue', 'newKey2,newKey2|=~|newValue2,newValue2'],
      });
    });

    expect(filtersVar.state.filters[0]).toEqual({
      key: 'newKey',
      keyLabel: 'newKey',
      operator: '=',
      value: 'newValue',
      valueLabels: ['newValue'],
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'newKey2',
      operator: '=~',
      value: 'newValue2',
      valueLabels: ['newValue2'],
      condition: '',
    });
  });

  it('only url sync fully completed filters', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey', keyLabel: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: '', valueLabels: [''] });
    });

    expect(locationService.getLocation().search).toBe('?var-filters=key2%7C%3D%7Cval2');
  });

  it('Can override and replace getTagKeys and getTagValues', async () => {
    const { filtersVar } = setup({
      getTagKeysProvider: () => {
        return Promise.resolve({ replace: true, values: [{ text: 'hello', value: '1' }] });
      },
      getTagValuesProvider: () => {
        return Promise.resolve({ replace: true, values: [{ text: 'v', value: '2' }] });
      },
    });

    const keys = await filtersVar._getKeys(null);
    expect(keys).toEqual([{ label: 'hello', value: '1' }]);

    const values = await filtersVar._getValuesFor(filtersVar.state.filters[0]);
    expect(values).toEqual([{ label: 'v', value: '2' }]);
  });

  it('Can override and add keys and values', async () => {
    const { filtersVar } = setup({
      getTagKeysProvider: () => {
        return Promise.resolve({ values: [{ text: 'hello', value: '1' }] });
      },
      getTagValuesProvider: () => {
        return Promise.resolve({ values: [{ text: 'v', value: '2' }] });
      },
    });

    const keys = await filtersVar._getKeys(null);
    expect(keys).toEqual([
      { label: 'Key 3', value: 'key3' },
      { label: 'hello', value: '1' },
    ]);

    const values = await filtersVar._getValuesFor(filtersVar.state.filters[0]);
    expect(values).toEqual([
      { label: 'val3', value: 'val3' },
      { label: 'val4', value: 'val4' },
      { label: 'v', value: '2' },
    ]);
  });

  it('Can override with default keys', async () => {
    const { filtersVar } = setup({
      defaultKeys: [
        {
          text: 'some',
          value: '1',
        },
        {
          text: 'static',
          value: '2',
        },
        {
          text: 'keys',
          value: '3',
        },
      ],
    });

    const keys = await filtersVar._getKeys(null);
    expect(keys).toEqual([
      { label: 'some', value: '1' },
      { label: 'static', value: '2' },
      { label: 'keys', value: '3' },
    ]);
  });

  it('Selecting a key correctly shows the label', async () => {
    const { filtersVar } = setup({
      defaultKeys: [
        {
          text: 'some',
          value: '1',
        },
        {
          text: 'static',
          value: '2',
        },
        {
          text: 'keys',
          value: '3',
        },
      ],
    });
    const selects = screen.getAllByRole('combobox');
    await waitFor(() => select(selects[0], 'some', { container: document.body }));

    expect(screen.getByText('some')).toBeInTheDocument();
    expect(filtersVar.state.filters[0].key).toBe('1');
  });

  it('Selecting a default key correctly shows the label', async () => {
    const { filtersVar } = setup({
      defaultKeys: [
        {
          text: 'some',
          value: '1',
        },
        {
          text: 'static',
          value: '2',
        },
        {
          text: 'keys',
          value: '3',
        },
      ],
    });
    const selects = screen.getAllByRole('combobox');
    await waitFor(() => select(selects[0], 'some', { container: document.body }));

    expect(screen.getByText('some')).toBeInTheDocument();
    expect(filtersVar.state.filters[0].key).toBe('1');
  });

  it('Can filter by regex', async () => {
    const { filtersVar } = setup({
      tagKeyRegexFilter: new RegExp('x.*'),
    });

    const keys = await filtersVar._getKeys(null);
    expect(keys).toEqual([]);
  });

  describe('variable expression / value', () => {
    it('By default renders a prometheus / loki compatible label filter', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [
          { key: 'key1', operator: '=', value: 'val1' },
          { key: 'key2', operator: '=~', value: '[val2]' },
        ],
      });

      variable.activate();

      expect(variable.getValue()).toBe(`key1="val1",key2=~"\\\\[val2\\\\]"`);
    });

    it('Updates filterExpression on setState', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const stateUpdates = subscribeToStateUpdates(variable);

      expect(stateUpdates.length).toBe(0);

      variable.setState({ filters: [{ key: 'key1', operator: '=', value: 'val2' }] });

      expect(stateUpdates).toHaveLength(1);
      expect(stateUpdates[0].filterExpression).toBe('key1="val2"');
    });

    it('Renders correct expression when passed an expression builder', () => {
      const expressionBuilder = (filters: AdHocVariableFilter[]) => {
        return filters.map((filter) => `${filter.key}${filter.operator}"${filter.value}"`).join(' && ');
      };

      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        expressionBuilder,
        filters: [
          { key: 'key1', operator: '=', value: 'val1' },
          { key: 'key2', operator: '=~', value: '[val2]' },
        ],
      });

      variable.activate();

      expect(variable.getValue()).toBe(`key1="val1" && key2=~"[val2]"`);
    });

    it('Should not update filterExpression state on activation if not needed', () => {
      const variable = new AdHocFiltersVariable({
        applyMode: 'manual',
        datasource: { uid: 'hello' },
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      const evtHandler = jest.fn();
      variable.subscribeToState(evtHandler);
      variable.activate();

      expect(evtHandler).not.toHaveBeenCalled();
    });

    it('Should not publish event on activation', () => {
      const variable = new AdHocFiltersVariable({
        applyMode: 'manual',
        datasource: { uid: 'hello' },
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);
      variable.activate();

      expect(evtHandler).not.toHaveBeenCalled();
    });

    it('Should not publish event on when expr did not change', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.setState({ filters: variable.state.filters.slice(0) });

      expect(evtHandler).not.toHaveBeenCalled();
    });

    it('Should create variable with applyMode as manual by default and it allows to override it', () => {
      const defaultVariable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        filters: [],
      });

      const manualDataSource = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        filters: [],
        applyMode: 'manual',
      });

      defaultVariable.activate();
      manualDataSource.activate();

      expect(defaultVariable.state.applyMode).toBe('auto');
      expect(manualDataSource.state.applyMode).toBe('manual');
    });
  });

  describe('Component', () => {
    it('should use the model.state.set.Component to ensure the state filterset is activated', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      render(<variable.Component model={variable} />);

      expect(variable.isActive).toBe(true);
    });
    it('should render key, value and operator in vertical adhoc layout', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        filters: [{ key: 'key1', operator: '!=', value: 'val1' }],
        layout: 'vertical',
      });

      render(<variable.Component model={variable} />);
      expect(screen.getByText('!=')).toBeInTheDocument();
      expect(screen.getByText('key1')).toBeInTheDocument();
      expect(screen.getByText('val1')).toBeInTheDocument();
    });
  });


  describe('using new combobox layout - populateInputOnEdit', () => {
    beforeAll(() => {
      const mockGetBoundingClientRect = jest.fn(() => ({
        width: 120,
        height: 120,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }));

      Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
        value: mockGetBoundingClientRect,
      });
    });
    beforeEach(() => {
      setup({
        populateInputOnEdit: true,
        getTagKeysProvider: async () => ({
          replace: true,
          values: [
            { text: 'key1', value: 'key1' },
            { text: 'key2', value: 'key2' },
            { text: 'key3', value: 'key3' },
          ],
        }),
        getTagValuesProvider: async () => ({
          replace: true,
          values: [
            { text: 'val1', value: 'val1' },
            { text: 'val2', value: 'val2' },
            { text: 'val3', value: 'val3' },
          ],
        }),
        layout: 'combobox',
      });
    });

    it('can edit filters by clicking the chip', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Edit filter with key key2' }));

      // full chip is removed
      expect(screen.queryByText('key2 = val2')).not.toBeInTheDocument();
      // partial chip values for key and operator are still present
      expect(screen.getByText('key2')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      // input has focus
      expect(screen.getByRole('combobox')).toHaveFocus();
      // with the correct value
      expect(screen.getByRole('combobox')).toHaveValue('val2');
      // and the value dropdown is open
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'val2' })).toBeInTheDocument();

      await userEvent.type(screen.getByRole('combobox'), '{backspace}');
      await userEvent.click(screen.getByRole('option', { name: 'val3' }));

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key2 = val3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
      // other untouched filter should still be there as well
      expect(screen.getByText('key1 = val1')).toBeInTheDocument();
    });

    it('can edit filters with the keyboard', async () => {
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.keyboard('{shift>}{tab}{tab}{/shift}');
      expect(screen.getByRole('button', { name: 'Edit filter with key key2' })).toHaveFocus();
      await userEvent.keyboard('{enter}');

      // full chip is removed
      expect(screen.queryByText('key2 = val2')).not.toBeInTheDocument();
      // partial chip values for key and operator are still present
      expect(screen.getByText('key2')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      // input has focus
      expect(screen.getByRole('combobox')).toHaveFocus();
      // with the correct value
      expect(screen.getByRole('combobox')).toHaveValue('val2');
      // and the value dropdown is open
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'val2' })).toBeInTheDocument();

      await userEvent.type(screen.getByRole('combobox'), '{backspace}');
      await userEvent.keyboard('{arrowdown}{arrowdown}');
      await userEvent.keyboard('{enter}');

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key2 = val3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
      // other untouched filter should still be there as well
      expect(screen.getByText('key1 = val1')).toBeInTheDocument();
    });
  })

  describe('using new combobox layout', () => {
    // needed for floating-ui to correctly calculate the position of the dropdown
    beforeAll(() => {
      const mockGetBoundingClientRect = jest.fn(() => ({
        width: 120,
        height: 120,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }));

      Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
        value: mockGetBoundingClientRect,
      });
    });

    beforeEach(() => {
      setup({
        getTagKeysProvider: async () => ({
          replace: true,
          values: [
            { text: 'key1', value: 'key1' },
            { text: 'key2', value: 'key2' },
            { text: 'key3', value: 'key3' },
          ],
        }),
        getTagValuesProvider: async () => ({
          replace: true,
          values: [
            { text: 'val1', value: 'val1' },
            { text: 'val2', value: 'val2' },
            { text: 'val3', value: 'val3' },
          ],
        }),
        layout: 'combobox',
      });
    });

    it('displays the existing filters', async () => {
      expect(await screen.findByText('key1 = val1')).toBeInTheDocument();
      expect(await screen.findByText('key2 = val2')).toBeInTheDocument();
    });

    it('focusing the input opens the key dropdown', async () => {
      await userEvent.click(screen.getByRole('combobox'));

      // check the key dropdown is open
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'key2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'key3' })).toBeInTheDocument();
    });

    it('will show values from getTagValuesProvider when clicking on a chip', async () => {
      // Click on combobox pill
      await userEvent.click(screen.getByRole('button', { name: 'Edit filter with key key2' }));

      // Results from getTagValuesProvider should be rendered on the screen
      const options = screen.getAllByRole('option')
      expect(options[0].textContent).toEqual(' val1')
      expect(options[1].textContent).toEqual(' val2')
      expect(options[2].textContent).toEqual(' val3')

      // Change the key2 value to value3
      await userEvent.click(screen.getByRole('option', {name: 'val3'}))
      expect(screen.getByLabelText('Edit filter with key key2').textContent).toContain('key2 = val3')
    });

    it('can remove a filter by clicking the remove button on a chip', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Remove filter with key key1' }));

      // check the filter has been removed without affecting the other
      expect(screen.queryByText('key1 = val1')).not.toBeInTheDocument();
      expect(screen.getByText('key2 = val2')).toBeInTheDocument();

      // check focus has reverted back to the input
      expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('can remove a filter with the keyboard', async () => {
      await userEvent.click(screen.getByRole('combobox'));

      // remove second filter
      await userEvent.keyboard('{shift>}{tab}{/shift}');
      expect(screen.getByRole('button', { name: 'Remove filter with key key2' })).toHaveFocus();
      await userEvent.keyboard('{enter}');

      // check the filter has been removed without affecting the other
      expect(screen.queryByText('key2 = val2')).not.toBeInTheDocument();
      expect(screen.getByText('key1 = val1')).toBeInTheDocument();

      // check focus has reverted back to the input
      expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('can add a new filter by selecting key, operator and value', async () => {
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: 'key3' }));

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // partial chip committed
      expect(screen.getByText('key3')).toBeInTheDocument();
      // and operator dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: '= Equals' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('option', { name: '= Equals' }));

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // partial chip committed
      expect(screen.getByText('key3')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      // and value dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'val1' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('option', { name: 'val3' }));

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key3 = val3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
    });

    it('can add a new filter by selecting key, operator and value with the keyboard', async () => {
      await userEvent.click(screen.getByRole('combobox'));
      // TODO for some reason this needs an extra arrowdown
      await userEvent.keyboard('{arrowdown}{arrowdown}');
      await userEvent.keyboard('{enter}');

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // partial chip committed
      expect(screen.getByText('key3')).toBeInTheDocument();
      // and operator dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: '= Equals' })).toBeInTheDocument();

      await userEvent.keyboard('{enter}');

      // input should be refocused, partial chip committed
      expect(screen.getByRole('combobox')).toHaveFocus();
      // partial chip committed
      expect(screen.getByText('key3')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      // and value dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'val1' })).toBeInTheDocument();

      await userEvent.keyboard('{arrowdown}{arrowdown}');
      await userEvent.keyboard('{enter}');

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key3 = val3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
    });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

function setup(
  overrides?: Partial<AdHocFiltersVariableState>,
  filtersRequestEnricher?: FiltersRequestEnricher['enrichFiltersRequest']
) {
  const getTagKeysSpy = jest.fn();
  const getTagValuesSpy = jest.fn();
  setDataSourceSrv({
    get() {
      return {
        getTagKeys(options: any) {
          getTagKeysSpy(options);
          return [{ text: 'Key 3', value: 'key3' }];
        },
        getTagValues(options: any) {
          getTagValuesSpy(options);
          return [{ text: 'val3' }, { text: 'val4' }];
        },
        getRef() {
          return { uid: 'my-ds-uid' };
        },
      };
    },
    getInstanceSettings() {
      return { uid: 'my-ds-uid' };
    },
  } as unknown as DataSourceSrv);

  // Workaround because you can only call setRunRequest once
  runRequestMock.fn = jest.fn();

  if (!runRequestSet) {
    runRequestSet = true;
    setRunRequest((ds: DataSourceApi, request: DataQueryRequest): Observable<PanelData> => {
      runRequestMock.fn(ds, request);
      return of({ series: [], state: LoadingState.Done, timeRange: getDefaultTimeRange() });
    });
  }

  setTemplateSrv(templateSrv);

  const filtersVar = new AdHocFiltersVariable({
    datasource: { uid: 'my-ds-uid' },
    name: 'filters',
    filters: [
      { key: 'key1', operator: '=', value: 'val1' },
      { key: 'key2', operator: '=', value: 'val2' },
    ],
    ...overrides,
  });

  const timeRange = new SceneTimeRange();

  const scene = new EmbeddedScene({
    $timeRange: timeRange,
    $variables: new SceneVariableSet({
      variables: [filtersVar],
    }),
    controls: [new VariableValueSelectors({})],
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          $data: new SceneQueryRunner({
            datasource: { uid: 'my-ds-uid' },
            queries: [
              {
                refId: 'A',
                expr: 'my_metric{}',
              },
            ],
          }),
          body: new SceneCanvasText({ text: 'hello' }),
        }),
      ],
    }),
  });

  if (filtersRequestEnricher) {
    (scene as EmbeddedScene & FiltersRequestEnricher).enrichFiltersRequest = filtersRequestEnricher;
  }

  locationService.push('/');

  const { unmount } = render(
    <TestContextProvider scene={scene}>
      <scene.Component model={scene} />
    </TestContextProvider>
  );

  return { scene, filtersVar, unmount, runRequest: runRequestMock.fn, getTagKeysSpy, getTagValuesSpy, timeRange };
}

import React from 'react';
import { act, getAllByRole, render, waitFor, screen } from '@testing-library/react';
import { SceneVariableValueChangedEvent } from '../types';
import { AdHocFiltersVariable, AdHocFiltersVariableState } from './AdHocFiltersVariable';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, setTemplateSrv } from '@grafana/runtime';
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

describe('AdHocFiltersVariable', () => {
  it('renders filters', async () => {
    setup();
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.getByText('val1')).toBeInTheDocument();
    expect(screen.getByText('key2')).toBeInTheDocument();
    expect(screen.getByText('val2')).toBeInTheDocument();
  });

  it('templateSrv.getAdhocFilters patch calls original when scene object is not active', async () => {
    const { unmount } = setup();
    unmount();

    const result = templateSrv.getAdhocFilters('name');
    expect(result[0].key).toBe('origKey');
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

  // TODO enable once this repo is using @grafana/ui@11.1.0
  it.skip('shows groups and orders according to first occurence of a group item', async () => {
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
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'newValue', label: 'newValue' });
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
      valueLabel: 'valUrl',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'keyUrl',
      keyLabel: 'keyUrl',
      operator: '=~',
      value: 'urlVal',
      valueLabel: 'urlVal',
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
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'newKey', label: 'New Key' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'newValue', label: 'New Value' });
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
      valueLabel: 'New Value',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'New Key 2',
      operator: '=~',
      value: 'newValue2',
      valueLabel: 'New Value 2',
      condition: '',
    });
  });

  it('url sync with key label and no value label', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'newKey', label: 'New Key' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'newValue' });
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
      valueLabel: 'newValue',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'New Key 2',
      operator: '=~',
      value: 'newValue2',
      valueLabel: 'newValue2',
      condition: '',
    });
  });

  it('url sync with no key label and value label', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'newValue', label: 'New Value' });
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
      valueLabel: 'New Value',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'newKey2',
      operator: '=~',
      value: 'newValue2',
      valueLabel: 'New Value 2',
      condition: '',
    });
  });

  it('url sync with no key and value labels', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'newValue' });
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
      valueLabel: 'newValue',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'newKey2',
      operator: '=~',
      value: 'newValue2',
      valueLabel: 'newValue2',
      condition: '',
    });
  });

  it('url sync with both key and value labels with commas', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'new,Key', label: 'New,Key' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'new,Value', label: 'New,Value' });
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
      valueLabel: 'New,Value',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'new,Key,2',
      keyLabel: 'New,Key,2',
      operator: '=~',
      value: 'new,Value,2',
      valueLabel: 'New,Value,2',
      condition: '',
    });
  });

  it('url sync with identical key and value labels', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'newKey', label: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: 'newValue', label: 'newValue' });
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
      valueLabel: 'newValue',
      condition: '',
    });
    expect(filtersVar.state.filters[1]).toEqual({
      key: 'newKey2',
      keyLabel: 'newKey2',
      operator: '=~',
      value: 'newValue2',
      valueLabel: 'newValue2',
      condition: '',
    });
  });

  it('only url sync fully completed filters', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'key', { value: 'newKey', label: 'newKey' });
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', { value: '', label: '' });
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

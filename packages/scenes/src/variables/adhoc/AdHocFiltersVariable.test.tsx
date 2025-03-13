import React from 'react';
import { act, getAllByRole, render, waitFor, screen } from '@testing-library/react';
import { SceneVariableValueChangedEvent } from '../types';
import {
  AdHocFiltersVariable,
  AdHocFiltersVariableState,
  AdHocFilterWithLabels,
  FilterOrigin,
} from './AdHocFiltersVariable';
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
  Scope,
  ScopeSpecFilter,
} from '@grafana/data';
import { BehaviorSubject, Observable, of } from 'rxjs';
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
import { generateFilterUpdatePayload } from './AdHocFiltersCombobox/utils';
import { SceneScopesBridge } from '../../core/SceneScopesBridge';
import { sceneGraph } from '../../core/sceneGraph';

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

  it('shows key groups and orders according to first occurrence of a group item', async () => {
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

  it('shows value groups and orders according to first occurrence of a group item', async () => {
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

  it('does not render hidden filter in url', () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { hidden: true });
    });

    expect(locationService.getLocation().search).toBe('?var-filters=key2%7C%3D%7Cval2');
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

  it('url does not sync injected filters if they are not modified', async () => {
    const { filtersVar } = setup({
      filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=',
          value: 'baseValue1',
          valueLabels: ['baseValue1'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'baseKey2',
          keyLabel: 'baseKey2',
          operator: '!=',
          value: 'baseValue2',
          valueLabels: ['baseValue2'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get synced
        { key: 'baseKey3', keyLabel: 'baseKey3', operator: '!=', value: 'baseValue3', valueLabels: ['baseValue3'] },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], { key: 'newKey', keyLabel: 'newKey' });
    });

    expect(locationService.getLocation().search).toBe('?var-filters=newKey%7C%3D%7Cval1');
  });

  it('url syncs base filters as injected filters together with original value', async () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '!=',
          value: 'baseValue1',
          valueLabels: ['baseValue1'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get synced
        { key: 'baseKey3', keyLabel: 'baseKey3', operator: '!=', value: 'baseValue3', valueLabels: ['baseValue3'] },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue',
        valueLabels: ['newValue'],
      });
    });

    // injected filters stored in the following format: normal|adhoc|values#original|values#filterOrigin
    expect(locationService.getLocation().search).toBe(
      '?var-filters=baseKey1%7C%21%3D%7CnewValue%23baseValue1%23scopes'
    );
  });

  it('url syncs multi-value base filters as injected filters', async () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '!=|',
          value: 'baseValue1',
          values: ['baseValue1', 'baseValue2'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get synced
        { key: 'baseKey3', keyLabel: 'baseKey3', operator: '!=', value: 'baseValue3' },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1',
        values: ['newValue1', 'newValue2'],
      });
    });

    // injected filters stored in the following format: normal|adhoc|values#original|values#filterOrigin
    expect(locationService.getLocation().search).toBe(
      '?var-filters=baseKey1%7C%21%3D__gfp__%7CnewValue1%7CnewValue2%23baseValue1%7CbaseValue2%23scopes'
    );
  });

  it('will properly escape injected filter hash delimiter if found within values', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=',
          value: 'baseValue1#',
          values: ['baseValue1#'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get synced
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1#',
      });
    });

    // injected filters stored in the following format: normal|adhoc|values#original|values#filterOrigin
    expect(locationService.getLocation().search).toBe(
      '?var-filters=baseKey1%7C%3D%7CnewValue1__gfh__%23baseValue1__gfh__%23scopes'
    );
  });

  it('will default to just showing empty var-filters if no filters or base filters present', () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar.setState({
        filters: [],
      });
    });

    expect(filtersVar.state.filters).toEqual([]);
    expect(filtersVar.state.baseFilters).toBe(undefined);
    expect(locationService.getLocation().search).toBe('?var-filters=');
  });

  it('will save the original value in base filter if it has origin so it can be later restored', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=',
          value: 'baseValue1',
          values: ['baseValue1'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get updated
        { key: 'baseKey3', keyLabel: 'baseKey3', operator: '!=', value: 'baseValue3' },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1',
      });

      // no origin, so this does not get updated
      filtersVar._updateFilter(filtersVar.state.baseFilters![1], {
        value: 'newValue3',
      });
    });

    expect(filtersVar.state.baseFilters![0].value).toBe('newValue1');
    expect(filtersVar.state.baseFilters![1].value).toBe('baseValue3');
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['baseValue1']);
    expect(filtersVar.state.baseFilters![1].originalValue).toBe(undefined);
  });

  it('will save the original multi values in base filter if it has origin so it can be later restored', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=|',
          value: 'baseValue1',
          values: ['baseValue1', 'baseValue2'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get updated
        { key: 'baseKey3', keyLabel: 'baseKey3', operator: '!=', value: 'baseValue3' },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1',
        values: ['newValue1'],
      });

      // no origin, so this does not get updated
      filtersVar._updateFilter(filtersVar.state.baseFilters![1], {
        value: 'newValue3',
      });
    });

    expect(filtersVar.state.baseFilters![0].value).toBe('newValue1');
    expect(filtersVar.state.baseFilters![0].values).toEqual(['newValue1']);
    expect(filtersVar.state.baseFilters![1].value).toBe('baseValue3');
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['baseValue1', 'baseValue2']);
    expect(filtersVar.state.baseFilters![1].originalValue).toBe(undefined);
  });

  it('does not update originalValue if new and old filter changes are the same', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=|',
          value: 'baseValue1',
          values: ['baseValue1', 'baseValue2'],
          origin: FilterOrigin.Scopes,
        },
        // no origin, so this does not get updated
        { key: 'baseKey3', keyLabel: 'baseKey3', operator: '!=', value: 'baseValue3' },
      ],
    });

    act(() => {
      // same value, so no change
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'baseValue1',
        values: ['baseValue1', 'baseValue2'],
      });
    });

    expect(filtersVar.state.baseFilters![0].value).toBe('baseValue1');
    expect(filtersVar.state.baseFilters![0].values).toEqual(['baseValue1', 'baseValue2']);
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(undefined);
  });

  it('does not overwrite originalValue if it already exists, unless explicitly requested', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=|',
          value: 'baseValue1',
          values: ['baseValue1'],
          origin: FilterOrigin.Scopes,
          originalValue: ['originalValue1'],
        },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1',
        values: ['newValue1'],
      });
    });

    // original value has not been updated since it is already set
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['originalValue1']);

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1',
        values: ['newValue1'],
        originalValue: ['newOriginalValue1'],
      });
    });

    // original value has been updated since it is explicitly requested
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['newOriginalValue1']);
  });

  it('deletes originalValue if we set the same value from the UI', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=',
          value: 'baseValue1',
          values: ['baseValue1'],
          origin: FilterOrigin.Scopes,
        },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'newValue1',
        values: ['newValue1'],
      });
    });

    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['baseValue1']);

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'baseValue1',
        values: ['baseValue1'],
      });
    });

    // like a manual restore, but done from the UI by manually picking the same value
    // as the original
    expect(filtersVar.state.baseFilters![0].originalValue).toBe(undefined);
  });

  it('maintains originalValue if we return to original values, but in different order', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=|',
          value: 'baseValue1',
          values: ['baseValue1', 'baseValue2'],
          origin: FilterOrigin.Scopes,
        },
      ],
    });

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'baseValue2',
        values: ['baseValue2', 'baseValue3'],
      });
    });

    // we change values, and store originalValue
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['baseValue1', 'baseValue2']);

    act(() => {
      filtersVar._updateFilter(filtersVar.state.baseFilters![0], {
        value: 'baseValue2',
        values: ['baseValue2', 'baseValue1'],
      });
    });

    // we change the values again, this time with the same values as originalValue but
    // in a different order. This will maintain the originalValue key
    expect(filtersVar.state.baseFilters![0].originalValue).toEqual(['baseValue1', 'baseValue2']);
  });

  it('restores original value if it exists', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=|',
          value: 'baseValue1',
          values: ['baseValue1'],
          origin: FilterOrigin.Scopes,
          originalValue: ['originalValue1'],
        },
      ],
    });

    act(() => {
      filtersVar.restoreOriginalFilter(filtersVar.state.baseFilters![0]);
    });

    expect(filtersVar.state.baseFilters![0].value).toEqual('originalValue1');
    expect(filtersVar.state.baseFilters![0].values).toEqual(['originalValue1']);
    expect(filtersVar.state.baseFilters![0].originalValue).toBe(undefined);
  });

  it('does not restore original value if it does not exists', () => {
    const { filtersVar } = setup({
      filters: [],
      baseFilters: [
        {
          key: 'baseKey1',
          keyLabel: 'baseKey1',
          operator: '=|',
          value: 'baseValue1',
          values: ['baseValue1'],
          origin: FilterOrigin.Scopes,
        },
      ],
    });

    act(() => {
      filtersVar.restoreOriginalFilter(filtersVar.state.baseFilters![0]);
    });

    expect(filtersVar.state.baseFilters![0].value).toEqual('baseValue1');
    expect(filtersVar.state.baseFilters![0].values).toEqual(['baseValue1']);
    expect(filtersVar.state.baseFilters![0].originalValue).toBe(undefined);
  });

  it.each([
    [
      [
        {
          key: 'nonScopeBaseFilter',
          operator: '=',
          value: 'val',
          values: ['val'],
        },
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'scopeBaseFilter2',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
          originalValue: ['original'],
        },
      ],
      [
        [
          { key: 'scopeBaseFilter1', operator: 'equals', value: 'val' },
          { key: 'scopeBaseFilter2', operator: 'equals', value: 'val' },
        ],
        [{ key: 'scopeBaseFilter3', operator: 'equals', value: 'val' }],
      ],
      [
        {
          key: 'scopeBaseFilter2',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
          originalValue: ['original'],
        },
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'scopeBaseFilter3',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'nonScopeBaseFilter',
          operator: '=',
          value: 'val',
          values: ['val'],
        },
      ],
    ],
    [
      [],
      [
        [
          { key: 'scopeBaseFilter1', operator: 'equals', value: 'val' },
          { key: 'scopeBaseFilter2', operator: 'equals', value: 'val' },
        ],
        [{ key: 'scopeBaseFilter3', operator: 'equals', value: 'val' }],
      ],
      [
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'scopeBaseFilter2',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'scopeBaseFilter3',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
      ],
    ],
    [
      [
        {
          key: 'nonScopeBaseFilter',
          operator: '=',
          value: 'val',
          values: ['val'],
        },
      ],
      [],
      [
        {
          key: 'nonScopeBaseFilter',
          operator: '=',
          value: 'val',
          values: ['val'],
        },
      ],
    ],
    [
      [
        {
          key: 'nonScopeBaseFilter',
          operator: '=',
          value: 'val',
          values: ['val'],
        },
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
      ],
      [[{ key: 'scopeBaseFilter3', operator: 'equals', value: 'val' }]],
      [
        {
          key: 'scopeBaseFilter3',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
        {
          key: 'nonScopeBaseFilter',
          operator: '=',
          value: 'val',
          values: ['val'],
        },
      ],
    ],
    [
      [
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
          originalValue: ['original'],
        },
      ],
      [[{ key: 'scopeBaseFilter1', operator: 'equals', value: 'val' }]],
      [
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
          originalValue: ['original'],
        },
      ],
    ],
    [
      [
        {
          key: 'scopeBaseFilter1',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
          originalValue: ['original'],
        },
      ],
      [[{ key: 'scopeBaseFilter2', operator: 'equals', value: 'val' }]],
      [
        {
          key: 'scopeBaseFilter2',
          operator: '=',
          value: 'val',
          values: ['val'],
          origin: FilterOrigin.Scopes,
        },
      ],
    ],
    [[], [], []],
  ])('maintains correct filters and scope injected filters on activation', (baseFilters, scopeFilters, expected) => {
    // in this scenario we need to preserve whatever non injected filters exist, together
    // with either edited scope injected filters or directly filters pulled from scopes
    let getScopesBridgeSpy = jest.spyOn(sceneGraph, 'getScopesBridge');

    const scopes = new SceneScopesBridge({});
    const mockState = {
      value: [] as Scope[],
      drawerOpened: false,
      enabled: true,
      loading: false,
      readOnly: false,
    };

    for (let i = 0; i < scopeFilters.length; i++) {
      mockState.value.push({
        metadata: { name: `Scope ${i}` },
        spec: {
          title: `Scope ${i}`,
          type: 'test',
          description: 'Test scope',
          category: 'test',
          filters: scopeFilters[i] as ScopeSpecFilter[],
        },
      });
    }

    scopes.updateContext({
      state: mockState,
      stateObservable: new BehaviorSubject(mockState),
      changeScopes: () => {},
      setReadOnly: () => {},
      setEnabled: () => {},
    });

    getScopesBridgeSpy.mockReturnValue(scopes);

    const { filtersVar } = setup({
      filters: [],
      baseFilters,
    });

    filtersVar.state.baseFilters?.forEach((filter, index) => {
      expect(filter).toEqual(expected[index]);
    });

    getScopesBridgeSpy.mockReturnValue(undefined);
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

  it('Can define custom meta in getTagKeysProvider which will be passed to getTagValuesProvider', async () => {
    type FilterMeta = Record<string, string>;

    const { filtersVar } = setup({
      getTagKeysProvider: () => {
        // getTagKeysProvider API call returns metadata needed in the value
        return Promise.resolve({
          replace: true,
          values: [{ text: 'keyLabel', value: 'keyValue', meta: { parser: 'parserValue' } }],
        });
      },
      getTagValuesProvider: (variable, filter: AdHocFilterWithLabels<FilterMeta>) => {
        // getTagValuesProvider can receive this metadata, and add it to the value
        expect(filter.meta).toEqual({ parser: 'parserValue' });
        return Promise.resolve({
          replace: true,
          values: [{ text: 'valueLabel', value: JSON.stringify({ value: 'v', parser: filter.meta?.parser }) }],
        });
      },
    });

    const keys = await filtersVar._getKeys(null);
    expect(keys).toEqual([{ label: 'keyLabel', value: 'keyValue', meta: { parser: 'parserValue' } }]);

    // Simulate the update of the filter key after the user selects a particular key
    act(() =>
      filtersVar._updateFilter(
        filtersVar.state.filters[0],
        generateFilterUpdatePayload({
          filterInputType: 'key',
          item: keys[0],
          filter: filtersVar.state.filters[0],
          setFilterMultiValues: jest.fn(),
        })
      )
    );

    // Get the values for the ad-hoc variable
    const values = await filtersVar._getValuesFor(filtersVar.state.filters[0]);

    // Our value should contain the metadata from the getTagKeysProvider call made earlier
    expect(values).toEqual([{ label: 'valueLabel', value: JSON.stringify({ value: 'v', parser: 'parserValue' }) }]);

    // Simulate the update of the filter value after the user selects a particular value
    act(() =>
      filtersVar._updateFilter(
        filtersVar.state.filters[0],
        generateFilterUpdatePayload({
          filterInputType: 'value',
          item: values[0],
          filter: filtersVar.state.filters[0],
          setFilterMultiValues: jest.fn(),
        })
      )
    );

    // Assert that the saved filter contains the expected meta and value
    expect(filtersVar.state.filters[0]).toEqual({
      operator: '=',
      keyLabel: 'keyLabel',
      key: 'keyValue',
      meta: { parser: 'parserValue' },
      value: JSON.stringify({ value: 'v', parser: 'parserValue' }),
      valueLabels: ['valueLabel'],
    });
  });

  it('Can encode a custom value', async () => {
    const { filtersVar, runRequest } = setup({
      allowCustomValue: true,
      filters: [
        {
          key: 'key1',
          value: 'value',
          valueLabels: ['valueLabels'],
          operator: '=~',
          meta: 'metaVal',
        },
      ],
      onAddCustomValue: (item, filter) => {
        const customValue = JSON.stringify({
          meta: filter.meta,
          value: item.value,
        });
        return {
          value: customValue,
          valueLabels: [item.label ?? item.value ?? ''],
        };
      },
    });

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await userEvent.type(selects[2], 'myVeryCustomValue{enter}');

    // should run new query when filter changed
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersVar.state.filters[0].value).toBe(JSON.stringify({ meta: 'metaVal', value: 'myVeryCustomValue' }));
    expect(screen.getByText('myVeryCustomValue')).toBeVisible();
    expect(screen.queryByText('metaVal')).not.toBeInTheDocument();
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

    it('renders correct filterExpression on constructor', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      expect(variable.getValue()).toBe(`key1="val1"`);

      const variable2 = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key2', operator: '=', value: 'val2' }],
        baseFilters: [
          { key: 'baseKey1', operator: '=', value: 'baseVal1', origin: FilterOrigin.Scopes },
          { key: 'baseKey2', operator: '=', value: 'baseVal2' },
        ],
      });

      expect(variable2.getValue()).toBe(`baseKey1="baseVal1",key2="val2"`);

      const variable3 = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        baseFilters: [
          { key: 'baseKey3', operator: '=', value: 'baseVal3', origin: FilterOrigin.Scopes },
          { key: 'baseKey4', operator: '=', value: 'baseVal4' },
        ],
      });

      expect(variable3.getValue()).toBe(`baseKey3="baseVal3"`);
    });

    it('renders correct filterExpression when baseFilters are added and they have an origin on setState', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const stateUpdates = subscribeToStateUpdates(variable);

      expect(stateUpdates.length).toBe(0);

      variable.setState({
        baseFilters: [
          { key: 'baseKey1', operator: '=', value: 'baseVal1', origin: FilterOrigin.Scopes },
          { key: 'baseKey2', operator: '=', value: 'baseVal2' },
        ],
      });

      expect(stateUpdates).toHaveLength(1);
      expect(stateUpdates[0].filterExpression).toBe('baseKey1="baseVal1",key1="val1"');
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

    it('Should not overwrite filterExpression on setState', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
        filterExpression: '',
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.setState({ filters: variable.state.filters.slice(0), filterExpression: 'hello filter expression!' });

      expect(evtHandler).not.toHaveBeenCalled();
      expect(variable.state.filterExpression).toEqual('hello filter expression!');
    });

    it('Should overwrite filterExpression on updateFilters', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
        filterExpression: 'hello filter expression!',
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.updateFilters(variable.state.filters.slice(0));

      expect(evtHandler).toHaveBeenCalled();
      expect(variable.state.filterExpression).toEqual('key1="val1"');
    });

    it('updateFilters should not publish event when expr did not change', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.updateFilters(variable.state.filters.slice(0));

      expect(evtHandler).not.toHaveBeenCalled();
    });

    it('updateFilters should publish event when expr did not change, but forcePublish is set', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.updateFilters(variable.state.filters.slice(0), { forcePublish: true });

      expect(evtHandler).toHaveBeenCalled();
      expect(variable.state.filterExpression).toEqual('key1="val1"');
    });

    it('updateFilters should publish event on when expr did change', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.updateFilters([{ key: 'key2', operator: '=', value: 'val1' }]);

      expect(evtHandler).toHaveBeenCalled();
      expect(variable.state.filterExpression).toEqual(`key2="val1"`);
    });

    it('updateFilters should not publish event when skip event is true', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
        filterExpression: 'hello filter expression',
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.updateFilters([{ key: 'key2', operator: '=', value: 'val1' }], { skipPublish: true });

      expect(evtHandler).not.toHaveBeenCalled();
      expect(variable.state.filterExpression).toEqual(`key2="val1"`);
    });

    it('updateFilters should not publish event on when expr did change, if skipPublish is true', () => {
      const variable = new AdHocFiltersVariable({
        datasource: { uid: 'hello' },
        applyMode: 'manual',
        filters: [{ key: 'key1', operator: '=', value: 'val1' }],
      });

      variable.activate();

      const evtHandler = jest.fn();
      variable.subscribeToEvent(SceneVariableValueChangedEvent, evtHandler);

      variable.updateFilters([{ key: 'key2', operator: '=', value: 'val1' }], { skipPublish: true });

      expect(evtHandler).not.toHaveBeenCalled();
      expect(variable.state.filterExpression).toEqual(`key2="val1"`);
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

  describe('using new combobox layout - values', () => {
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
            { text: 'valLabel1', value: 'val1' },
            { text: 'valLabel2', value: 'val2' },
            { text: 'valLabel3', value: 'val3' },
          ],
        }),
        layout: 'combobox',
        filters: [
          { key: 'key1', operator: '=', value: 'val1' },
          { key: 'key2', operator: '=', value: 'val2' },
        ],
      });
    });

    it('renders values if valueLabels are not defined', async () => {
      expect(await screen.findByText('key1 = val1')).toBeInTheDocument();
      expect(await screen.findByText('key2 = val2')).toBeInTheDocument();
    });
  });

  describe('using new combobox layout - valueLabels', () => {
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
            { text: 'valLabel1', value: 'val1' },
            { text: 'valLabel2', value: 'val2' },
            { text: 'valLabel3', value: 'val3' },
          ],
        }),
        layout: 'combobox',
        filters: [
          { key: 'key1', operator: '=', value: 'val1', valueLabels: ['valLabel1'] },
          { key: 'key2', operator: '=', value: 'val2', valueLabels: ['valLabel2'] },
        ],
      });
    });

    it('displays the existing filters', async () => {
      expect(await screen.findByText('key1 = valLabel1')).toBeInTheDocument();
      expect(await screen.findByText('key2 = valLabel2')).toBeInTheDocument();
    });

    it('does not display hidden filters', async () => {
      act(() => {
        const { filtersVar } = setup();

        // @todo this test does not work! The setState isn't updating the render.
        filtersVar.setState({
          filters: [
            ...filtersVar.state.filters,
            { key: 'hidden_key', operator: '=', value: 'hidden_val', hidden: true },
            { key: 'visible_key', operator: '=', value: 'visible_val', hidden: false },
          ],
        });
      });

      expect(await screen.findByText('key1 = valLabel1')).toBeInTheDocument();
      expect(await screen.findByText('key2 = valLabel2')).toBeInTheDocument();
      expect(await screen.queryAllByText('hidden_key = hidden_val')).toEqual([]);
      expect(await screen.queryAllByText('visible_key = visible_val')).toEqual([]);
    });

    it('focusing the input opens the key dropdown', async () => {
      await userEvent.click(screen.getByRole('combobox'));

      // check the key dropdown is open
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'key2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'key3' })).toBeInTheDocument();
    });

    it('can remove a filter by clicking the remove button on a chip', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Remove filter with key key1' }));

      // check the filter has been removed without affecting the other
      expect(screen.queryByText('key1 = valLabel1')).not.toBeInTheDocument();
      expect(screen.getByText('key2 = valLabel2')).toBeInTheDocument();

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
      expect(screen.queryByText('key2 = valLabel2')).not.toBeInTheDocument();
      expect(screen.getByText('key1 = valLabel1')).toBeInTheDocument();

      // check focus has reverted back to the input
      expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('can edit filters by clicking the chip', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Edit filter with key key2' }));

      // full chip is removed
      expect(screen.queryByText('key2 = valLabel2')).not.toBeInTheDocument();
      // partial chip values for key and operator are still present
      expect(screen.getByText('key2')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      // input has focus
      expect(screen.getByRole('combobox')).toHaveFocus();
      // with the correct value
      expect(screen.getByRole('combobox')).toHaveValue('valLabel2');
      // and the value dropdown is open
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'valLabel2' })).toBeInTheDocument();

      await userEvent.type(screen.getByRole('combobox'), '{backspace}');
      await userEvent.click(screen.getByRole('option', { name: 'valLabel3' }));

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key2 = valLabel3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
      // other untouched filter should still be there as well
      expect(screen.getByText('key1 = valLabel1')).toBeInTheDocument();
    });

    it('can edit filters with the keyboard', async () => {
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.keyboard('{shift>}{tab}{tab}{/shift}');
      expect(screen.getByRole('button', { name: 'Edit filter with key key2' })).toHaveFocus();
      await userEvent.keyboard('{enter}');

      // full chip is removed
      expect(screen.queryByText('key2 = valLabel2')).not.toBeInTheDocument();
      // partial chip values for key and operator are still present
      expect(screen.getByText('key2')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
      // input has focus
      expect(screen.getByRole('combobox')).toHaveFocus();
      // with the correct value
      expect(screen.getByRole('combobox')).toHaveValue('valLabel2');
      // and the value dropdown is open
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'valLabel2' })).toBeInTheDocument();

      await userEvent.type(screen.getByRole('combobox'), '{backspace}');
      await userEvent.keyboard('{arrowdown}{arrowdown}');
      await userEvent.keyboard('{enter}');

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key2 = valLabel3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
      // other untouched filter should still be there as well
      expect(screen.getByText('key1 = valLabel1')).toBeInTheDocument();
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
      expect(screen.getByRole('option', { name: 'valLabel1' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('option', { name: 'valLabel3' }));

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key3 = valLabel3')).toBeInTheDocument();
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
      expect(screen.getByRole('option', { name: 'valLabel1' })).toBeInTheDocument();

      await userEvent.keyboard('{arrowdown}{arrowdown}');
      await userEvent.keyboard('{enter}');

      // input should be refocused
      expect(screen.getByRole('combobox')).toHaveFocus();
      // full chip committed
      expect(screen.getByText('key3 = valLabel3')).toBeInTheDocument();
      // and key dropdown should be showing
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // check the first option just to be sure
      expect(screen.getByRole('option', { name: 'key1' })).toBeInTheDocument();
    });
  });

  describe('operators', () => {
    it('shows the regex operators when allowCustomValue is undefined', async () => {
      setup();

      const middleKeySelect = screen.getAllByRole('combobox')[1];
      await userEvent.click(middleKeySelect);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      const options = screen.getAllByRole('option').map((option) => option.textContent?.trim());

      expect(options).toEqual([
        '=Equals',
        '!=Not equal',
        '=~Matches regex',
        '!~Does not match regex',
        '<Less than',
        '>Greater than',
      ]);
    });

    it('shows the regex operators when allowCustomValue is set true', async () => {
      setup({
        allowCustomValue: true,
      });

      const middleKeySelect = screen.getAllByRole('combobox')[1];
      await userEvent.click(middleKeySelect);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      const options = screen.getAllByRole('option').map((option) => option.textContent?.trim());

      expect(options).toEqual([
        '=Equals',
        '!=Not equal',
        '=~Matches regex',
        '!~Does not match regex',
        '<Less than',
        '>Greater than',
      ]);
    });

    it('does not show the regex operators when allowCustomValue is set false', async () => {
      setup({
        allowCustomValue: false,
      });

      const middleKeySelect = screen.getAllByRole('combobox')[1];
      await userEvent.click(middleKeySelect);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      const options = screen.getAllByRole('option').map((option) => option.textContent?.trim());

      expect(options).toEqual(['=Equals', '!=Not equal', '<Less than', '>Greater than']);
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

import { DataQueryRequest, DataSourceApi, getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, config } from '@grafana/runtime';
import { act, getAllByRole, render, screen, waitFor } from '@testing-library/react';
import { lastValueFrom, Observable, of } from 'rxjs';
import React from 'react';
import { GroupByVariable, GroupByVariableState } from './GroupByVariable';
import { getRecentGroupingKey } from './GroupByRecommendations';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexLayout, SceneFlexItem } from '../../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import userEvent from '@testing-library/user-event';
import { TestContextProvider } from '../../../utils/test/TestContextProvider';
import { FiltersRequestEnricher } from '../../core/types';
import { allActiveGroupByVariables } from './findActiveGroupByVariablesByUid';
import { MAX_RECENT_DRILLDOWNS, MAX_STORED_RECENT_DRILLDOWNS } from '../adhoc/AdHocFiltersRecommendations';

// 11.1.2 - will use SafeSerializableSceneObject
// 11.1.1 - will NOT use SafeSerializableSceneObject
describe.each(['11.1.2', '11.1.1'])('GroupByVariable', (v) => {
  // const cachedCongif = config;
  beforeEach(() => {
    config.buildInfo.version = v;
  });

  it('should not resolve values from the data source if default options provided', async () => {
    const { variable, getTagKeysSpy } = setupTest({
      defaultOptions: [
        { text: 'a', value: 'a' },
        { text: 'b', value: 'b' },
      ],
    });

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([
        { label: 'a', value: 'a' },
        { label: 'b', value: 'b' },
      ]);
      expect(getTagKeysSpy).not.toHaveBeenCalled();
    });
  });

  it('should resolve values from the data source if default options not provided', async () => {
    const { variable, getTagKeysSpy } = setupTest();

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(getTagKeysSpy).toHaveBeenCalled();
      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([{ label: 'key3', value: 'key3' }]);
    });
  });

  describe('url sync', () => {
    it('should work with default options', () => {
      const { variable } = setupTest({
        defaultOptions: [
          { text: 'a', value: 'a' },
          { text: 'b', value: 'b' },
        ],
      });

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');

      act(() => {
        variable.changeValueTo(['a']);
      });

      expect(locationService.getLocation().search).toBe('?var-test=a');

      act(() => {
        locationService.push('/?var-test=a&var-test=b');
      });

      expect(variable.state.value).toEqual(['a', 'b']);
      expect(variable.state.text).toEqual(['a', 'b']);

      act(() => {
        locationService.push('/?var-test=a&var-test=b&var-test=c');
      });

      expect(variable.state.value).toEqual(['a', 'b', 'c']);
      expect(variable.state.text).toEqual(['a', 'b', 'c']);
    });

    it('should work with received options', async () => {
      const { variable } = setupTest({
        getTagKeysProvider: () => {
          return Promise.resolve({
            replace: true,
            values: [
              { text: 'A', value: 'a' },
              { text: 'b', value: 'b' },
              { text: 'C', value: 'c' },
            ],
          });
        },
      });

      await act(async () => {
        await lastValueFrom(variable.validateAndUpdate());
      });

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');

      act(() => {
        variable.changeValueTo(['a']);
      });

      expect(locationService.getLocation().search).toBe('?var-test=a,A');

      act(() => {
        locationService.push('/?var-test=a,A&var-test=b');
      });

      expect(variable.state.value).toEqual(['a', 'b']);
      expect(variable.state.text).toEqual(['A', 'b']);

      act(() => {
        locationService.push('/?var-test=a,A&var-test=b&var-test=c');
      });

      expect(variable.state.value).toEqual(['a', 'b', 'c']);
      expect(variable.state.text).toEqual(['A', 'b', 'c']);
    });

    it('should work with commas', async () => {
      const { variable } = setupTest({
        defaultOptions: [
          { text: 'A,something', value: 'a' },
          { text: 'B', value: 'b,something' },
        ],
      });

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');

      await act(async () => {
        await lastValueFrom(variable.validateAndUpdate());
      });

      act(() => {
        variable.changeValueTo(['a']);
      });

      expect(locationService.getLocation().search).toBe('?var-test=a,A__gfc__something');

      act(() => {
        locationService.push('/?var-test=a,A__gfc__something&var-test=b__gfc__something');
      });

      expect(variable.state.value).toEqual(['a', 'b,something']);
      expect(variable.state.text).toEqual(['A,something', 'b,something']);

      act(() => {
        locationService.push(
          '/?var-test=a,A__gfc__something&var-test=b__gfc__something&var-test=c__gfc__something,C__gfc__something'
        );
      });

      expect(variable.state.value).toEqual(['a', 'b,something', 'c,something']);
      expect(variable.state.text).toEqual(['A,something', 'b,something', 'C,something']);
    });

    it('should set restorable if value differs from defaultValue', async () => {
      const { variable } = setupTest(
        {
          defaultValue: {
            value: ['defaultVal1'],
            text: ['defaultVal1'],
          },
        },
        undefined,
        '/?var-test=defaultVal1&var-test=normalVal'
      );

      expect(variable.state.value).toEqual(['defaultVal1', 'normalVal']);
      expect(locationService.getLocation().search).toBe(
        '?var-test=defaultVal1&var-test=normalVal&restorable-var-test=true'
      );
    });

    it('should use url value and restore to default', async () => {
      const { variable } = setupTest(
        {
          defaultValue: {
            value: ['defaultVal1'],
            text: ['defaultVal1'],
          },
        },
        undefined,
        '/?var-test=normalVal'
      );

      expect(locationService.getLocation().search).toBe('?var-test=normalVal&restorable-var-test=true');

      act(() => {
        variable.restoreDefaultValues();
      });

      expect(variable.state.value).toEqual(['defaultVal1']);
      expect(locationService.getLocation().search).toBe('?var-test=&restorable-var-test=false');
    });

    it('should use default value if nothing arrives from the url', async () => {
      const { variable } = setupTest({
        defaultValue: {
          value: ['defaultVal1'],
          text: ['defaultVal1'],
        },
      });

      await act(async () => {
        await lastValueFrom(variable.validateAndUpdate());
        expect(locationService.getLocation().search).toBe('?var-test=&restorable-var-test=false');
        expect(variable.state.value).toEqual(['defaultVal1']);
        expect(variable.state.text).toEqual(['defaultVal1']);
      });
    });

    it('should overwrite any existing values with the default value if nothing arrives from the url', async () => {
      const { variable } = setupTest({
        value: ['existingVal1', 'existingVal2'],
        defaultValue: {
          value: ['defaultVal1'],
          text: ['defaultVal1'],
        },
      });

      await act(async () => {
        await lastValueFrom(variable.validateAndUpdate());
        expect(locationService.getLocation().search).toBe('?var-test=&restorable-var-test=false');
        expect(variable.state.value).toEqual(['defaultVal1']);
        expect(variable.state.text).toEqual(['defaultVal1']);
      });
    });

    it('should be able to restore to default values when they exist', () => {
      const { variable } = setupTest(
        {
          defaultValue: {
            value: ['defaultVal1', 'defaultVal2'],
            text: ['defaultVal1', 'defaultVal2'],
          },
        },
        undefined,
        '/?var-test=val1'
      );

      expect(variable.state.value).toEqual(['val1']);
      expect(variable.state.text).toEqual(['val1']);
      expect(variable.state.restorable).toBe(true);

      variable.restoreDefaultValues();

      expect(variable.state.value).toEqual(['defaultVal1', 'defaultVal2']);
      expect(variable.state.text).toEqual(['defaultVal1', 'defaultVal2']);
      expect(variable.state.defaultValue!.value).toEqual(['defaultVal1', 'defaultVal2']);
      expect(variable.state.defaultValue!.text).toEqual(['defaultVal1', 'defaultVal2']);
      expect(variable.state.restorable).toBe(false);
    });

    it('should not set variable as restorable if values are the same as default ones', () => {
      const { variable } = setupTest({
        value: ['defaultVal1', 'defaultVal2'],
        defaultValue: {
          value: ['defaultVal1', 'defaultVal2'],
          text: ['defaultVal1', 'defaultVal2'],
        },
      });

      expect(variable.state.value).toEqual(['defaultVal1', 'defaultVal2']);
    });

    it('should work with browser history action on user action', () => {
      const { variable } = setupTest({
        defaultOptions: [
          { text: 'a', value: 'a' },
          { text: 'b', value: 'b' },
        ],
      });

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');

      act(() => {
        variable.changeValueTo(['a'], undefined, true);
      });

      expect(locationService.getLocation().search).toBe('?var-test=a');

      act(() => {
        locationService.push('/?var-test=a&var-test=b');
      });

      expect(variable.state.value).toEqual(['a', 'b']);
      expect(variable.state.text).toEqual(['a', 'b']);

      act(() => {
        locationService.push('/?var-test=a&var-test=b&var-test=c');
      });

      expect(variable.state.value).toEqual(['a', 'b', 'c']);
      expect(variable.state.text).toEqual(['a', 'b', 'c']);
    });
  });

  it('Can override and replace getTagKeys', async () => {
    const { variable } = setupTest({
      getTagKeysProvider: () => {
        return Promise.resolve({ replace: true, values: [{ text: 'hello', value: '1' }] });
      },
    });

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(variable.state.options).toEqual([{ label: 'hello', value: '1' }]);
    });
  });

  it('Can override and add keys and values', async () => {
    const { variable } = setupTest({
      getTagKeysProvider: () => {
        return Promise.resolve({
          values: [{ text: 'hello', value: '1' }],
        });
      },
    });

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(variable.state.options).toEqual([
        { label: 'key3', value: 'key3' },
        { label: 'hello', value: '1' },
      ]);
    });
  });
  it('Can filter by regex', async () => {
    const { variable } = setupTest({
      tagKeyRegexFilter: new RegExp('x.*'),
    });

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(variable.state.options).toEqual([]);
    });
  });

  it('Should collect and pass respective data source queries to getTagKeys call', async () => {
    const { variable, getTagKeysSpy, timeRange } = setupTest();

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(getTagKeysSpy).toHaveBeenCalled();
      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([{ label: 'key3', value: 'key3' }]);
    });

    expect(getTagKeysSpy).toBeCalledWith({
      filters: [],
      queries: [
        {
          expr: 'my_metric{$filters}',
          refId: 'A',
        },
      ],
      timeRange: timeRange.state.value,
    });
  });

  it('Should apply the filters request enricher to getTagKeys call', async () => {
    const { variable, getTagKeysSpy, timeRange } = setupTest(undefined, () => ({
      key: 'overwrittenKey',
    }));

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
      expect(getTagKeysSpy).toHaveBeenCalled();
      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([{ label: 'key3', value: 'key3' }]);
    });

    expect(getTagKeysSpy).toHaveBeenCalledWith({
      filters: [],
      queries: [
        {
          expr: 'my_metric{$filters}',
          refId: 'A',
        },
      ],
      timeRange: timeRange.state.value,
      key: 'overwrittenKey',
    });
  });

  it('does NOT call addActivationHandler when applyMode is manual', async () => {
    allActiveGroupByVariables.clear();

    const { variable } = setupTest({
      applyMode: 'manual',
    });

    const addActivationHandlerSpy = jest.spyOn(variable, 'addActivationHandler');

    await act(async () => {
      await lastValueFrom(variable.validateAndUpdate());
    });

    expect(addActivationHandlerSpy).not.toHaveBeenCalled();
    expect(allActiveGroupByVariables.size).toBe(0);
  });

  it('shows groups and orders according to first occurrence of a group item', async () => {
    const { runRequest } = setupTest({
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

    const wrapper = screen.getByTestId('GroupBySelect-testGroupBy');
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

  describe('component', () => {
    it('should fetch dimensions when Select is opened', async () => {
      const { variable, getTagKeysSpy } = setupTest();

      expect(variable.isActive).toBe(true);
      expect(getTagKeysSpy).not.toHaveBeenCalled();

      const selects = getAllByRole(screen.getByTestId('GroupBySelect-testGroupBy'), 'combobox');
      await userEvent.click(selects[0]);

      expect(getTagKeysSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear input value when selecting an option from the dropdown', async () => {
      setupTest({
        defaultOptions: [
          { text: 'option1', value: 'option1' },
          { text: 'option2', value: 'option2' },
          { text: 'another', value: 'another' },
        ],
      });

      const groupBySelect = screen.getByTestId('GroupBySelect-testGroupBy');
      const input = groupBySelect.querySelector('input') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      // Open the dropdown and type a search term
      await userEvent.click(input);
      await userEvent.type(input, 'option');

      // Verify the input has the search term
      expect(input.value).toBe('option');

      // Select an option by clicking the checkbox
      const options = screen.getAllByRole('option');
      await userEvent.click(options[0]);

      // Verify the input value is cleared after selection
      expect(input.value).toBe('');
    });

    it('input should show restore icon and be clickable', async () => {
      const { variable } = setupTest(
        {
          defaultValue: {
            value: ['defaultValue'],
            text: ['defaultValue'],
          },
        },
        undefined,
        '/?var-test=val'
      );

      const restore = screen.getByLabelText('Restore groupby set by this dashboard.');

      await userEvent.click(restore);

      expect(screen.queryByLabelText('Restore groupby set by this dashboard.')).not.toBeInTheDocument();
      expect(variable.state.value).toEqual(['defaultValue']);
    });
  });

  describe('_verifyApplicability', () => {
    it('should call getDrilldownsApplicability and update keysApplicability state', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([
        { key: 'key1', applicable: true },
        { key: 'key2', applicable: false },
      ]);

      const { variable } = setupTest({ value: ['key1', 'key2'] }, undefined, undefined, {
        // @ts-expect-error (temporary till we update grafana/data)
        getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
      });

      await act(async () => {
        await variable._verifyApplicability();
      });

      expect(getDrilldownsApplicabilitySpy).toHaveBeenCalledWith({
        groupByKeys: ['key1', 'key2'],
        queries: [
          {
            expr: 'my_metric{$filters}',
            refId: 'A',
          },
        ],
        timeRange: expect.any(Object),
        scopes: undefined,
      });

      expect(variable.state.keysApplicability).toEqual([
        { key: 'key1', applicable: true },
        { key: 'key2', applicable: false },
      ]);
    });

    it('should not set keysApplicability if data source does not support it', async () => {
      const { variable } = setupTest({ value: ['key1'] });

      await act(async () => {
        await variable._verifyApplicability();
      });

      expect(variable.state.keysApplicability).toBeUndefined();
    });

    it('should handle empty response from getDrilldownsApplicability', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue(null);

      const { variable } = setupTest({ value: ['key1'] }, undefined, undefined, {
        // @ts-expect-error (temporary till we update grafana/data)
        getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
      });

      await act(async () => {
        await variable._verifyApplicability();
      });

      expect(getDrilldownsApplicabilitySpy).toHaveBeenCalled();
      expect(variable.state.keysApplicability).toBeUndefined();
    });

    it('should be called during activation handler', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([{ key: 'key1', applicable: true }]);

      const { variable } = setupTest({ value: ['key1'] }, undefined, undefined, {
        // @ts-expect-error (temporary till we update grafana/data)
        getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
      });

      await act(async () => {
        // Wait for activation handler to complete
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(getDrilldownsApplicabilitySpy).toHaveBeenCalled();
      expect(variable.state.keysApplicability).toEqual([{ key: 'key1', applicable: true }]);
    });

    it('should pass values to verifyApplicabilitySpy on blur', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([
        { key: 'existingKey', applicable: true },
        { key: 'newTypedKey', applicable: false },
      ]);

      const { variable } = setupTest(
        {
          value: ['existingKey'],
          defaultOptions: [
            { text: 'existingKey', value: 'existingKey' },
            { text: 'option2', value: 'option2' },
          ],
          allowCustomValue: true,
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      getDrilldownsApplicabilitySpy.mockClear();

      const verifyApplicabilitySpy = jest.spyOn(variable, '_verifyApplicability');

      const groupBySelect = screen.getByTestId('GroupBySelect-testGroupBy');
      const input = groupBySelect.querySelector('input') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      await userEvent.click(input);
      await userEvent.type(input, 'newTypedKey');
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{Escape}');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(verifyApplicabilitySpy).toHaveBeenCalled();
    });

    it('should save keysApplicability', async () => {
      const keysApplicability = [
        { key: 'key1', applicable: true },
        { key: 'key2', applicable: false },
      ];

      const { variable } = setupTest({
        value: ['key1', 'key2'],
        keysApplicability,
      });

      expect(variable.state.keysApplicability).toEqual(keysApplicability);
    });
  });

  describe('getApplicableKeys', () => {
    it('should return all values when keysApplicability is undefined', () => {
      const { variable } = setupTest({
        value: ['key1', 'key2', 'key3'],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return all values when keysApplicability is empty array', () => {
      const { variable } = setupTest({
        value: ['key1', 'key2', 'key3'],
        keysApplicability: [],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should filter out non-applicable keys from array value', () => {
      const { variable } = setupTest({
        value: ['key1', 'key2', 'key3'],
        keysApplicability: [
          { key: 'key1', applicable: true },
          { key: 'key2', applicable: false },
          { key: 'key3', applicable: true },
        ],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual(['key1', 'key3']);
    });

    it('should return applicable key from single string value as array', () => {
      const { variable } = setupTest({
        value: 'key1',
        keysApplicability: [{ key: 'key1', applicable: true }],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual(['key1']);
    });

    it('should keep values that are not in keysApplicability (default to applicable)', () => {
      const { variable } = setupTest({
        value: ['key1', 'key2', 'key3'],
        keysApplicability: [
          { key: 'key1', applicable: false },
          { key: 'key3', applicable: true },
        ],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual(['key2', 'key3']); // key2 not in keysApplicability, so kept
    });

    it('should handle empty value array', () => {
      const { variable } = setupTest({
        value: [],
        keysApplicability: [{ key: 'key1', applicable: false }],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual([]);
    });

    it('should handle empty string value', () => {
      const { variable } = setupTest({
        value: '',
        keysApplicability: [{ key: 'key1', applicable: false }],
      });

      const result = variable.getApplicableKeys();

      expect(result).toEqual([]);
    });
  });

  describe('recent groupings', () => {
    const RECENT_GROUPING_KEY = getRecentGroupingKey('my-ds-uid');

    beforeEach(() => {
      localStorage.removeItem(RECENT_GROUPING_KEY);
    });

    it('should not create drilldown recommendations component if recommendations are disabled', () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: false,
      });

      expect(variable.state._valueRecommendations).toBeUndefined();
    });

    it('should set recentGrouping from browser storage on activation', async () => {
      const recentGrouping = [{ value: 'value1', text: 'value1' }];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGrouping));

      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = variable.state._valueRecommendations;
        expect(recommendations?.recentGrouping).toEqual(recentGrouping);
      });
    });

    it('should add applicable keys to recentGrouping and store in localStorage after verifyApplicabilityAndStoreRecentGrouping', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([{ key: 'value1', applicable: true }]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['value1'],
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      await act(async () => {
        await variable._verifyApplicabilityAndStoreRecentGrouping();
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      expect(JSON.parse(storedGroupings!)).toHaveLength(1);
      expect(JSON.parse(storedGroupings!)[0]).toEqual({ value: 'value1', text: 'value1' });

      const recommendations = variable.state._valueRecommendations;
      expect(recommendations?.recentGrouping).toHaveLength(1);
      expect(recommendations?.recentGrouping![0]).toEqual({ value: 'value1', text: 'value1' });
    });

    it('should not store non-applicable keys in recentGrouping', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([{ key: 'value1', applicable: false }]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['value1'],
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      await act(async () => {
        await variable._verifyApplicabilityAndStoreRecentGrouping();
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      // Nothing should be stored since the only value is non-applicable
      expect(storedGroupings).toBeNull();
      // recentGrouping may be initialized on activation, so check it's empty or undefined
      const recommendations = variable.state._valueRecommendations;
      expect(recommendations?.recentGrouping?.length ?? 0).toBe(0);
    });

    it('should only store applicable keys when some are non-applicable', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([
        { key: 'value1', applicable: true },
        { key: 'value2', applicable: false },
        { key: 'value3', applicable: true },
      ]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['value1', 'value2', 'value3'],
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      await act(async () => {
        await variable._verifyApplicabilityAndStoreRecentGrouping();
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      const parsed = JSON.parse(storedGroupings!);
      expect(parsed).toHaveLength(2);
      expect(parsed.map((g: { value: string }) => g.value)).toEqual(['value1', 'value3']);

      const recommendations = variable.state._valueRecommendations;
      expect(recommendations?.recentGrouping).toHaveLength(2);
    });

    it('should store up to MAX_STORED_RECENT_DRILLDOWNS in localStorage but display MAX_RECENT_DRILLDOWNS', async () => {
      // Pre-populate localStorage with existing groupings
      const existingGroupings = [];
      for (let i = 0; i < MAX_STORED_RECENT_DRILLDOWNS - 2; i++) {
        existingGroupings.push({ value: `existing${i}`, text: `existing${i}` });
      }
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(existingGroupings));

      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([
        { key: 'newValue1', applicable: true },
        { key: 'newValue2', applicable: true },
        { key: 'newValue3', applicable: true },
        { key: 'newValue4', applicable: true },
      ]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['newValue1', 'newValue2', 'newValue3', 'newValue4'],
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      await act(async () => {
        await variable._verifyApplicabilityAndStoreRecentGrouping();
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      expect(JSON.parse(storedGroupings!)).toHaveLength(MAX_STORED_RECENT_DRILLDOWNS);

      const recommendations = variable.state._valueRecommendations;
      expect(recommendations?.recentGrouping!.length).toBeLessThanOrEqual(MAX_RECENT_DRILLDOWNS);
    });

    it('should set in browser storage with applicable values', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([
        { key: 'value1', applicable: true },
        { key: 'value2', applicable: true },
      ]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['value1', 'value2'],
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      await act(async () => {
        await variable._verifyApplicabilityAndStoreRecentGrouping();
      });

      const storedGrouping = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGrouping).toBeDefined();
      expect(JSON.parse(storedGrouping!)).toHaveLength(2);
    });

    it('should not store anything if drilldownRecommendationsEnabled is false', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([{ key: 'value1', applicable: true }]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: false,
          value: ['value1'],
        },
        undefined,
        undefined,
        {
          // @ts-expect-error (temporary till we update grafana/data)
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      await act(async () => {
        await variable._verifyApplicabilityAndStoreRecentGrouping();
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeNull();
      expect(variable.state._valueRecommendations).toBeUndefined();
    });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

export function setupTest(
  overrides?: Partial<GroupByVariableState>,
  filtersRequestEnricher?: FiltersRequestEnricher['enrichFiltersRequest'],
  path?: string,
  dataSourceOverrides?: Partial<DataSourceApi>
) {
  const getTagKeysSpy = jest.fn();
  setDataSourceSrv({
    get() {
      return {
        getTagKeys(options: any) {
          getTagKeysSpy(options);
          return [{ text: 'key3' }];
        },
        getRef() {
          return { uid: 'my-ds-uid' };
        },
        ...dataSourceOverrides,
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

  const variable = new GroupByVariable({
    name: 'test',
    key: 'testGroupBy',
    value: '',
    text: '',
    datasource: { uid: 'my-ds-uid' },
    ...overrides,
  });

  const timeRange = new SceneTimeRange();

  const scene = new EmbeddedScene({
    $timeRange: timeRange,
    $variables: new SceneVariableSet({
      variables: [variable],
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
                expr: 'my_metric{$filters}',
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

  locationService.push(path || '/');

  render(
    <TestContextProvider scene={scene}>
      <scene.Component model={scene} />
    </TestContextProvider>
  );

  return { scene, variable, getTagKeysSpy, timeRange, runRequest: runRequestMock.fn };
}

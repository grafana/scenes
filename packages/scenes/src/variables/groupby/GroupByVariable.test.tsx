import { DataQueryRequest, DataSourceApi, getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, config } from '@grafana/runtime';
import { act, getAllByRole, render, screen } from '@testing-library/react';
import { lastValueFrom, Observable, of } from 'rxjs';
import React from 'react';
import { GroupByVariable, GroupByVariableState } from './GroupByVariable';
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

// 11.1.2 - will use SafeSerializableSceneObject
// 11.1.1 - will NOT use SafeSerializableSceneObject
describe.each(['11.1.2', '11.1.1'])('GroupByVariable', (v) => {
  // const cachedConfig = config;
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

  // TODO enable once this repo is using @grafana/ui@11.1.0
  it.skip('shows groups and orders according to first occurrence of a group item', async () => {
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

  it('should return an observable emitting an empty object when applyMode is manual', async () => {
    const { variable, runRequest } = setupTest({
      applyMode: 'manual',
    });

    await act(async () => {
      const result = await lastValueFrom(variable.validateAndUpdate());
      expect(result).toEqual({});
    });

    expect(runRequest.mock.calls.length).toBe(0);
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
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

export function setupTest(
  overrides?: Partial<GroupByVariableState>,
  filtersRequestEnricher?: FiltersRequestEnricher['enrichFiltersRequest']
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

  locationService.push('/');

  render(
    <TestContextProvider scene={scene}>
      <scene.Component model={scene} />
    </TestContextProvider>
  );

  return { scene, variable, getTagKeysSpy, timeRange, runRequest: runRequestMock.fn };
}

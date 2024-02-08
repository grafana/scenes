import { DataQueryRequest, DataSourceApi, getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest } from '@grafana/runtime';
import { act, render } from '@testing-library/react';
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

describe('GroupByVariable', () => {
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

  it('url sync works', async () => {
    const { variable } = setupTest({
      defaultOptions: [
        { text: 'a', value: 'a' },
        { text: 'b', value: 'b' },
      ],
    });

    expect(variable.state.value).toEqual('');

    act(() => {
      variable.changeValueTo(['a']);
    });

    expect(locationService.getLocation().search).toBe('?var-test=a');

    act(() => {
      locationService.push('/?var-test=a&var-test=b');
    });

    expect(variable.state.value).toEqual(['a', 'b']);
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
    const { variable, getTagKeysSpy } = setupTest();

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
    });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

export function setupTest(overrides?: Partial<GroupByVariableState>) {
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
    value: '',
    text: '',
    datasource: { uid: 'my-ds-uid' },
    ...overrides,
  });

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange(),
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

  locationService.push('/');

  scene.initUrlSync();

  render(<scene.Component model={scene} />);

  return { scene, variable, getTagKeysSpy };
}

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { select, openMenu } from 'react-select-event';

import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, setTemplateSrv } from '@grafana/runtime';

import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { AggregationsSet, AggregationsSetState } from './AggregationsSet';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { DataQueryRequest, DataSourceApi, LoadingState, PanelData, getDefaultTimeRange } from '@grafana/data';
import { Observable, of } from 'rxjs';

const templateSrv = {
  getAdhocdimensions: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as any;

describe('AggregationsSet', () => {
  it('renders existing dimensions', async () => {
    setup();
    expect(await screen.findByText('key1')).toBeInTheDocument();
    expect(await screen.findByText('key2')).toBeInTheDocument();
  });

  // TODO fix this test
  it('can add a dimension', async () => {
    const { aggregationsSet } = setup();

    const aggregationsSelect = await screen.findByRole('combobox');
    await select(aggregationsSelect, 'key3', { container: document.body });
    await userEvent.click(document.body);

    expect(aggregationsSet.state.dimensions.length).toBe(3);
  });

  // TODO fix this test
  it('can remove a dimension', async () => {
    const { aggregationsSet } = setup();

    expect(await screen.findByText('key1')).toBeInTheDocument();
    expect(await screen.findByText('key2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove key1' }));

    expect(screen.queryByText('key1')).not.toBeInTheDocument();
    expect(await screen.findByText('key2')).toBeInTheDocument();
    expect(aggregationsSet.state.dimensions.length).toBe(1);
  });

  it('should collect and pass respective data source queries to getTagKeys call', async () => {
    const { getTagKeysSpy } = setup({ dimensions: [] });

    // Select key
    const aggregationsSelect = await screen.findByRole('combobox');
    openMenu(aggregationsSelect);

    expect(getTagKeysSpy).toBeCalledTimes(1);
    expect(getTagKeysSpy).toBeCalledWith({
      filters: [],
      queries: [
        {
          expr: 'my_metric{$aggregations}',
          refId: 'A',
        },
      ],
    });
  });

  it('url sync works', async () => {
    const { aggregationsSet } = setup();
  
    // wait for the initial aggregations to appear
    await screen.findByText('key1');
    await screen.findByText('key2');

    act(() => {
      aggregationsSet.setState({
        dimensions: ['key2', 'key3']
      });
    });

    expect(locationService.getLocation().search).toBe(
      '?var-aggregations=key2&var-aggregations=key3'
    );
  });

  // TODO fix this test
  it('url sync from empty filters array works', async () => {
    const { aggregationsSet } = setup({ dimensions: [] });
    expect(await screen.findByText('aggregations')).toBeInTheDocument();

    act(() => {
      locationService.push('/?var-aggregations=key2&var-aggregations=key3');
    });
    expect(await screen.findByText('key2')).toBeInTheDocument();
    expect(await screen.findByText('key3')).toBeInTheDocument();

    expect(aggregationsSet.state.dimensions.length).toEqual(2);
  });

  it('can override and replace getTagKeys', async () => {
    const { aggregationsSet } = setup({
      getTagKeysProvider: () => {
        return Promise.resolve({ replace: true, values: [{ text: 'hello', value: '1' }] });
      },
    });
    expect(await screen.findByText('aggregations')).toBeInTheDocument();

    const keys = await aggregationsSet._getKeys(null);
    expect(keys).toEqual([{ label: 'hello', value: '1' }]);
  });

  it('can override and add keys', async () => {
    const { aggregationsSet } = setup({
      getTagKeysProvider: () => {
        return Promise.resolve({ values: [{ text: 'hello', value: '1' }] });
      },
    });
    expect(await screen.findByText('aggregations')).toBeInTheDocument();

    const keys = await aggregationsSet._getKeys(null);
    expect(keys).toEqual([
      { label: 'key3', value: 'key3' },
      { label: 'hello', value: '1' },
    ]);
  });

  it('Can filter by regex', async () => {
    const { aggregationsSet } = setup({
      tagKeyRegexFilter: new RegExp('x.*'),
    });
    expect(await screen.findByText('aggregations')).toBeInTheDocument();

    const keys = await aggregationsSet._getKeys(null);
    expect(keys).toEqual([]);
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

function setup(overrides?: Partial<AggregationsSetState>) {
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

  setTemplateSrv(templateSrv);

  const aggregationsSet = new AggregationsSet({
    datasource: { uid: 'my-ds-uid' },
    name: 'aggregations',
    dimensions: ['key1', 'key2'],
    ...overrides,
  });

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange(),
    $variables: new SceneVariableSet({
      variables: [],
    }),
    controls: [aggregationsSet],
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          $data: new SceneQueryRunner({
            datasource: { uid: 'my-ds-uid' },
            queries: [
              {
                refId: 'A',
                expr: 'my_metric{$aggregations}',
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

  const { unmount } = render(<scene.Component model={scene} />);

  return { scene, aggregationsSet, unmount, runRequest: runRequestMock.fn, getTagKeysSpy };
}

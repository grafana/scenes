import { act, getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { select } from 'react-select-event';

import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, setTemplateSrv } from '@grafana/runtime';

import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { AdHocFilterSet, AdHocFilterSetState } from './AdHocFiltersSet';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { DataQueryRequest, DataSourceApi, LoadingState, PanelData, getDefaultTimeRange } from '@grafana/data';
import { Observable, of } from 'rxjs';

const templateSrv = {
  getAdhocFilters: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as any;

describe('AdHocFilter', () => {
  it('renders filters', async () => {
    await setup();
    expect(screen.getByText('key1')).toBeInTheDocument();
    expect(screen.getByText('val1')).toBeInTheDocument();
    expect(screen.getByText('key2')).toBeInTheDocument();
    expect(screen.getByText('val2')).toBeInTheDocument();
  });

  it('templateSrv.getAdhocFilters patch calls original when scene object is not active', async () => {
    const { unmount } = await setup();
    unmount();

    const result = templateSrv.getAdhocFilters('name');
    expect(result[0].key).toBe('origKey');
  });

  it('adds filter', async () => {
    const { filtersSet } = await setup();

    // Select key
    await userEvent.click(screen.getByTestId('AdHocFilter-add'));
    const wrapper = screen.getByTestId('AdHocFilter-');

    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[0], 'key3', { container: document.body }));
    await waitFor(() => select(selects[2], 'val3', { container: document.body }));

    expect(filtersSet.state.filters.length).toBe(3);
  });

  it('removes filter', async () => {
    const { filtersSet } = await setup();

    await userEvent.click(screen.getByTestId('AdHocFilter-remove-key1'));

    expect(filtersSet.state.filters.length).toBe(1);
  });

  it('changes filter', async () => {
    const { filtersSet, runRequest } = await setup();

    await new Promise((r) => setTimeout(r, 1));

    // should run initial query
    expect(runRequest.mock.calls.length).toBe(1);

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[2], 'val4', { container: document.body }));

    // should run new query when filter changed
    expect(runRequest.mock.calls.length).toBe(2);
    expect(filtersSet.state.filters[0].value).toBe('val4');
  });

  it('url sync works', async () => {
    const { filtersSet } = await setup();

    act(() => {
      filtersSet._updateFilter(filtersSet.state.filters[0], 'value', 'newValue');
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=key1%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.push('/?var-filters=key1|=|valUrl&var-filters=keyUrl|=~|urlVal');
    });

    expect(filtersSet.state.filters[0]).toEqual({ key: 'key1', operator: '=', value: 'valUrl', condition: '' });
    expect(filtersSet.state.filters[1]).toEqual({ key: 'keyUrl', operator: '=~', value: 'urlVal', condition: '' });
  });

  it('url sync from empty filters array works', async () => {
    const { filtersSet } = await setup({ filters: [] });

    await waitFor(() => locationService.push('/?var-filters=key1|=|valUrl&var-filters=keyUrl|=~|urlVal'));

    expect(filtersSet.state.filters.length).toEqual(2);
  });

  it('Can override and replace getTagKeys and getTagValues', async () => {
    const { filtersSet } = await setup({
      getTagKeysProvider: () => {
        return Promise.resolve({ replace: true, values: [{ text: 'hello', value: '1' }] });
      },
      getTagValuesProvider: () => {
        return Promise.resolve({ replace: true, values: [{ text: 'v', value: '2' }] });
      },
    });

    const keys = await filtersSet._getKeys(null);
    expect(keys).toEqual([{ label: 'hello', value: '1' }]);

    const values = await filtersSet._getValuesFor(filtersSet.state.filters[0]);
    expect(values).toEqual([{ label: 'v', value: '2' }]);
  });

  it('Can override and add keys and values', async () => {
    const { filtersSet } = await setup({
      getTagKeysProvider: () => {
        return Promise.resolve({ values: [{ text: 'hello', value: '1' }] });
      },
      getTagValuesProvider: () => {
        return Promise.resolve({ values: [{ text: 'v', value: '2' }] });
      },
    });

    const keys = await filtersSet._getKeys(null);
    expect(keys).toEqual([
      { label: 'key3', value: 'key3' },
      { label: 'hello', value: '1' },
    ]);

    const values = await filtersSet._getValuesFor(filtersSet.state.filters[0]);
    expect(values).toEqual([
      { label: 'val3', value: 'val3' },
      { label: 'val4', value: 'val4' },
      { label: 'v', value: '2' },
    ]);
  });

  it('Can filter by regex', async () => {
    const { filtersSet } = await setup({
      tagKeyRegexFilter: new RegExp('x.*'),
    });

    const keys = await filtersSet._getKeys(null);
    expect(keys).toEqual([]);
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

async function setup(overrides?: Partial<AdHocFilterSetState>) {
  setDataSourceSrv({
    get() {
      return {
        getTagKeys() {
          return [{ text: 'key3' }];
        },
        getTagValues() {
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

  const filtersSet = new AdHocFilterSet({
    name: 'filters',
    filters: [
      {
        key: 'key1',
        operator: '=',
        value: 'val1',
        condition: '',
      },
      {
        key: 'key2',
        operator: '=',
        value: 'val2',
        condition: '',
      },
    ],
    ...overrides,
  });

  const scene = new EmbeddedScene({
    $timeRange: new SceneTimeRange(),
    $variables: new SceneVariableSet({
      variables: [],
    }),
    controls: [filtersSet],
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          $data: new SceneQueryRunner({
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

  const { unmount } = await waitFor(() => render(<scene.Component model={scene} />));

  return { scene, filtersSet, unmount, runRequest: runRequestMock.fn };
}

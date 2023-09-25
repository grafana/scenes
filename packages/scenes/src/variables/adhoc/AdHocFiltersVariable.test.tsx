import { act, getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { select } from 'react-select-event';

import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, setTemplateSrv } from '@grafana/runtime';

import { EmbeddedScene } from '../../components/EmbeddedScene';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
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
    const { variable } = setup();

    // Select key
    await userEvent.click(screen.getByTestId('AdHocFilter-add'));
    const wrapper = screen.getByTestId('AdHocFilter-');

    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[0], 'key3', { container: document.body }));
    await waitFor(() => select(selects[2], 'val3', { container: document.body }));

    expect(variable.state.filters.length).toBe(3);
  });

  it('removes filter', async () => {
    const { variable } = setup();

    await userEvent.click(screen.getByTestId('AdHocFilter-remove-key1'));

    expect(variable.state.filters.length).toBe(1);
  });

  it('changes filter', async () => {
    const { variable, runRequest } = setup();

    const wrapper = screen.getByTestId('AdHocFilter-key1');
    const selects = getAllByRole(wrapper, 'combobox');

    await waitFor(() => select(selects[2], 'val4', { container: document.body }));

    expect(variable.state.filters[0].value).toBe('val4');

    // should run query for scene query runner
    expect(runRequest.mock.calls.length).toBe(2);
  });

  it('url sync works', async () => {
    const { variable } = setup();

    act(() => {
      variable._updateFilter(variable.state.filters[0], 'value', 'newValue');
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=key1%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.push('/?var-filters=key1|=|valUrl&var-filters=keyUrl|=~|urlVal');
    });

    expect(variable.state.filters[0]).toEqual({ key: 'key1', operator: '=', value: 'valUrl' });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

function setup() {
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

  const variable = new AdHocFiltersVariable({
    name: 'filters',
    filters: [
      {
        key: 'key1',
        operator: '=',
        value: 'val1',
      },
      {
        key: 'key2',
        operator: '=',
        value: 'val2',
      },
    ],
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

  const { unmount } = render(<scene.Component model={scene} />);

  return { scene, variable, unmount, runRequest: runRequestMock.fn };
}

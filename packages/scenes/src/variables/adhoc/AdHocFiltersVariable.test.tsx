import React from 'react';
import { act, getAllByRole, render, waitFor, screen } from '@testing-library/react';
import { SceneVariableValueChangedEvent } from '../types';
import { AdHocFiltersVariable, AdHocFiltersVariableState } from './AdHocFiltersVariable';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, setTemplateSrv } from '@grafana/runtime';
import { DataQueryRequest, DataSourceApi, getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
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

    await waitFor(() => select(selects[0], 'key3', { container: document.body }));
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

  it('Should collect and pass respective data source queries to getTagKeys call', async () => {
    const { getTagKeysSpy } = setup({ filters: [] });

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
    });
  });

  it('url sync works', async () => {
    const { filtersVar } = setup();

    act(() => {
      filtersVar._updateFilter(filtersVar.state.filters[0], 'value', 'newValue');
    });

    expect(locationService.getLocation().search).toBe(
      '?var-filters=key1%7C%3D%7CnewValue&var-filters=key2%7C%3D%7Cval2'
    );

    act(() => {
      locationService.push('/?var-filters=key1|=|valUrl&var-filters=keyUrl|=~|urlVal');
    });

    expect(filtersVar.state.filters[0]).toEqual({ key: 'key1', operator: '=', value: 'valUrl', condition: '' });
    expect(filtersVar.state.filters[1]).toEqual({ key: 'keyUrl', operator: '=~', value: 'urlVal', condition: '' });
  });

  it('overrides state when url has empty key', () => {
    const { filtersVar } = setup();

    act(() => {
      locationService.push('/?var-filters=');
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
      locationService.push('/?var-filters=key1|=|valUrl&var-filters=keyUrl|=~|urlVal');
    });

    expect(filtersVar.state.filters.length).toEqual(2);
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
      { label: 'key3', value: 'key3' },
      { label: 'hello', value: '1' },
    ]);

    const values = await filtersVar._getValuesFor(filtersVar.state.filters[0]);
    expect(values).toEqual([
      { label: 'val3', value: 'val3' },
      { label: 'val4', value: 'val4' },
      { label: 'v', value: '2' },
    ]);
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
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
            condition: '',
          },
          {
            key: 'key2',
            operator: '=~',
            value: '[val2]',
            condition: '',
          },
        ],
      });

      variable.activate();

      expect(variable.getValue()).toBe(`key1="val1",key2=~"\\\\[val2\\\\]"`);
    });

    it('Should not update filterExpression state on activation if not needed', () => {
      const variable = new AdHocFiltersVariable({
        applyMode: 'manual',
        datasource: { uid: 'hello' },
        filters: [
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
            condition: '',
          },
        ],
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
        filters: [
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
            condition: '',
          },
        ],
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
        filters: [
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
            condition: '',
          },
        ],
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
        filters: [
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
            condition: '',
          },
        ],
      });

      render(<variable.Component model={variable} />);

      expect(variable.isActive).toBe(true);
    });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

function setup(overrides?: Partial<AdHocFiltersVariableState>) {
  const getTagKeysSpy = jest.fn();
  setDataSourceSrv({
    get() {
      return {
        getTagKeys(options: any) {
          getTagKeysSpy(options);
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

  const filtersVar = new AdHocFiltersVariable({
    datasource: { uid: 'my-ds-uid' },
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

  locationService.push('/');

  scene.initUrlSync();

  const { unmount } = render(<scene.Component model={scene} />);

  return { scene, filtersVar, unmount, runRequest: runRequestMock.fn, getTagKeysSpy };
}

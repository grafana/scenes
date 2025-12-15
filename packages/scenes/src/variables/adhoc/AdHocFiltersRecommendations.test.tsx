import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, setTemplateSrv } from '@grafana/runtime';
import { DataQueryRequest, DataSourceApi, getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { Observable, of } from 'rxjs';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneFlexLayout, SceneFlexItem } from '../../components/layout/SceneFlexLayout';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestContextProvider } from '../../../utils/test/TestContextProvider';
import { VariableValueSelectors } from '../components/VariableValueSelectors';
import { AdHocFiltersVariable, AdHocFiltersVariableState, AdHocFilterWithLabels } from './AdHocFiltersVariable';
import {
  AdHocFiltersRecommendations,
  getRecentFiltersKey,
  MAX_RECENT_DRILLDOWNS,
  MAX_STORED_RECENT_DRILLDOWNS,
} from './AdHocFiltersRecommendations';

const templateSrv = {
  getAdhocFilters: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as any;

describe('AdHocFiltersRecommendations', () => {
  const RECENT_FILTERS_KEY = getRecentFiltersKey('my-ds-uid');

  beforeEach(() => {
    localStorage.removeItem(RECENT_FILTERS_KEY);
    jest.clearAllMocks();
  });

  describe('activation and initialization', () => {
    it('should set recentFilters from browser storage on activation', async () => {
      const recentFilters = [{ key: 'pod', operator: '=|', value: 'test1, test2', values: ['test1', 'test2'] }];
      localStorage.setItem(RECENT_FILTERS_KEY, JSON.stringify(recentFilters));

      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentFilters).toEqual(recentFilters);
      });
    });

    it('should set empty recentFilters when browser storage is empty', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentFilters).toEqual([]);
      });
    });
  });

  describe('storeRecentFilter', () => {
    it('should store filter in localStorage when calling storeRecentFilter', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [{ key: 'cluster', value: '1', operator: '=' }],
      });

      // Wait for recommendations to be available
      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
      });

      const filter: AdHocFilterWithLabels = { key: 'cluster', value: 'newValue', operator: '=' };
      recommendations!.storeRecentFilter(filter);

      const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
      expect(storedFilters).toBeDefined();
      expect(JSON.parse(storedFilters!)).toHaveLength(1);
      expect(JSON.parse(storedFilters!)[0]).toEqual(filter);
    });

    it('should limit stored filters to MAX_STORED_RECENT_DRILLDOWNS', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [],
      });

      // Wait for recommendations to be available
      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
      });

      // Add more filters than the limit
      for (let i = 0; i < MAX_STORED_RECENT_DRILLDOWNS + 2; i++) {
        // Update filters in parent to ensure applicability check passes
        filtersVar.setState({
          filters: [{ key: `key${i}`, value: `value${i}`, operator: '=' }],
        });
        recommendations!.storeRecentFilter({ key: `key${i}`, value: `value${i}`, operator: '=' });
      }

      const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
      expect(storedFilters).toBeDefined();
      expect(JSON.parse(storedFilters!)).toHaveLength(MAX_STORED_RECENT_DRILLDOWNS);
    });

    it('should update state with limited recent filters for display', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [],
      });

      // Wait for recommendations to be available
      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
      });

      // Add more filters than the display limit
      for (let i = 0; i < MAX_RECENT_DRILLDOWNS + 2; i++) {
        filtersVar.setState({
          filters: [{ key: `key${i}`, value: `value${i}`, operator: '=' }],
        });
        recommendations!.storeRecentFilter({ key: `key${i}`, value: `value${i}`, operator: '=' });
      }

      await waitFor(() => {
        expect(recommendations?.state.recentFilters!.length).toBeLessThanOrEqual(MAX_RECENT_DRILLDOWNS);
      });
    });
  });

  describe('addFilterToParent', () => {
    it('should add filter to parent variable', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [{ key: 'existing', value: 'val', operator: '=' }],
      });

      // Wait for recommendations to be available
      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
      });

      const newFilter: AdHocFilterWithLabels = { key: 'newKey', value: 'newVal', operator: '=' };
      recommendations!.addFilterToParent(newFilter);

      expect(filtersVar.state.filters).toHaveLength(2);
      expect(filtersVar.state.filters[1]).toEqual(newFilter);
    });
  });

  describe('integration with parent variable', () => {
    it('should store recent filter when parent variable updates filter', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [{ key: 'cluster', value: '1', operator: '=' }],
      });

      // Wait for recommendations to be available
      await waitFor(() => {
        const recommendations = filtersVar.state._valueRecommendations;
        expect(recommendations).toBeDefined();
      });

      // Update an existing filter - this should trigger storeRecentFilter via the parent
      filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue' });

      await waitFor(() => {
        const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
        expect(storedFilters).toBeDefined();
        expect(JSON.parse(storedFilters!)).toHaveLength(1);
        expect(JSON.parse(storedFilters!)[0]).toMatchObject({ key: 'cluster', value: 'newValue' });
      });
    });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

function setup(overrides?: Partial<AdHocFiltersVariableState>) {
  const getTagKeysSpy = jest.fn();
  const getTagValuesSpy = jest.fn();
  const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([]);
  const getRecommendedDrilldownsSpy = jest.fn().mockResolvedValue({ filters: [] });

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
        getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        getRecommendedDrilldowns: getRecommendedDrilldownsSpy,
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
    $variables: new SceneVariableSet({ variables: [filtersVar] }),
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

  const { unmount } = render(
    <TestContextProvider scene={scene}>
      <scene.Component model={scene} />
    </TestContextProvider>
  );

  return {
    scene,
    filtersVar,
    unmount,
    runRequest: runRequestMock.fn,
    getTagKeysSpy,
    getTagValuesSpy,
    getDrilldownsApplicabilitySpy,
    getRecommendedDrilldownsSpy,
    timeRange,
  };
}

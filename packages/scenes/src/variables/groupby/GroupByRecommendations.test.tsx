import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { DataSourceSrv, locationService, setDataSourceSrv, setRunRequest, config } from '@grafana/runtime';
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
import { GroupByVariable, GroupByVariableState } from './GroupByVariable';
import { GroupByRecommendations, getRecentGroupingKey } from './GroupByRecommendations';
import { MAX_RECENT_DRILLDOWNS, MAX_STORED_RECENT_DRILLDOWNS } from '../adhoc/AdHocFiltersRecommendations';

describe('GroupByRecommendations', () => {
  const RECENT_GROUPING_KEY = getRecentGroupingKey('my-ds-uid');

  beforeEach(() => {
    localStorage.removeItem(RECENT_GROUPING_KEY);
    jest.clearAllMocks();
    config.buildInfo.version = '11.1.2';
  });

  describe('activation and initialization', () => {
    it('should set recentGrouping from browser storage on activation', async () => {
      const recentGroupings = [{ value: 'value1', text: 'value1' }];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGroupings));

      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentGrouping).toEqual(recentGroupings);
      });
    });

    it('should set empty recentGrouping when browser storage is empty', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentGrouping).toEqual([]);
      });
    });
  });

  describe('storeRecentGrouping', () => {
    it('should store grouping in localStorage when calling storeRecentGrouping', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
        value: ['value1'],
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      recommendations!.storeRecentGrouping(['value1']);

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      expect(JSON.parse(storedGroupings!)).toHaveLength(1);
      expect(JSON.parse(storedGroupings!)[0]).toEqual({ value: 'value1', text: 'value1' });
    });

    it('should not store anything when applicableValues is empty', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      recommendations!.storeRecentGrouping([]);

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeNull();
    });

    it('should limit stored groupings to MAX_STORED_RECENT_DRILLDOWNS', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      // Pre-populate with some groupings
      const existingGroupings = [];
      for (let i = 0; i < MAX_STORED_RECENT_DRILLDOWNS - 1; i++) {
        existingGroupings.push({ value: `existing${i}`, text: `existing${i}` });
      }
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(existingGroupings));

      // Store more groupings than the limit
      recommendations!.storeRecentGrouping(['newValue1', 'newValue2', 'newValue3']);

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      expect(JSON.parse(storedGroupings!)).toHaveLength(MAX_STORED_RECENT_DRILLDOWNS);
    });

    it('should update state with limited recent groupings for display', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      // Store more groupings than the display limit
      const manyValues = Array.from({ length: MAX_RECENT_DRILLDOWNS + 2 }, (_, i) => `value${i}`);
      recommendations!.storeRecentGrouping(manyValues);

      await waitFor(() => {
        expect(recommendations!.state.recentGrouping!.length).toBeLessThanOrEqual(MAX_RECENT_DRILLDOWNS);
      });
    });

    it('should replace existing values with the same key', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      // Pre-populate with some groupings
      localStorage.setItem(
        RECENT_GROUPING_KEY,
        JSON.stringify([
          { value: 'value1', text: 'value1' },
          { value: 'value2', text: 'value2' },
        ])
      );

      // Store a value that already exists
      recommendations!.storeRecentGrouping(['value1', 'value3']);

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      const parsed = JSON.parse(storedGroupings!);
      // value2 stays, value1 and value3 are added at the end
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual({ value: 'value2', text: 'value2' });
      expect(parsed[1]).toEqual({ value: 'value1', text: 'value1' });
      expect(parsed[2]).toEqual({ value: 'value3', text: 'value3' });
    });
  });

  describe('addValueToParent', () => {
    it('should add value to parent variable', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
        value: ['existing'],
        text: ['existing'],
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      recommendations!.addValueToParent('newValue', 'newLabel');

      expect(variable.state.value).toEqual(['existing', 'newValue']);
      expect(variable.state.text).toEqual(['existing', 'newLabel']);
    });

    it('should not add duplicate values', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
        value: ['existing'],
        text: ['existing'],
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      recommendations!.addValueToParent('existing', 'existing');

      expect(variable.state.value).toEqual(['existing']);
    });

    it('should filter out empty values when adding', async () => {
      const { variable } = setupTest({
        drilldownRecommendationsEnabled: true,
        value: [''],
        text: [''],
      });

      // Wait for recommendations to be available
      let recommendations: GroupByRecommendations | undefined;
      await waitFor(() => {
        recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      recommendations!.addValueToParent('newValue', 'newLabel');

      expect(variable.state.value).toEqual(['newValue']);
      expect(variable.state.text).toEqual(['newLabel']);
    });
  });

  describe('integration with parent variable', () => {
    it('should store recent grouping when parent calls _verifyApplicabilityAndStoreRecentGrouping', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([{ key: 'value1', applicable: true }]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['value1'],
        },
        {
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      // Wait for recommendations to be available
      await waitFor(() => {
        const recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      await variable._verifyApplicabilityAndStoreRecentGrouping();

      await waitFor(() => {
        const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
        expect(storedGroupings).toBeDefined();
        expect(JSON.parse(storedGroupings!)[0]).toEqual({ value: 'value1', text: 'value1' });

        expect(variable.getRecommendations()?.state.recentGrouping).toHaveLength(1);
      });
    });

    it('should not store non-applicable values', async () => {
      const getDrilldownsApplicabilitySpy = jest.fn().mockResolvedValue([{ key: 'value1', applicable: false }]);

      const { variable } = setupTest(
        {
          drilldownRecommendationsEnabled: true,
          value: ['value1'],
        },
        {
          getDrilldownsApplicability: getDrilldownsApplicabilitySpy,
        }
      );

      // Wait for recommendations to be available
      await waitFor(() => {
        const recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      await variable._verifyApplicabilityAndStoreRecentGrouping();

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      // Nothing should be stored since the only value is non-applicable
      expect(storedGroupings).toBeNull();
    });
  });

  describe('subscriptions', () => {
    it('should recompute recommendations and recent groupings when value changes', async () => {
      const recentGroupings = [{ value: 'value1', text: 'value1' }];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGroupings));

      const { variable, getRecommendedDrilldownsSpy, getDrilldownsApplicabilitySpy } = setupTest({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = variable.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const initialRecommendedCalls = getRecommendedDrilldownsSpy.mock.calls.length;
      const initialApplicabilityCalls = getDrilldownsApplicabilitySpy.mock.calls.length;

      variable.setState({
        value: ['newValue'],
        text: ['newValue'],
      });

      await waitFor(() => {
        expect(getRecommendedDrilldownsSpy.mock.calls.length).toBeGreaterThan(initialRecommendedCalls);
        expect(getDrilldownsApplicabilitySpy.mock.calls.length).toBeGreaterThan(initialApplicabilityCalls);
      });
    });
  });
});

const runRequestMock = {
  fn: jest.fn(),
};

let runRequestSet = false;

interface DsOverrides {
  getDrilldownsApplicability?: jest.Mock;
  getRecommendedDrilldowns?: jest.Mock;
}

function setupTest(overrides?: Partial<GroupByVariableState>, dsOverrides?: DsOverrides) {
  const getGroupByKeysSpy = jest.fn().mockResolvedValue([{ text: 'key3', value: 'key3' }]);
  const getDrilldownsApplicabilitySpy = dsOverrides?.getDrilldownsApplicability ?? jest.fn().mockResolvedValue([]);
  const getRecommendedDrilldownsSpy =
    dsOverrides?.getRecommendedDrilldowns ?? jest.fn().mockResolvedValue({ groupByKeys: [] });

  setDataSourceSrv({
    get() {
      return {
        getGroupByKeys(options: any) {
          getGroupByKeysSpy(options);
          return [{ text: 'key3', value: 'key3' }];
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

  const variable = new GroupByVariable({
    name: 'test',
    datasource: { uid: 'my-ds-uid' },
    ...overrides,
  });

  const timeRange = new SceneTimeRange();

  const scene = new EmbeddedScene({
    $timeRange: timeRange,
    $variables: new SceneVariableSet({ variables: [variable] }),
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
    variable,
    unmount,
    runRequest: runRequestMock.fn,
    getGroupByKeysSpy,
    getDrilldownsApplicabilitySpy,
    getRecommendedDrilldownsSpy,
    timeRange,
  };
}

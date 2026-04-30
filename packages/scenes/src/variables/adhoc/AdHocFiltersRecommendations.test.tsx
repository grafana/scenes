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
import {
  AdHocFiltersVariable,
  AdHocFiltersVariableState,
  AdHocFilterWithLabels,
  GROUP_BY_OPERATOR,
} from './AdHocFiltersVariable';
import {
  AdHocFiltersRecommendations,
  getRecentFiltersKey,
  getRecentGroupingKey,
  MAX_RECENT_DRILLDOWNS,
  MAX_STORED_RECENT_DRILLDOWNS,
} from './AdHocFiltersRecommendations';
import { act } from 'react-dom/test-utils';

const templateSrv = {
  getAdhocFilters: jest.fn().mockReturnValue([{ key: 'origKey', operator: '=', value: '' }]),
} as any;

describe('AdHocFiltersRecommendations', () => {
  const RECENT_FILTERS_KEY = getRecentFiltersKey('my-ds-uid');
  const RECENT_GROUPING_KEY = getRecentGroupingKey('my-ds-uid');

  beforeEach(() => {
    localStorage.removeItem(RECENT_FILTERS_KEY);
    localStorage.removeItem(RECENT_GROUPING_KEY);
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
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentFilters).toEqual(recentFilters);
      });
    });

    it('should deduplicate recentFilters loaded from browser storage', async () => {
      const duplicatedFilters = [
        { key: 'pod', operator: '=', value: 'abc' },
        { key: 'cluster', operator: '=', value: 'us-east' },
        { key: 'pod', operator: '=', value: 'abc' },
      ];
      localStorage.setItem(RECENT_FILTERS_KEY, JSON.stringify(duplicatedFilters));

      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentFilters).toEqual([
          { key: 'cluster', operator: '=', value: 'us-east' },
          { key: 'pod', operator: '=', value: 'abc' },
        ]);
      });
    });

    it('should set empty recentFilters when browser storage is empty', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
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
        recommendations = filtersVar.getRecommendations();
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
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        // Add more filters than the limit
        for (let i = 0; i < MAX_STORED_RECENT_DRILLDOWNS + 2; i++) {
          // Update filters in parent to ensure applicability check passes
          filtersVar.setState({
            filters: [{ key: `key${i}`, value: `value${i}`, operator: '=' }],
          });
          recommendations!.storeRecentFilter({ key: `key${i}`, value: `value${i}`, operator: '=' });
        }
      });

      const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
      expect(storedFilters).toBeDefined();
      expect(JSON.parse(storedFilters!)).toHaveLength(MAX_STORED_RECENT_DRILLDOWNS);
    });

    it('should deduplicate when the same filter is stored multiple times', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [{ key: 'cluster', value: 'us-east', operator: '=' }],
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const filter: AdHocFilterWithLabels = { key: 'cluster', value: 'us-east', operator: '=' };

      act(() => {
        recommendations!.storeRecentFilter(filter);
        recommendations!.storeRecentFilter(filter);
        recommendations!.storeRecentFilter(filter);
      });

      const storedFilters = JSON.parse(localStorage.getItem(RECENT_FILTERS_KEY)!);
      expect(storedFilters).toHaveLength(1);
      expect(storedFilters[0]).toEqual(filter);
    });

    it('should move re-added filter to the most recent position and not duplicate', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [{ key: 'cluster', value: '1', operator: '=' }],
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const filterA: AdHocFilterWithLabels = { key: 'cluster', value: 'a', operator: '=' };
      const filterB: AdHocFilterWithLabels = { key: 'cluster', value: 'b', operator: '=' };
      const filterC: AdHocFilterWithLabels = { key: 'cluster', value: 'c', operator: '=' };

      act(() => {
        recommendations!.storeRecentFilter(filterA);
        recommendations!.storeRecentFilter(filterB);
        recommendations!.storeRecentFilter(filterC);
        recommendations!.storeRecentFilter(filterA);
      });

      const storedFilters = JSON.parse(localStorage.getItem(RECENT_FILTERS_KEY)!);
      expect(storedFilters).toHaveLength(3);
      expect(storedFilters).toEqual([filterB, filterC, filterA]);
    });

    it('should update state with limited recent filters for display', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [],
      });

      // Wait for recommendations to be available
      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        // Add more filters than the display limit
        for (let i = 0; i < MAX_RECENT_DRILLDOWNS + 2; i++) {
          filtersVar.setState({
            filters: [{ key: `key${i}`, value: `value${i}`, operator: '=' }],
          });
          recommendations!.storeRecentFilter({ key: `key${i}`, value: `value${i}`, operator: '=' });
        }
      });

      await waitFor(() => {
        expect(recommendations!.state.recentFilters!.length).toBeLessThanOrEqual(MAX_RECENT_DRILLDOWNS);
      });
    });

    it('should not store incomplete filters', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        filters: [{ key: 'cluster', value: '1', operator: '=' }],
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        recommendations!.storeRecentFilter({ key: '', operator: '', value: '' });
        recommendations!.storeRecentFilter({ key: 'cluster', operator: '', value: '' });
        recommendations!.storeRecentFilter({ key: 'cluster', operator: '=', value: '' });
        recommendations!.storeRecentFilter({ key: '', operator: '=', value: 'us-east' });
      });

      expect(localStorage.getItem(RECENT_FILTERS_KEY)).toBeNull();
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
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const newFilter: AdHocFilterWithLabels = { key: 'newKey', value: 'newVal', operator: '=' };

      act(() => {
        recommendations!.addFilterToParent(newFilter);
      });

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
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        // Update an existing filter - this should trigger storeRecentFilter via the parent
        filtersVar._updateFilter(filtersVar.state.filters[0], { value: 'newValue' });
      });

      await waitFor(() => {
        const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
        expect(storedFilters).toBeDefined();
        expect(JSON.parse(storedFilters!)).toHaveLength(1);
        expect(JSON.parse(storedFilters!)[0]).toMatchObject({ key: 'cluster', value: 'newValue' });
      });
    });
  });

  describe('integration with parent variable — groupBy', () => {
    it('should store recent grouping (not recent filter) when editing a groupBy filter via _updateFilter', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
        filters: [
          { key: 'host', value: 'web-1', operator: '=' },
          { key: 'region', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        ],
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const groupByFilter = filtersVar.state.filters.find((f) => f.operator === GROUP_BY_OPERATOR)!;

      act(() => {
        filtersVar._updateFilter(groupByFilter, { key: 'zone', keyLabel: 'zone' });
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      expect(JSON.parse(storedGroupings!)).toContainEqual({ value: 'zone', text: 'zone' });

      const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
      const parsedFilters = storedFilters ? JSON.parse(storedFilters) : [];
      const groupByInFilters = parsedFilters.some((f: AdHocFilterWithLabels) => f.operator === GROUP_BY_OPERATOR);
      expect(groupByInFilters).toBe(false);
    });

    it('should store recent filter (not recent grouping) when editing a regular filter via _updateFilter', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
        filters: [
          { key: 'host', value: 'web-1', operator: '=' },
          { key: 'region', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        ],
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const regularFilter = filtersVar.state.filters.find((f) => f.operator === '=')!;

      act(() => {
        filtersVar._updateFilter(regularFilter, { value: 'web-2' });
      });

      await waitFor(() => {
        const storedFilters = localStorage.getItem(RECENT_FILTERS_KEY);
        expect(storedFilters).toBeDefined();
        expect(JSON.parse(storedFilters!)).toContainEqual(
          expect.objectContaining({ key: 'host', value: 'web-2', operator: '=' })
        );
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      const parsedGroupings = storedGroupings ? JSON.parse(storedGroupings) : [];
      const regularFilterInGroupings = parsedGroupings.some((g: any) => g.value === 'host');
      expect(regularFilterInGroupings).toBe(false);
    });
  });

  describe('subscriptions', () => {
    it('should recompute recommendations and recent filters when filters change', async () => {
      const recentFilters = [{ key: 'pod', operator: '=|', value: 'test1, test2', values: ['test1', 'test2'] }];
      localStorage.setItem(RECENT_FILTERS_KEY, JSON.stringify(recentFilters));

      const { filtersVar, getRecommendedDrilldownsSpy, getDrilldownsApplicabilitySpy } = setup({
        drilldownRecommendationsEnabled: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const initialRecommendedCalls = getRecommendedDrilldownsSpy.mock.calls.length;
      const initialApplicabilityCalls = getDrilldownsApplicabilitySpy.mock.calls.length;

      act(() => {
        filtersVar.setState({
          filters: [{ key: 'key1', operator: '=', value: 'newVal' }],
        });
      });

      await waitFor(() => {
        expect(getRecommendedDrilldownsSpy.mock.calls.length).toBeGreaterThan(initialRecommendedCalls);
        expect(getDrilldownsApplicabilitySpy.mock.calls.length).toBeGreaterThan(initialApplicabilityCalls);
      });
    });
  });

  describe('groupBy recommendations — activation and initialization', () => {
    it('should set recentGrouping from browser storage on activation when enableGroupBy is true', async () => {
      const recentGroupings = [
        { value: 'region', text: 'region' },
        { value: 'zone', text: 'zone' },
      ];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGroupings));

      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentGrouping).toEqual(recentGroupings);
      });
    });

    it('should set empty recentGrouping when browser storage is empty and enableGroupBy is true', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentGrouping).toEqual([]);
      });
    });

    it('should NOT set recentGrouping when enableGroupBy is false', async () => {
      const recentGroupings = [{ value: 'region', text: 'region' }];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGroupings));

      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: false,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentFilters).toBeDefined();
      });

      const recommendations = filtersVar.getRecommendations();
      expect(recommendations?.state.recentGrouping).toBeUndefined();
    });
  });

  describe('storeRecentGrouping', () => {
    it('should store grouping in localStorage when enableGroupBy is true', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        recommendations!.storeRecentGrouping('region');
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeDefined();
      expect(JSON.parse(storedGroupings!)).toHaveLength(1);
      expect(JSON.parse(storedGroupings!)[0]).toEqual({ value: 'region', text: 'region' });
    });

    it('should be a no-op when enableGroupBy is false', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: false,
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        recommendations!.storeRecentGrouping('region');
      });

      const storedGroupings = localStorage.getItem(RECENT_GROUPING_KEY);
      expect(storedGroupings).toBeNull();
      expect(recommendations!.state.recentGrouping).toBeUndefined();
    });

    it('should replace existing values with the same key and preserve ordering', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      localStorage.setItem(
        RECENT_GROUPING_KEY,
        JSON.stringify([
          { value: 'region', text: 'region' },
          { value: 'zone', text: 'zone' },
        ])
      );

      act(() => {
        recommendations!.storeRecentGrouping('region');
      });

      const parsed = JSON.parse(localStorage.getItem(RECENT_GROUPING_KEY)!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({ value: 'zone', text: 'zone' });
      expect(parsed[1]).toEqual({ value: 'region', text: 'region' });
    });

    it('should limit stored groupings to MAX_STORED_RECENT_DRILLDOWNS', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      const existingGroupings = Array.from({ length: MAX_STORED_RECENT_DRILLDOWNS - 1 }, (_, i) => ({
        value: `existing${i}`,
        text: `existing${i}`,
      }));
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(existingGroupings));

      act(() => {
        recommendations!.storeRecentGrouping('newValue1');
        recommendations!.storeRecentGrouping('newValue2');
      });

      const storedGroupings = JSON.parse(localStorage.getItem(RECENT_GROUPING_KEY)!);
      expect(storedGroupings).toHaveLength(MAX_STORED_RECENT_DRILLDOWNS);
    });
  });

  describe('addGroupByToParent', () => {
    it('should add groupBy filter to parent variable when enableGroupBy is true', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
        filters: [{ key: 'host', value: 'web-1', operator: '=' }],
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        recommendations!.addGroupByToParent('region');
      });

      expect(filtersVar.state.filters).toHaveLength(2);
      expect(filtersVar.state.filters[1]).toMatchObject({
        key: 'region',
        operator: GROUP_BY_OPERATOR,
        value: '',
      });
    });

    it('should be a no-op when enableGroupBy is false', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: false,
        filters: [{ key: 'host', value: 'web-1', operator: '=' }],
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        recommendations!.addGroupByToParent('region');
      });

      expect(filtersVar.state.filters).toHaveLength(1);
    });

    it('should not add duplicate groupBy filter', async () => {
      const { filtersVar } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
        filters: [
          { key: 'host', value: 'web-1', operator: '=' },
          { key: 'region', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        ],
      });

      let recommendations: AdHocFiltersRecommendations | undefined;
      await waitFor(() => {
        recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
      });

      act(() => {
        recommendations!.addGroupByToParent('region');
      });

      const groupByFilters = filtersVar.state.filters.filter((f) => f.operator === GROUP_BY_OPERATOR);
      expect(groupByFilters).toHaveLength(1);
    });
  });

  describe('groupBy recommendations — fetch', () => {
    it('should not send groupByKeys in request when enableGroupBy is false', async () => {
      const { filtersVar, getRecommendedDrilldownsSpy } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: false,
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.datasourceSupportsRecommendations).toBe(true);
      });

      await waitFor(() => {
        expect(getRecommendedDrilldownsSpy).toHaveBeenCalled();
      });

      const lastCall = getRecommendedDrilldownsSpy.mock.calls[getRecommendedDrilldownsSpy.mock.calls.length - 1][0];
      expect(lastCall).not.toHaveProperty('groupByKeys');
    });

    it('should send groupByKeys in request when enableGroupBy is true', async () => {
      const { filtersVar, getRecommendedDrilldownsSpy } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
        filters: [
          { key: 'host', value: 'web-1', operator: '=' },
          { key: 'region', operator: GROUP_BY_OPERATOR, value: '', condition: '' },
        ],
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.datasourceSupportsRecommendations).toBe(true);
      });

      await waitFor(() => {
        expect(getRecommendedDrilldownsSpy).toHaveBeenCalled();
      });

      const lastCall = getRecommendedDrilldownsSpy.mock.calls[getRecommendedDrilldownsSpy.mock.calls.length - 1][0];
      expect(lastCall).toHaveProperty('groupByKeys');
      expect(lastCall.groupByKeys).toEqual(['region']);
    });

    it('should set recommendedGrouping state from datasource response when enableGroupBy is true', async () => {
      const { filtersVar, getRecommendedDrilldownsSpy } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      getRecommendedDrilldownsSpy.mockResolvedValue({
        filters: [{ key: 'env', operator: '=', value: 'prod' }],
        groupByKeys: ['region', 'zone'],
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recommendedGrouping).toEqual([
          { value: 'region', text: 'region' },
          { value: 'zone', text: 'zone' },
        ]);
      });
    });

    it('should NOT set recommendedGrouping when enableGroupBy is false even if datasource returns groupByKeys', async () => {
      const { filtersVar, getRecommendedDrilldownsSpy } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: false,
      });

      getRecommendedDrilldownsSpy.mockResolvedValue({
        filters: [{ key: 'env', operator: '=', value: 'prod' }],
        groupByKeys: ['region', 'zone'],
      });

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recommendedFilters).toEqual([{ key: 'env', operator: '=', value: 'prod' }]);
      });

      const recommendations = filtersVar.getRecommendations();
      expect(recommendations?.state.recommendedGrouping).toBeUndefined();
    });
  });

  describe('groupBy recommendations — applicability', () => {
    it('should filter out non-applicable groupings', async () => {
      const recentGroupings = [
        { value: 'region', text: 'region' },
        { value: 'zone', text: 'zone' },
        { value: 'cluster', text: 'cluster' },
      ];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGroupings));

      const { filtersVar, getDrilldownsApplicabilitySpy } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      getDrilldownsApplicabilitySpy.mockResolvedValue([
        { key: 'region', applicable: true },
        { key: 'zone', applicable: false },
        { key: 'cluster', applicable: true },
      ]);

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentGrouping).toEqual([
          { value: 'region', text: 'region' },
          { value: 'cluster', text: 'cluster' },
        ]);
      });
    });

    it('should show all groupings when applicability check returns null', async () => {
      const recentGroupings = [
        { value: 'region', text: 'region' },
        { value: 'zone', text: 'zone' },
      ];
      localStorage.setItem(RECENT_GROUPING_KEY, JSON.stringify(recentGroupings));

      const { filtersVar, getDrilldownsApplicabilitySpy } = setup({
        drilldownRecommendationsEnabled: true,
        enableGroupBy: true,
      });

      getDrilldownsApplicabilitySpy.mockResolvedValue(null);

      await waitFor(() => {
        const recommendations = filtersVar.getRecommendations();
        expect(recommendations).toBeDefined();
        expect(recommendations?.state.recentGrouping).toEqual(recentGroupings);
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

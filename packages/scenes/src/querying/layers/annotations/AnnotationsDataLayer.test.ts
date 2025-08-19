import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  Field,
  PanelData,
  Scope,
  ScopeSpecFilter,
  toDataFrame,
} from '@grafana/data';
import { AnnotationQuery, LoadingState } from '@grafana/schema';
import { map, Observable, of } from 'rxjs';
import { SceneFlexLayout } from '../../../components/layout/SceneFlexLayout';
import { SceneTimeRange } from '../../../core/SceneTimeRange';
import { SceneVariableSet } from '../../../variables/sets/SceneVariableSet';
import { TestScene } from '../../../variables/TestScene';
import { TestVariable } from '../../../variables/variants/TestVariable';
import { SceneDataLayerSet } from '../../SceneDataLayerSet';
import { AnnotationsDataLayer } from './AnnotationsDataLayer';
import { TestSceneWithRequestEnricher } from '../../../utils/test/TestSceneWithRequestEnricher';
import { SafeSerializableSceneObject } from '../../../utils/SafeSerializableSceneObject';
import { config, RefreshEvent } from '@grafana/runtime';
import { ScopesVariable } from '../../../variables/variants/ScopesVariable';
import { act } from 'react-dom/test-utils';

let mockedEvents: Array<Partial<Field>> = [];

const getDataSourceMock = jest.fn().mockReturnValue({
  annotations: {
    prepareAnnotation: (q: AnnotationQuery) => q,
    prepareQuery: (q: AnnotationQuery) => q,
  },
  query: () =>
    of({
      data: [
        toDataFrame({
          fields: mockedEvents,
        }),
      ],
    }),
});

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: PanelData = {
    state: LoadingState.Loading,
    series: [],
    annotations: [
      toDataFrame({
        fields: mockedEvents,
      }),
    ],
    timeRange: request.range,
  };

  return (ds.query(request) as unknown as Observable<DataQueryResponse>).pipe(
    map((packet) => {
      result.state = LoadingState.Done;
      result.annotations = packet.data;

      return result;
    })
  );
});

let sentRequest: DataQueryRequest | undefined;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    sentRequest = request;
    return runRequestMock(ds, request);
  },

  config: {
    buildInfo: {
      version: '1.0.0',
    },
    theme2: {
      visualization: {
        getColorByName: jest.fn().mockReturnValue('red'),
      },
    },
  },
}));

// 11.1.2 - will use SafeSerializableSceneObject
// 11.1.1 - will NOT use SafeSerializableSceneObject
describe.each(['11.1.2', '11.1.1'])('AnnotationsDataLayer', (v) => {
  beforeEach(() => {
    config.buildInfo.version = v;
    runRequestMock.mockClear();
  });

  describe('deduplication', () => {
    it('should remove duplicated annotations', (done) => {
      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { enable: true, iconColor: 'red', name: 'Test' },
      });

      mockedEvents = [
        { name: 'time', values: [1, 2, 2, 5, 5] },
        { name: 'id', values: ['1', '2', '2', '5', '5'] },
        { name: 'text', values: ['t1', 't2', 't3', 't4', 't5'] },
      ];

      layer.activate();

      layer.getResultsStream().subscribe((res) => {
        expect(res.data.series).toBeDefined();
        expect(res.data.series?.[0].length).toBe(3);
        done();
      });
    });

    it('should leave non "panel-alert" event if present', (done) => {
      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { enable: true, iconColor: 'red', name: 'Test' },
      });

      mockedEvents = [
        { name: 'time', values: [1, 2, 2, 5, 5] },
        { name: 'id', values: ['1', '2', '2', '5', '5'] },
        { name: 'text', values: ['t1', 't2', 't3', 't4', 't5'] },
        { name: 'eventType', values: [null, null, 'panel-alert', null, null] },
      ];

      layer.activate();

      layer.getResultsStream().subscribe((res) => {
        expect(res.data.series).toBeDefined();
        expect(res.data.series?.[0].length).toBe(3);
        done();
      });
    });
  });

  describe('variables support', () => {
    describe('When query is using variable that is still loading', () => {
      it('Should not executed query on activate', async () => {
        const variable = new TestVariable({ name: 'A', value: '1' });
        const layer = new AnnotationsDataLayer({
          name: 'Test layer',
          query: { name: 'Test', enable: true, iconColor: 'red', theActualQuery: '$A' },
        });

        const scene = new SceneFlexLayout({
          $variables: new SceneVariableSet({ variables: [variable] }),
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({
            layers: [layer],
          }),
          children: [],
        });

        scene.activate();

        await new Promise((r) => setTimeout(r, 1));

        expect(variable.state.loading).toBe(true);
        expect(layer.state.data?.state).toBe(undefined);
      });

      it('Should not executed query when time range change', async () => {
        const timeRange = new SceneTimeRange();
        const variable = new TestVariable({ name: 'A', value: '1' });

        const layer = new AnnotationsDataLayer({
          name: 'Test layer',
          query: { name: 'Test', enable: true, iconColor: 'red', theActualQuery: '$A' },
        });

        const scene = new SceneFlexLayout({
          $variables: new SceneVariableSet({ variables: [variable] }),
          $timeRange: timeRange,
          $data: new SceneDataLayerSet({
            layers: [layer],
          }),
          children: [],
        });

        scene.activate();

        await new Promise((r) => setTimeout(r, 1));

        timeRange.onRefresh();

        await new Promise((r) => setTimeout(r, 1));

        expect(layer.state.data?.state).toBe(undefined);
      });

      it('Should execute query when variable updates', async () => {
        const variable = new TestVariable({ name: 'A', value: '', query: 'A.*' });

        mockedEvents = [
          { name: 'time', values: [1, 2, 3, 4, 5] },
          { name: 'id', values: ['1', '2', '3', '4', '5'] },
          { name: 'text', values: ['t1', 't2', 't3', 't4', 't5'] },
        ];

        const timeRange = new SceneTimeRange();
        const layer = new AnnotationsDataLayer({
          name: 'Test layer',
          query: { name: 'Test', enable: true, iconColor: 'red', theActualQuery: '$A' },
        });

        const scene = new SceneFlexLayout({
          $variables: new SceneVariableSet({ variables: [variable] }),
          $timeRange: timeRange,
          $data: new SceneDataLayerSet({
            layers: [layer],
          }),
          children: [],
        });

        scene.activate();
        // should execute query when variable completes update
        variable.signalUpdateCompleted();
        await new Promise((r) => setTimeout(r, 1));

        expect(layer.state.data?.state).toBe(LoadingState.Done);
        expect(layer.state.data?.series).toBeDefined();
        expect(layer.state.data?.series?.[0].length).toBe(5);

        variable.changeValueTo('AB');

        await new Promise((r) => setTimeout(r, 1));

        expect(layer.state.data?.series).toBeDefined();
        expect(layer.state.data?.series?.[0].length).toBe(5);

        expect(runRequestMock).toBeCalledTimes(2);
        const { scopedVars } = sentRequest!;

        expect(scopedVars['__sceneObject']).toBeDefined();
        expect((scopedVars['__sceneObject']?.value as SafeSerializableSceneObject).valueOf()).toBe(layer);
        expect(Object.keys(scopedVars)).toMatchInlineSnapshot(`
          [
            "__interval",
            "__interval_ms",
            "__annotation",
            "__sceneObject",
          ]
        `);
      });

      it('Should execute query again after variable changed while inactive', async () => {
        const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
        const layer = new AnnotationsDataLayer({
          name: 'Test layer',
          query: { name: 'Test', enable: true, iconColor: 'red', theActualQuery: '$A' },
        });

        const innerScene = new TestScene({
          $data: layer,
        });

        const scene = new TestScene({
          $variables: new SceneVariableSet({ variables: [variable] }),
          $timeRange: new SceneTimeRange(),
          nested: innerScene,
        });

        scene.activate();
        const deactivateInnerScene = innerScene.activate();

        // should execute query when variable completes update
        variable.signalUpdateCompleted();
        await new Promise((r) => setTimeout(r, 1));
        expect(layer.state.data?.state).toBe(LoadingState.Done);

        // simulate we collapse a part of the scene where this query runner is
        deactivateInnerScene();

        variable.changeValueTo('AB');

        await new Promise((r) => setTimeout(r, 1));
        // Should not execute query
        expect(runRequestMock.mock.calls.length).toBe(1);
        expect(layer.state.data?.state).toBe(LoadingState.Done);

        // now activate again it should detect value change and issue new query
        innerScene.activate();

        await new Promise((r) => setTimeout(r, 1));

        // Should execute query a second time
        expect(runRequestMock.mock.calls.length).toBe(2);
      });

      it('Should execute query again after variable changed while whole scene was inactive', async () => {
        const variable = new TestVariable({ name: 'A', value: 'AA', query: 'A.*' });
        const layer = new AnnotationsDataLayer({
          name: 'Test layer',
          query: { name: 'Test', enable: true, iconColor: 'red', theActualQuery: '$A' },
        });

        const scene = new TestScene({
          $variables: new SceneVariableSet({ variables: [variable] }),
          $timeRange: new SceneTimeRange(),
          $data: new SceneDataLayerSet({
            layers: [layer],
          }),
        });

        const deactivateScene = scene.activate();

        // should execute query when variable completes update
        variable.signalUpdateCompleted();
        await new Promise((r) => setTimeout(r, 1));
        expect(layer.state.data?.state).toBe(LoadingState.Done);

        // Deactivate scene which deactivates SceneVariableSet
        deactivateScene();

        // Now change value
        variable.changeValueTo('AB');
        // Allow rxjs logic time run
        await new Promise((r) => setTimeout(r, 1));
        // Should not execute query
        expect(runRequestMock.mock.calls.length).toBe(1);
        expect(layer.state.data?.state).toBe(LoadingState.Done);

        // now activate again it should detect value change and issue new query
        scene.activate();

        await new Promise((r) => setTimeout(r, 1));

        // Should execute query a second time
        expect(runRequestMock.mock.calls.length).toBe(2);
      });
    });
  });

  describe('enriching annotation query request', () => {
    it('should use data enricher if provided', async () => {
      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { name: 'Test', enable: true, iconColor: 'red', theActualQuery: '$A' },
      });

      const scene = new TestSceneWithRequestEnricher({
        $data: new SceneDataLayerSet({
          layers: [layer],
        }),
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock.mock.calls.length).toBe(1);

      expect(sentRequest?.app).toBe('enriched');
    });
  });

  it('should emit RefreshEvent on enable/disable', async () => {
    const layer = new AnnotationsDataLayer({
      name: 'Test layer',
      query: { name: 'Test', enable: false, iconColor: 'red', theActualQuery: '$A' },
    });

    const scene = new TestScene({
      $timeRange: new SceneTimeRange(),
      $data: new SceneDataLayerSet({
        layers: [layer],
      }),
    });

    scene.activate();

    await new Promise((r) => setTimeout(r, 10));

    const eventHandler = jest.fn();

    scene.subscribeToEvent(RefreshEvent, eventHandler);

    layer.onEnable();

    expect(eventHandler).toHaveBeenCalledTimes(1);

    layer.onDisable();

    expect(eventHandler).toHaveBeenCalledTimes(2);
  });

  describe('scopes support', () => {
    it('should include scopes in query request when available', async () => {
      const scopesVariable = newScopesVariableFromScopeFilters([]);

      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { name: 'Test', enable: true, iconColor: 'red' },
      });

      const scene = new SceneFlexLayout({
        $variables: new SceneVariableSet({ variables: [scopesVariable.scopesVar] }),
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({
          layers: [layer],
        }),
        children: [],
      });

      scene.activate();

      scopesVariable.update();

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock).toHaveBeenCalledTimes(1);
      expect(sentRequest?.scopes).toEqual([
        {
          metadata: { name: `Scope 1` },
          spec: {
            title: `Scope 1`,
            type: 'test',
            description: 'Test scope',
            category: 'test',
            filters: [],
          },
        },
      ]);
    });

    it('should not include scopes in query request when not available', async () => {
      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { name: 'Test', enable: true, iconColor: 'red' },
      });

      const scene = new SceneFlexLayout({
        $timeRange: new SceneTimeRange(),
        $data: new SceneDataLayerSet({
          layers: [layer],
        }),
        children: [],
      });

      scene.activate();

      await new Promise((r) => setTimeout(r, 1));

      expect(runRequestMock).toHaveBeenCalledTimes(1);
      expect(sentRequest?.scopes).toBeUndefined();
    });
  });

  it('should not run query when enable is false', async () => {
    const layer = new AnnotationsDataLayer({
      name: 'Test layer',
      query: { name: 'Test', enable: false, iconColor: 'red', theActualQuery: '$A' },
    });

    const scene = new TestScene({
      $timeRange: new SceneTimeRange(),
      $data: new SceneDataLayerSet({
        layers: [layer],
      }),
    });

    scene.activate();

    await new Promise((r) => setTimeout(r, 1));

    expect(runRequestMock).toHaveBeenCalledTimes(0);
  });
});

function newScopesVariableFromScopeFilters(filters: ScopeSpecFilter[]) {
  const scopes: Scope[] = [
    {
      metadata: { name: `Scope 1` },
      spec: {
        title: `Scope 1`,
        type: 'test',
        description: 'Test scope',
        category: 'test',
        filters,
      },
    },
  ];

  const scopesVar = new ScopesVariable({});

  return {
    scopesVar,
    update: () => {
      act(() => {
        scopesVar.updateStateFromContext({ value: scopes, loading: false });
      });
    },
  };
}

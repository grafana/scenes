import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler, PanelLifecyclePhase } from './VizPanelRenderProfiler';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';
import { EnhancedPanelPerformanceCollector } from '../services/PanelPerformanceCollector';

// Mock writeSceneLog
jest.mock('../utils/writeSceneLog', () => ({
  writeSceneLog: jest.fn(),
}));

// Mock plugin loading to prevent runtime errors
jest.mock('../components/VizPanel/registerRuntimePanelPlugin', () => ({
  loadPanelPluginSync: jest.fn().mockReturnValue({
    meta: {
      id: 'timeseries',
      info: { version: '1.0.0' },
    },
    fieldConfigDefaults: {
      defaults: {},
      overrides: [],
    },
    fieldConfigRegistry: {
      getIfExists: jest.fn().mockReturnValue(undefined),
    },
    dataSupport: {
      annotations: false,
      alertStates: false,
    },
  }),
}));

describe('VizPanelRenderProfiler', () => {
  let panel: VizPanel;
  let profiler: VizPanelRenderProfiler;
  let performanceNowSpy: jest.SpyInstance;
  let collectorSpy: {
    startPanelTracking: jest.SpyInstance;
    startPhase: jest.SpyInstance;
    endPhase: jest.SpyInstance;
    setPluginCacheStatus: jest.SpyInstance;
    setDataMetrics: jest.SpyInstance;
    getPanelMetrics: jest.SpyInstance;
    recordError: jest.SpyInstance;
    updateLongFrameMetrics: jest.SpyInstance;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock performance.now()
    performanceNowSpy = jest.spyOn(performance, 'now');
    performanceNowSpy.mockReturnValue(1000);

    // Create spies for the unified collector methods
    collectorSpy = {
      startPanelTracking: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'startPanelTracking'),
      startPhase: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'startPhase'),
      endPhase: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'endPhase'),
      setPluginCacheStatus: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'setPluginCacheStatus'),
      setDataMetrics: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'setDataMetrics'),
      getPanelMetrics: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'getPanelMetrics'),
      recordError: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'recordError'),
      updateLongFrameMetrics: jest.spyOn(EnhancedPanelPerformanceCollector.prototype, 'updateLongFrameMetrics'),
    };

    // Create test panel
    panel = new VizPanel({
      key: 'test-panel-1',
      pluginId: 'timeseries',
      title: 'Test Panel',
    });

    // Mock panel methods
    jest.spyOn(panel, 'getLegacyPanelId').mockReturnValue(42);
    jest.spyOn(panel, 'getPlugin').mockReturnValue({
      meta: { info: { version: '1.0.0' } },
    } as any);

    // Create profiler - now uses unified collector automatically
    profiler = new VizPanelRenderProfiler();
  });

  afterEach(() => {
    performanceNowSpy.mockRestore();
  });

  describe('Activation', () => {
    it('should activate and extract panel information', () => {
      // Attach profiler directly to the panel
      panel.setState({
        $behaviors: [profiler],
      });

      panel.activate();

      expect(panel.getLegacyPanelId).toHaveBeenCalled();
      expect(panel.getPlugin).toHaveBeenCalled();
      expect(collectorSpy.startPanelTracking).toHaveBeenCalledWith('test-panel-1', '42', 'timeseries', '1.0.0');
    });

    it('should handle missing panel gracefully', () => {
      const profilerWithoutPanel = new VizPanelRenderProfiler();
      const layout = new SceneFlexLayout({
        $behaviors: [profilerWithoutPanel],
        children: [], // Required property for SceneFlexLayout
      });

      expect(() => layout.activate()).not.toThrow();
    });
  });

  describe('Plugin Loading', () => {
    beforeEach(() => {
      // Attach profiler directly to the panel
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();
    });

    it('should track plugin load start', () => {
      profiler.onPluginLoadStart('timeseries');

      expect(collectorSpy.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.PluginLoad);
    });

    it('should track plugin load end', () => {
      profiler.onPluginLoadStart('timeseries');
      performanceNowSpy.mockReturnValue(1100); // 100ms later
      profiler.onPluginLoadEnd({ meta: { id: 'timeseries' } }, false);

      expect(collectorSpy.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.PluginLoad);
      expect(collectorSpy.setPluginCacheStatus).toHaveBeenCalledWith('test-panel-1', false);
    });

    it('should track plugin loaded from cache', () => {
      profiler.onPluginLoadStart('timeseries');
      profiler.onPluginLoadEnd({ meta: { id: 'timeseries' } }, true);

      expect(collectorSpy.setPluginCacheStatus).toHaveBeenCalledWith('test-panel-1', true);
    });
  });

  describe('Query Tracking', () => {
    beforeEach(() => {
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();
    });

    it('should track query start and end', () => {
      profiler.onQueryStart();

      expect(collectorSpy.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      performanceNowSpy.mockReturnValue(1500); // 500ms later
      profiler.onQueryEnd();

      expect(collectorSpy.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);
    });
  });

  describe('Field Config Processing', () => {
    beforeEach(() => {
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();
    });

    it('should track field config processing', () => {
      profiler.onFieldConfigStart();

      expect(collectorSpy.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataProcessing);

      performanceNowSpy.mockReturnValue(1050); // 50ms later
      profiler.onFieldConfigEnd(1000, 5);

      expect(collectorSpy.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataProcessing);
      expect(collectorSpy.setDataMetrics).toHaveBeenCalledWith('test-panel-1', 1000, 5);
    });

    it('should handle missing data metrics', () => {
      profiler.onFieldConfigStart();
      profiler.onFieldConfigEnd();

      expect(collectorSpy.setDataMetrics).not.toHaveBeenCalled();
    });
  });

  describe('Panel State Changes', () => {
    beforeEach(() => {
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();
    });

    it('should track plugin changes', () => {
      const newPlugin = {
        meta: { info: { version: '2.0.0' } },
      };
      jest.spyOn(panel, 'getPlugin').mockReturnValue(newPlugin as any);

      panel.setState({ pluginId: 'graph' });

      // The profiler should update its internal plugin info
      expect(panel.getPlugin).toHaveBeenCalled();
    });
  });

  describe('Get Panel Metrics', () => {
    beforeEach(() => {
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();
    });

    it('should return panel metrics', () => {
      const mockMetrics = {
        panelId: '42',
        panelKey: 'test-panel-1',
        pluginId: 'timeseries',
        pluginLoadTime: 100,
        queryTime: 500,
        dataProcessingTime: 50,
        renderTime: 30,
        totalTime: 680,
      };

      collectorSpy.getPanelMetrics.mockReturnValue(mockMetrics);

      // First activate the profiler to start tracking
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();

      const metrics = profiler.getPanelMetrics();

      expect(collectorSpy.getPanelMetrics).toHaveBeenCalledWith('test-panel-1');
      // S4.0: Metrics now include correlation context
      expect(metrics).toEqual({
        ...mockMetrics,
        correlationContext: {
          interactionId: undefined, // No active interaction in test
          interactionType: undefined,
          interactionSource: undefined,
          interactionStartTime: undefined,
          panelId: '42',
          panelKey: 'test-panel-1',
        },
      });
    });

    it('should return undefined if not tracking', () => {
      const profilerNotActivated = new VizPanelRenderProfiler();
      const metrics = profilerNotActivated.getPanelMetrics();

      expect(metrics).toBeUndefined();
    });
  });

  describe('S3.0 Lifecycle Integration', () => {
    let mockQueryRunner: SceneQueryRunner;

    beforeEach(() => {
      mockQueryRunner = new SceneQueryRunner({
        queries: [{ refId: 'A', expr: 'test_metric' }],
      });

      panel.setState({
        $behaviors: [profiler],
        $data: mockQueryRunner,
      });
      panel.activate();
    });

    it('should track query execution via registerQueryWithController', () => {
      // Test the new query tracking approach
      const mockEntry = {
        type: 'SceneQueryRunner/runQueries',
        origin: panel,
        request: {
          requestId: 'test-query-123',
          interval: '1s',
          intervalMs: 1000,
          range: { from: '2023-01-01', to: '2023-01-02', raw: { from: '2023-01-01', to: '2023-01-02' } },
          scopedVars: {},
          targets: [],
          timezone: 'UTC',
          app: 'grafana',
          startTime: Date.now(),
        },
      } as any;

      profiler._onQueryStarted(mockEntry, 'test-query-123');
      expect(collectorSpy.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      performanceNowSpy.mockReturnValue(1100); // 100ms later
      profiler._onQueryCompleted(mockEntry, 'test-query-123');
      expect(collectorSpy.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);
    });

    it('should track multiple concurrent queries', () => {
      // Test concurrent query tracking
      const mockEntry1 = {
        type: 'SceneQueryRunner/runQueries',
        origin: panel,
        request: {
          requestId: 'query-1',
          interval: '1s',
          intervalMs: 1000,
          range: { from: '2023-01-01', to: '2023-01-02', raw: { from: '2023-01-01', to: '2023-01-02' } },
          scopedVars: {},
          targets: [],
          timezone: 'UTC',
          app: 'grafana',
          startTime: Date.now(),
        },
      } as any;
      const mockEntry2 = {
        type: 'SceneQueryRunner/runQueries',
        origin: panel,
        request: {
          requestId: 'query-2',
          interval: '1s',
          intervalMs: 1000,
          range: { from: '2023-01-01', to: '2023-01-02', raw: { from: '2023-01-01', to: '2023-01-02' } },
          scopedVars: {},
          targets: [],
          timezone: 'UTC',
          app: 'grafana',
          startTime: Date.now(),
        },
      } as any;

      // Reset mock call count for this test
      jest.clearAllMocks();

      // Start first query
      profiler._onQueryStarted(mockEntry1, 'query-1');
      expect(collectorSpy.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      // Start second query (should not call startPhase again)
      profiler._onQueryStarted(mockEntry2, 'query-2');
      expect(collectorSpy.startPhase).toHaveBeenCalledTimes(1);

      // Complete first query (should not call endPhase yet)
      performanceNowSpy.mockReturnValue(1050);
      profiler._onQueryCompleted(mockEntry1, 'query-1');
      expect(collectorSpy.endPhase).not.toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      // Complete second query (should call endPhase)
      performanceNowSpy.mockReturnValue(1100);
      profiler._onQueryCompleted(mockEntry2, 'query-2');
      expect(collectorSpy.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);
    });

    it('should get query count from SceneQueryRunner', () => {
      // Test the _getQueryCount method
      const queryRunner = new SceneQueryRunner({
        queries: [
          { refId: 'A', expr: 'metric1' },
          { refId: 'B', expr: 'metric2' },
          { refId: 'C', expr: 'metric3' },
        ],
      });

      panel.setState({
        $data: queryRunner,
      });

      // Call the private method via field config processing which uses it
      profiler.onFieldConfigStart();
      performanceNowSpy.mockReturnValue(1050);
      profiler.onFieldConfigEnd(1000, 5);

      // The query count should be included in the log (we can't directly test _getQueryCount as it's private)
      // But we can verify the method works by checking that no errors are thrown
      expect(collectorSpy.setDataMetrics).toHaveBeenCalledWith('test-panel-1', 1000, 5);
    });

    it('should get query count from SceneDataTransformer wrapping SceneQueryRunner', () => {
      // Test query count with SceneDataTransformer
      const queryRunner = new SceneQueryRunner({
        queries: [
          { refId: 'A', expr: 'metric1' },
          { refId: 'B', expr: 'metric2' },
        ],
      });

      const dataTransformer = new SceneDataTransformer({
        $data: queryRunner,
        transformations: [],
      });

      panel.setState({
        $data: dataTransformer,
      });

      // Call field config processing which uses _getQueryCount
      profiler.onFieldConfigStart();
      performanceNowSpy.mockReturnValue(1050);
      profiler.onFieldConfigEnd(500, 2);

      // Should work without errors even with wrapped query runner
      expect(collectorSpy.setDataMetrics).toHaveBeenCalledWith('test-panel-1', 500, 2);
    });

    it('should handle cleanup gracefully', () => {
      const deactivate = panel.activate();

      // Deactivate should not throw errors
      expect(() => deactivate()).not.toThrow();
    });
  });
});

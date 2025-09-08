import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler, PanelLifecyclePhase, PanelPerformanceCollectorLike } from './VizPanelRenderProfiler';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';

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
  let mockCollector: PanelPerformanceCollectorLike;
  let performanceNowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock performance.now()
    performanceNowSpy = jest.spyOn(performance, 'now');
    performanceNowSpy.mockReturnValue(1000);

    // Create mock collector
    mockCollector = {
      startPanelTracking: jest.fn(),
      startPhase: jest.fn(),
      endPhase: jest.fn(),
      setPluginCacheStatus: jest.fn(),
      setDataMetrics: jest.fn(),
      getPanelMetrics: jest.fn(),
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

    // Create profiler with mock collector
    profiler = new VizPanelRenderProfiler({ collector: mockCollector });
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
      expect(mockCollector.startPanelTracking).toHaveBeenCalledWith('test-panel-1', '42', 'timeseries', '1.0.0');
    });

    it('should handle missing panel gracefully', () => {
      const profilerWithoutPanel = new VizPanelRenderProfiler({ collector: mockCollector });
      const layout = new SceneFlexLayout({
        $behaviors: [profilerWithoutPanel],
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

      expect(mockCollector.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.PluginLoad);
    });

    it('should track plugin load end', () => {
      profiler.onPluginLoadStart('timeseries');
      performanceNowSpy.mockReturnValue(1100); // 100ms later
      profiler.onPluginLoadEnd({ meta: { id: 'timeseries' } }, false);

      expect(mockCollector.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.PluginLoad);
      expect(mockCollector.setPluginCacheStatus).toHaveBeenCalledWith('test-panel-1', false);
    });

    it('should track plugin loaded from cache', () => {
      profiler.onPluginLoadStart('timeseries');
      profiler.onPluginLoadEnd({ meta: { id: 'timeseries' } }, true);

      expect(mockCollector.setPluginCacheStatus).toHaveBeenCalledWith('test-panel-1', true);
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

      expect(mockCollector.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      performanceNowSpy.mockReturnValue(1500); // 500ms later
      profiler.onQueryEnd();

      expect(mockCollector.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);
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
      profiler.onApplyFieldConfigStart();

      expect(mockCollector.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataProcessing);

      performanceNowSpy.mockReturnValue(1050); // 50ms later
      profiler.onApplyFieldConfigEnd(1000, 5);

      expect(mockCollector.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataProcessing);
      expect(mockCollector.setDataMetrics).toHaveBeenCalledWith('test-panel-1', 1000, 5);
    });

    it('should handle missing data metrics', () => {
      profiler.onApplyFieldConfigStart();
      profiler.onApplyFieldConfigEnd();

      expect(mockCollector.setDataMetrics).not.toHaveBeenCalled();
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

      mockCollector.getPanelMetrics.mockReturnValue(mockMetrics);

      const metrics = profiler.getPanelMetrics();

      expect(mockCollector.getPanelMetrics).toHaveBeenCalledWith('test-panel-1');
      expect(metrics).toEqual(mockMetrics);
    });

    it('should return undefined if not tracking', () => {
      const profilerNotActivated = new VizPanelRenderProfiler({ collector: mockCollector });
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
        request: { requestId: 'test-query-123' },
      };

      profiler._onQueryStarted(mockEntry, 'test-query-123');
      expect(mockCollector.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      performanceNowSpy.mockReturnValue(1100); // 100ms later
      profiler._onQueryCompleted(mockEntry, 'test-query-123');
      expect(mockCollector.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);
    });

    it('should track multiple concurrent queries', () => {
      // Test concurrent query tracking
      const mockEntry1 = {
        type: 'SceneQueryRunner/runQueries',
        origin: panel,
        request: { requestId: 'query-1' },
      };
      const mockEntry2 = {
        type: 'SceneQueryRunner/runQueries',
        origin: panel,
        request: { requestId: 'query-2' },
      };

      // Reset mock call count for this test
      jest.clearAllMocks();

      // Start first query
      profiler._onQueryStarted(mockEntry1, 'query-1');
      expect(mockCollector.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      // Start second query (should not call startPhase again)
      profiler._onQueryStarted(mockEntry2, 'query-2');
      expect(mockCollector.startPhase).toHaveBeenCalledTimes(1);

      // Complete first query (should not call endPhase yet)
      performanceNowSpy.mockReturnValue(1050);
      profiler._onQueryCompleted(mockEntry1, 'query-1');
      expect(mockCollector.endPhase).not.toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);

      // Complete second query (should call endPhase)
      performanceNowSpy.mockReturnValue(1100);
      profiler._onQueryCompleted(mockEntry2, 'query-2');
      expect(mockCollector.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.DataQuery);
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
      profiler.onApplyFieldConfigStart();
      performanceNowSpy.mockReturnValue(1050);
      profiler.onApplyFieldConfigEnd(1000, 5);

      // The query count should be included in the log (we can't directly test _getQueryCount as it's private)
      // But we can verify the method works by checking that no errors are thrown
      expect(mockCollector.setDataMetrics).toHaveBeenCalledWith('test-panel-1', 1000, 5);
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
      profiler.onApplyFieldConfigStart();
      performanceNowSpy.mockReturnValue(1050);
      profiler.onApplyFieldConfigEnd(500, 2);

      // Should work without errors even with wrapped query runner
      expect(mockCollector.setDataMetrics).toHaveBeenCalledWith('test-panel-1', 500, 2);
    });

    it('should handle cleanup gracefully', () => {
      const deactivate = panel.activate();

      // Deactivate should not throw errors
      expect(() => deactivate()).not.toThrow();
    });
  });
});

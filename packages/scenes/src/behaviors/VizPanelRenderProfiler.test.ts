import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler, PanelLifecyclePhase } from './VizPanelRenderProfiler';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';
// PanelPerformanceCollector removed - now using observer pattern

// Mock writeSceneLog
jest.mock('../utils/writeSceneLog', () => ({
  writeSceneLog: jest.fn(),
}));

// Mock ScenePerformanceTracker for observer pattern
const mockScenePerformanceTracker = {
  notifyQueryStart: jest.fn(),
  notifyQueryComplete: jest.fn(),
  notifyPanelOperationStart: jest.fn(),
  notifyPanelOperationComplete: jest.fn(),
  notifyPanelLifecycleStart: jest.fn(),
  notifyPanelLifecycleComplete: jest.fn(),
};

jest.mock('./ScenePerformanceTracker', () => ({
  getScenePerformanceTracker: () => mockScenePerformanceTracker,
  generateOperationId: jest.fn().mockImplementation((type) => `${type}-${Date.now()}`),
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
  // Collector spies removed - using observer pattern now

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock performance.now()
    performanceNowSpy = jest.spyOn(performance, 'now');
    performanceNowSpy.mockReturnValue(1000);

    // Collector spies removed - now using observer pattern for performance tracking

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
      // Observer pattern now handles panel tracking - no direct collector calls
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
      const endPluginLoadCallback = profiler.onPluginLoadStart('timeseries');

      // Verify observer notification was called for operation start
      expect(mockScenePerformanceTracker.notifyPanelOperationStart).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('pluginLoad-'),
          panelId: '42', // Uses panel's legacy ID
          operation: 'pluginLoad',
        })
      );

      // Should return a callback function
      expect(endPluginLoadCallback).toBeInstanceOf(Function);
    });

    it('should track plugin load end', () => {
      const endPluginLoadCallback = profiler.onPluginLoadStart('timeseries');
      performanceNowSpy.mockReturnValue(1100); // 100ms later
      endPluginLoadCallback!({ meta: { id: 'timeseries' } }, false);

      // Verify observer notification was called for operation completion
      expect(mockScenePerformanceTracker.notifyPanelOperationComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('pluginLoad-'),
          panelId: '42', // Uses panel's legacy ID
          operation: 'pluginLoad',
        })
      );
    });

    it('should track plugin loaded from cache', () => {
      const endPluginLoadCallback = profiler.onPluginLoadStart('timeseries');
      endPluginLoadCallback!({ meta: { id: 'timeseries' } }, true);

      // Verify observer notifications were called for both start and completion
      expect(mockScenePerformanceTracker.notifyPanelOperationStart).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('pluginLoad-'),
          operation: 'pluginLoad',
        })
      );
      expect(mockScenePerformanceTracker.notifyPanelOperationComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('pluginLoad-'),
          operation: 'pluginLoad',
          metadata: expect.objectContaining({
            fromCache: true,
          }),
        })
      );
    });
  });

  describe('Query Tracking', () => {
    beforeEach(() => {
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();
    });

    it('should track query start and completion via modern API', () => {
      const mockEntry = {
        type: 'test-query',
        origin: panel,
        request: { requestId: 'test-request-1' },
      } as any;
      const queryId = 'test-query-1';

      const endQueryCallback = profiler.onQueryStarted(performance.now(), mockEntry, queryId);

      // Verify observer notification was called for query start
      expect(mockScenePerformanceTracker.notifyQueryStart).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('query-'),
          panelId: '42', // Uses panel's legacy ID
          queryId: 'test-query-1',
        })
      );

      // Should return a callback function
      expect(endQueryCallback).toBeInstanceOf(Function);

      performanceNowSpy.mockReturnValue(1500); // 500ms later
      endQueryCallback!(performance.now()); // Success case - no error

      // Verify observer notification was called for query completion
      expect(mockScenePerformanceTracker.notifyQueryComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('query-'),
          panelId: '42', // Uses panel's legacy ID
          queryId: 'test-query-1',
        })
      );
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
      const endFieldConfigCallback = profiler.onFieldConfigStart(performance.now());

      // Verify observer notification was called for operation start
      expect(mockScenePerformanceTracker.notifyPanelOperationStart).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('fieldConfig-'),
          panelId: '42', // Uses panel's legacy ID
          operation: 'fieldConfig',
        })
      );

      performanceNowSpy.mockReturnValue(1050); // 50ms later
      endFieldConfigCallback!(1000, 5);

      // Verify observer notification was called for operation completion
      expect(mockScenePerformanceTracker.notifyPanelOperationComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('fieldConfig-'),
          panelId: '42', // Uses panel's legacy ID
          operation: 'fieldConfig',
        })
      );
    });

    it('should handle missing data metrics', () => {
      const endFieldConfigCallback = profiler.onFieldConfigStart(performance.now());
      endFieldConfigCallback?.(performance.now());

      // Observer pattern now handles all data metrics - methods should complete without errors
      expect(profiler).toBeDefined();
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
      // First activate the profiler to start tracking
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();

      const metrics = profiler.getPanelMetrics();

      // Observer pattern now handles metrics collection - getPanelMetrics returns null
      expect(metrics).toBeNull();
    });

    it('should return null if not tracking', () => {
      const profilerNotActivated = new VizPanelRenderProfiler();
      const metrics = profilerNotActivated.getPanelMetrics();

      // Observer pattern now handles metrics collection - always returns null
      expect(metrics).toBeNull();
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

      const endQueryCallback = profiler.onQueryStarted(performance.now(), mockEntry, 'test-query-123');

      // Verify observer notification was called for query start
      expect(mockScenePerformanceTracker.notifyQueryStart).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('query-'),
          panelId: '42', // Uses panel's legacy ID
          queryId: 'test-query-123',
        })
      );

      performanceNowSpy.mockReturnValue(1100); // 100ms later
      endQueryCallback!(performance.now()); // Success case - no error

      // Verify observer notification was called for query completion
      expect(mockScenePerformanceTracker.notifyQueryComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('query-'),
          panelId: '42', // Uses panel's legacy ID
          queryId: 'test-query-123',
        })
      );
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
      const endQuery1Callback = profiler.onQueryStarted(performance.now(), mockEntry1, 'query-1');
      expect(mockScenePerformanceTracker.notifyQueryStart).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('query-'),
          panelId: '42', // Uses panel's legacy ID
          queryId: 'query-1',
        })
      );

      // Start second query (should also notify observer)
      const endQuery2Callback = profiler.onQueryStarted(performance.now(), mockEntry2, 'query-2');
      expect(mockScenePerformanceTracker.notifyQueryStart).toHaveBeenCalledTimes(2);

      // Complete first query
      performanceNowSpy.mockReturnValue(1050);
      endQuery1Callback!(performance.now()); // Success case - no error
      expect(mockScenePerformanceTracker.notifyQueryComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('query-'),
          panelId: '42', // Uses panel's legacy ID
          queryId: 'query-1',
        })
      );

      // Complete second query
      performanceNowSpy.mockReturnValue(1100);
      endQuery2Callback!(performance.now()); // Success case - no error
      expect(mockScenePerformanceTracker.notifyQueryComplete).toHaveBeenCalledTimes(2);
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
      const endFieldConfigCallback = profiler.onFieldConfigStart(performance.now());
      performanceNowSpy.mockReturnValue(1050);
      endFieldConfigCallback!(1000, 5);

      // The query count should be included in observer notifications - verify they were called
      expect(mockScenePerformanceTracker.notifyPanelOperationComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('fieldConfig-'),
          panelId: '42', // Uses panel's legacy ID
          operation: 'fieldConfig',
        })
      );
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
      const endFieldConfigCallback = profiler.onFieldConfigStart(performance.now());
      performanceNowSpy.mockReturnValue(1050);
      endFieldConfigCallback!(500, 2);

      // Should work without errors even with wrapped query runner - verify observer notifications
      expect(mockScenePerformanceTracker.notifyPanelOperationComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringContaining('fieldConfig-'),
          panelId: '42', // Uses panel's legacy ID
          operation: 'fieldConfig',
        })
      );
    });

    it('should use callback pattern for simple render tracking', () => {
      const deactivate = panel.activate();

      const startTime = 1000;
      performanceNowSpy.mockReturnValue(startTime);

      // Call onSimpleRenderStart and get the callback
      const endRenderCallback = profiler.onSimpleRenderStart(startTime);

      // Should return a callback function
      expect(endRenderCallback).toBeInstanceOf(Function);

      // Mock end time
      const endTime = 1050;
      const duration = 50;
      performanceNowSpy.mockReturnValue(endTime);

      // Call the callback to complete the render
      endRenderCallback!(endTime, duration, 'component-to-effects');

      // Should work without errors - the callback handles all the internal logic
      expect(performanceNowSpy).toHaveBeenCalled();

      deactivate();
    });

    it('should return undefined callback when panel key is missing', () => {
      // Create profiler without activating panel (no panelKey)
      const profilerNotActivated = new VizPanelRenderProfiler();

      const callback = profilerNotActivated.onSimpleRenderStart(1000);

      // Should return undefined when panel not properly initialized
      expect(callback).toBeUndefined();
    });

    it('should handle cleanup gracefully', () => {
      const deactivate = panel.activate();

      // Deactivate should not throw errors
      expect(() => deactivate()).not.toThrow();
    });
  });
});

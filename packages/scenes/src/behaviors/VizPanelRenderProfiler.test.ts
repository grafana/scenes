import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler, PanelLifecyclePhase, PanelPerformanceCollectorLike } from './VizPanelRenderProfiler';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';

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

  describe('Render Tracking', () => {
    beforeEach(() => {
      panel.setState({
        $behaviors: [profiler],
      });
      panel.activate();

      // Start tracking first
      profiler.onPluginLoadStart('timeseries');
    });

    it('should track render on _renderCounter change', (done) => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        setTimeout(() => {
          cb(0);

          expect(mockCollector.startPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.Render);
          expect(mockCollector.endPhase).toHaveBeenCalledWith('test-panel-1', PanelLifecyclePhase.Render);

          rafSpy.mockRestore();
          done();
        }, 0);
        return 0;
      });

      // Trigger render by changing _renderCounter
      panel.setState({ _renderCounter: 1 });
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
});

import { VizPanel } from '../components/VizPanel/VizPanel';
import { VizPanelRenderProfiler, PanelLifecyclePhase, PanelPerformanceCollectorLike } from './VizPanelRenderProfiler';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';

// Mock writeSceneLog
jest.mock('../utils/writeSceneLog', () => ({
  writeSceneLog: jest.fn(),
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
      updateLongFrameMetrics: jest.fn(),
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
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });

      layout.activate();

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
      // Create a parent container to avoid circular references
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });
      layout.activate();
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
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });
      layout.activate();
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
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });
      layout.activate();
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
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });
      layout.activate();

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

  describe('Long Frame Detection', () => {
    let mockObserver: any;
    let observeSpy: jest.Mock;
    let disconnectSpy: jest.Mock;

    beforeEach(() => {
      observeSpy = jest.fn();
      disconnectSpy = jest.fn();

      mockObserver = jest.fn((callback) => ({
        observe: observeSpy,
        disconnect: disconnectSpy,
      }));

      // Mock PerformanceObserver
      (global as any).PerformanceObserver = mockObserver;
      (global as any).PerformanceObserver.supportedEntryTypes = ['long-animation-frame'];
    });

    afterEach(() => {
      delete (global as any).PerformanceObserver;
    });

    it('should setup long frame detection when supported', () => {
      const profilerWithLongFrames = new VizPanelRenderProfiler({
        enableLongFrameDetection: true,
        collector: mockCollector,
      });

      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profilerWithLongFrames],
      });
      layout.activate();

      expect(mockObserver).toHaveBeenCalled();
      expect(observeSpy).toHaveBeenCalledWith({
        entryTypes: ['long-animation-frame'],
      });
    });

    it('should track long frames', () => {
      const profilerWithLongFrames = new VizPanelRenderProfiler({
        enableLongFrameDetection: true,
        collector: mockCollector,
      });

      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profilerWithLongFrames],
      });
      layout.activate();

      // Start tracking
      profilerWithLongFrames.onPluginLoadStart('timeseries');

      // Get the callback passed to PerformanceObserver
      const observerCallback = mockObserver.mock.calls[0][0];

      // Simulate long frame entries
      const mockEntries = [
        { duration: 60, entryType: 'long-animation-frame' },
        { duration: 100, entryType: 'long-animation-frame' },
        { duration: 30, entryType: 'long-animation-frame' }, // Should be ignored (< 50ms)
      ];

      observerCallback({
        getEntries: () => mockEntries,
      });

      expect(mockCollector.updateLongFrameMetrics).toHaveBeenCalledTimes(2);
      expect(mockCollector.updateLongFrameMetrics).toHaveBeenCalledWith('test-panel-1', 1, 60);
      expect(mockCollector.updateLongFrameMetrics).toHaveBeenCalledWith('test-panel-1', 1, 100);
    });

    it('should cleanup observer on deactivation', () => {
      const profilerWithLongFrames = new VizPanelRenderProfiler({
        enableLongFrameDetection: true,
        collector: mockCollector,
      });

      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profilerWithLongFrames],
      });
      const deactivate = layout.activate();
      deactivate();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Panel State Changes', () => {
    beforeEach(() => {
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });
      layout.activate();
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
      const layout = new SceneFlexLayout({
        children: [panel],
        $behaviors: [profiler],
      });
      layout.activate();
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

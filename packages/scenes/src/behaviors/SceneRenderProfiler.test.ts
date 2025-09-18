import {
  calculateNetworkTime,
  processRecordedSpans,
  captureNetwork,
  SceneRenderProfiler,
  ADHOC_KEYS_DROPDOWN_INTERACTION,
  ADHOC_VALUES_DROPDOWN_INTERACTION,
  GROUPBY_DIMENSIONS_INTERACTION,
} from './SceneRenderProfiler';
import { SceneQueryControllerLike, SceneComponentInteractionEvent } from './types';

// Mock writeSceneLog to prevent console noise in tests
jest.mock('../utils/writeSceneLog', () => ({
  writeSceneLog: jest.fn(),
  writeSceneLogStyled: jest.fn(),
}));

// Minimal mock query controller - only mocks what SceneRenderProfiler actually uses
const createMockQueryController = (runningQueries = 0): SceneQueryControllerLike => {
  return {
    state: {
      isRunning: false,
      onProfileComplete: jest.fn(),
    },
    runningQueriesCount: jest.fn(() => runningQueries),
  } as unknown as SceneQueryControllerLike;
};

describe('SceneRenderProfiler', () => {
  let originalDocument: any;
  let originalPerformance: any;
  let originalRequestAnimationFrame: any;
  let originalCancelAnimationFrame: any;

  beforeAll(() => {
    // Store originals once
    originalDocument = global.document;
    originalPerformance = global.performance;
    originalRequestAnimationFrame = global.requestAnimationFrame;
    originalCancelAnimationFrame = global.cancelAnimationFrame;
  });

  beforeEach(() => {
    // Setup mocks for each test
    global.document = {
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any;

    global.performance = {
      now: jest.fn(() => Date.now()),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      clearResourceTimings: jest.fn(),
      memory: {
        jsHeapSizeLimit: 1000000,
        usedJSHeapSize: 500000,
        totalJSHeapSize: 800000,
      },
    } as any;

    global.requestAnimationFrame = jest.fn();
    global.cancelAnimationFrame = jest.fn();
  });

  afterAll(() => {
    // Restore originals
    global.document = originalDocument;
    global.performance = originalPerformance;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('should initialize with query controller and return initial state', () => {
    const mockController = createMockQueryController();
    const profiler = new SceneRenderProfiler(mockController);
    expect(profiler.isTailRecording()).toBe(false);
    profiler.cleanup();
  });

  it('should handle edge cases gracefully', () => {
    // Test tab hidden state
    const mockDoc = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(mockDoc, 'hidden', { writable: true, value: true });
    global.document = mockDoc as any;

    let profiler = new SceneRenderProfiler();
    profiler.startProfile('test-hidden'); // Should be skipped
    profiler.cleanup();

    // Test missing performance.memory
    delete (global.performance as any).memory;
    profiler = new SceneRenderProfiler();
    profiler.startProfile('test-no-memory');
    profiler.tryCompletingProfile();
    profiler.cleanup();

    // Test performance API errors
    (global.performance.measure as jest.Mock).mockImplementation(() => {
      throw new Error('Performance API error');
    });
    profiler = new SceneRenderProfiler();
    profiler.startProfile('test-api-error');
    profiler.tryCompletingProfile();
    profiler.cleanup();

    // If we reach here, all edge cases were handled gracefully
    expect(true).toBe(true);
  });
});

describe('Long frame detection integration', () => {
  let profiler: SceneRenderProfiler;
  let mockQueryController: SceneQueryControllerLike;
  let mockObserver: any;

  beforeEach(() => {
    mockQueryController = createMockQueryController();

    // Mock LoAF API
    mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
    };

    global.PerformanceObserver = jest.fn().mockImplementation(() => {
      return mockObserver;
    }) as any;

    Object.defineProperty(global.PerformanceObserver, 'supportedEntryTypes', {
      value: ['long-animation-frame'],
      configurable: true,
    });

    profiler = new SceneRenderProfiler(mockQueryController);
  });

  afterEach(() => {
    profiler.cleanup();
  });

  it('should initialize LoAF observer when starting profile', () => {
    profiler.startProfile('loaf-init-test');

    // Verify LoAF observer was set up
    expect(global.PerformanceObserver).toHaveBeenCalled();
    expect(mockObserver.observe).toHaveBeenCalledWith({
      type: 'long-animation-frame',
      buffered: false,
    });
  });
});

describe('SceneRenderProfiler integration tests', () => {
  // INTEGRATION TESTING STRATEGY:
  // These tests mock browser APIs (performance, requestAnimationFrame, document) to create
  // a controlled environment where we can test the profiler's complex timing behavior.
  // The profiler uses requestAnimationFrame recursively to measure frame durations during
  // "tail recording" - we simulate this by manually executing stored callbacks while
  // advancing mock time, allowing us to test slow frame detection and timing logic.

  let profiler: SceneRenderProfiler;
  let mockQueryController: SceneQueryControllerLike;
  let originalDocument: any;
  let originalPerformance: any;
  let originalRequestAnimationFrame: any;
  let originalCancelAnimationFrame: any;
  let mockTime: number;
  let frameCallbacks: FrameRequestCallback[];

  beforeAll(() => {
    // Store originals once
    originalDocument = global.document;
    originalPerformance = global.performance;
    originalRequestAnimationFrame = global.requestAnimationFrame;
    originalCancelAnimationFrame = global.cancelAnimationFrame;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mockTime = 1000;
    frameCallbacks = [];

    // Setup controlled document mock with writable hidden property
    const mockDocument = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(mockDocument, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
    global.document = mockDocument as any;

    // Setup controlled performance mock with predictable timing
    global.performance = {
      now: jest.fn(() => mockTime),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      clearResourceTimings: jest.fn(),
      memory: {
        jsHeapSizeLimit: 1000000,
        usedJSHeapSize: 500000,
        totalJSHeapSize: 800000,
      },
    } as any;

    // Setup controlled animation frame mock that returns proper IDs
    // Real browser: requestAnimationFrame schedules callbacks before next repaint (~16ms)
    // Test environment: We store callbacks in frameCallbacks array for manual execution
    global.requestAnimationFrame = jest.fn((callback) => {
      const id = frameCallbacks.length + 1; // Start IDs from 1, not 0
      frameCallbacks[id] = callback; // Store callback instead of scheduling it
      return id;
    });

    global.cancelAnimationFrame = jest.fn((id) => {
      if (frameCallbacks[id]) {
        delete frameCallbacks[id]; // Remove the callback from our manual queue
      }
    });

    mockQueryController = createMockQueryController();
    profiler = new SceneRenderProfiler(mockQueryController);
  });

  afterEach(() => {
    profiler.cleanup();
    jest.useRealTimers();
  });

  afterAll(() => {
    // Restore originals
    global.document = originalDocument;
    global.performance = originalPerformance;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  // Helper to simulate animation frames and time progression
  //
  // HOW THIS INTEGRATES WITH SceneRenderProfiler:
  // 1. Profiler calls requestAnimationFrame(measureTrailingFrames) → callback stored in frameCallbacks
  // 2. This function executes those stored callbacks manually while advancing mockTime
  // 3. measureTrailingFrames calculates frameLength = performance.now() - lastFrameTime (parameter)
  // 4. Each frame duration gets recorded in profiler's #recordedTrailingSpans array
  // 5. measureTrailingFrames calls requestAnimationFrame again → new callback stored
  // 6. Process repeats until POST_STORM_WINDOW (2000ms) reached
  // 7. Final callback processes recorded spans and completes profile
  const simulateAnimationFrames = (totalTimeMs: number, frameInterval = 16) => {
    const startTime = mockTime;
    const endTime = startTime + totalTimeMs;

    while (mockTime < endTime) {
      // Check if there are any callbacks to execute (from profiler's requestAnimationFrame calls)
      const currentCallbacks = Object.values(frameCallbacks).filter(Boolean);
      if (currentCallbacks.length === 0) {
        // No more callbacks, profiler has completed or been cancelled
        mockTime = endTime;
        break;
      }

      // Advance mock time by frame interval (simulates browser frame timing)
      // performance.now() will return this updated time to the profiler
      mockTime += frameInterval;

      // Execute profiler's measureTrailingFrames callbacks
      // Clear frameCallbacks first so callbacks can add new ones via requestAnimationFrame
      const callbacksCopy = [...currentCallbacks];
      frameCallbacks = []; // Clear before execution so callbacks can schedule next frames

      callbacksCopy.forEach((callback) => {
        if (typeof callback === 'function') {
          callback(mockTime); // Executes measureTrailingFrames, records frame duration, schedules next frame
        }
      });
    }

    // Ensure we reach the target time (in case loop exited early)
    if (mockTime < endTime) {
      mockTime = endTime;
    }
  };

  // Helper for simulating variable frame durations (for slow frame testing)
  //
  // DIFFERENCE FROM simulateAnimationFrames:
  // - simulateAnimationFrames: Uses consistent frameInterval (16ms) for normal frame simulation
  // - simulateVariableFrames: Uses custom durations for each frame to test slow frame detection
  //
  // SLOW FRAME TESTING INTEGRATION:
  // 1. Pass array like [16, 45, 20, 60, 15] (normal, slow, normal, slow, normal)
  // 2. Each frame duration gets recorded in profiler's #recordedTrailingSpans
  // 3. processRecordedSpans(spans) filters frames using SPAN_THRESHOLD (30ms)
  // 4. Slow frames (>30ms) contribute to final profile duration
  // 5. Tests verify correct filtering and duration calculation
  const simulateVariableFrames = (frameDurations: number[]) => {
    let totalSimulatedTime = 0;

    for (const duration of frameDurations) {
      // Check if profiler still has pending animation frame callbacks
      const currentCallbacks = Object.values(frameCallbacks).filter(Boolean);
      if (currentCallbacks.length === 0) {
        break; // Profiler completed or cancelled
      }

      // Advance time by the specific frame duration (could be 16ms normal or 45ms slow)
      mockTime += duration;
      totalSimulatedTime += duration;

      // Execute profiler's measureTrailingFrames callback
      // This records the frame duration and schedules the next frame measurement
      const callbacksCopy = [...currentCallbacks];
      frameCallbacks = []; // Clear for next requestAnimationFrame call

      callbacksCopy.forEach((callback) => {
        if (typeof callback === 'function') {
          callback(mockTime); // Records duration in #recordedTrailingSpans, schedules next frame
        }
      });
    }

    // Ensure we reach POST_STORM_WINDOW (2000ms) to complete the profile
    // If our variable frames didn't take 2000ms, fill remaining time with normal frames
    const remainingTime = 2000 - totalSimulatedTime;
    if (remainingTime > 0 && Object.values(frameCallbacks).filter(Boolean).length > 0) {
      simulateAnimationFrames(remainingTime, 16);
    }
  };

  // Helper functions to reduce repetition
  const setupProfileTest = (testName: string) => {
    const onProfileComplete = jest.fn();
    mockQueryController.state.onProfileComplete = onProfileComplete;
    profiler.startProfile(testName);
    profiler.tryCompletingProfile();
    expect(profiler.isTailRecording()).toBe(true);
    return onProfileComplete;
  };

  const expectProfileCompletion = (
    onProfileComplete: jest.Mock,
    expected: {
      origin: string;
      duration: number;
      startTs?: number;
      endTs?: number;
      crumbs?: string[];
    }
  ) => {
    expect(profiler.isTailRecording()).toBe(false);
    expect(onProfileComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        startTs: 1000,
        endTs: 1000 + expected.duration,
        ...expected,
      })
    );
  };

  describe('Tail recording integration', () => {
    beforeEach(() => {
      mockQueryController.runningQueriesCount = jest.fn(() => 0);
    });

    it('should complete full profile lifecycle with tail recording', async () => {
      const onProfileComplete = setupProfileTest('dashboard-load');
      simulateAnimationFrames(2000);
      expectProfileCompletion(onProfileComplete, { origin: 'dashboard-load', duration: 16 });
    });

    it('should initiate tail recording and animation frames correctly', () => {
      setupProfileTest('tail-recording-test');
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(Object.keys(frameCallbacks).length).toBeGreaterThan(0);
    });

    it('should cancel current profile when new profile starts during tail recording', () => {
      const onProfileComplete = setupProfileTest('first-profile');

      // Starting a new profile during tail recording should cancel the first profile
      profiler.startProfile('second-profile');

      // Start tail recording for the second profile
      profiler.tryCompletingProfile();
      expect(profiler.isTailRecording()).toBe(true); // Second profile now tail recording

      // The first profile should not complete because it was cancelled
      expect(onProfileComplete).not.toHaveBeenCalled();
    });

    it('should handle tab inactive detection during tail recording', () => {
      setupProfileTest('tab-inactive-test');

      // Execute first frame, then simulate tab inactive
      mockTime += 16;
      const firstCallback = Object.values(frameCallbacks).filter(Boolean)[0];
      frameCallbacks = [];
      firstCallback(mockTime);
      expect(profiler.isTailRecording()).toBe(true);

      mockTime += 1500; // > TAB_INACTIVE_THRESHOLD
      const secondCallback = Object.values(frameCallbacks).filter(Boolean)[0];
      secondCallback(mockTime);
      expect(profiler.isTailRecording()).toBe(false);
    });
  });

  describe('Slow frame recording integration', () => {
    beforeEach(() => {
      mockQueryController.runningQueriesCount = jest.fn(() => 0);
    });

    // Parameterized tests for different frame scenarios
    test.each([
      ['mixed frames', [16, 45, 20, 60, 15], 141, 'frames up to last slow frame: 16+45+20+60'],
      ['only slow frames', [45, 60, 35, 50], 190, 'all frames included: 45+60+35+50'],
      ['only normal frames', [16, 25, 30, 20, 15], 16, 'only first frame per processRecordedSpans logic'],
      ['complex pattern', [10, 40, 15, 25, 55, 20, 30], 145, 'up to last slow frame at index 4: 10+40+15+25+55'],
      ['slow frame at end', [15, 20, 25, 45], 105, 'all frames when last is slow: 15+20+25+45'],
    ])('should record %s correctly', (scenario, frameDurations, expectedDuration, description) => {
      const testName = scenario.replace(' ', '-') + '-test';
      const onProfileComplete = setupProfileTest(testName);
      simulateVariableFrames(frameDurations);
      expectProfileCompletion(onProfileComplete, { origin: testName, duration: expectedDuration });
    });

    it('should verify slow frame time affects performance.measure end timestamp', () => {
      const onProfileComplete = setupProfileTest('performance-measure-test');
      const frameDurations = [20, 50, 30, 40, 25]; // Expected duration: 140ms
      simulateVariableFrames(frameDurations);

      expect(global.performance.measure).toHaveBeenCalledWith(
        'DashboardInteraction performance-measure-test',
        expect.objectContaining({ start: 1000, end: 1140 })
      );
      expectProfileCompletion(onProfileComplete, { origin: 'performance-measure-test', duration: 140 });
    });
  });

  describe('Query controller integration', () => {
    const setQueryCount = (count: number) => {
      mockQueryController.runningQueriesCount = jest.fn(() => count);
    };

    it('should wait for queries to complete before starting tail recording', () => {
      setQueryCount(3);
      profiler.startProfile('waiting-for-queries');
      profiler.tryCompletingProfile();
      expect(profiler.isTailRecording()).toBe(false);

      setQueryCount(0);
      profiler.tryCompletingProfile();
      expect(profiler.isTailRecording()).toBe(true);
    });

    it('should handle multiple tryCompletingProfile calls safely', () => {
      setQueryCount(0);
      profiler.startProfile('multiple-completion-attempts');

      profiler.tryCompletingProfile();
      profiler.tryCompletingProfile();
      profiler.tryCompletingProfile();

      expect(profiler.isTailRecording()).toBe(true);
      expect(() => profiler.tryCompletingProfile()).not.toThrow();
    });

    test.each([
      [2, false],
      [1, false],
      [0, true],
    ])('should handle query state changes: %d queries → tail recording: %s', (queryCount, shouldRecord) => {
      profiler.startProfile('controller-state-test');
      setQueryCount(queryCount);
      profiler.tryCompletingProfile();
      expect(profiler.isTailRecording()).toBe(shouldRecord);
    });

    it('should handle disabled profiling gracefully', () => {
      mockQueryController.state.enableProfiling = false;
      setQueryCount(0);
      profiler.startProfile('disabled-profiling');
      expect(() => profiler.tryCompletingProfile()).not.toThrow();
    });
  });

  describe('Complex cancellation scenarios', () => {
    const expectNoCancelCallback = () => {
      const onProfileComplete = jest.fn();
      mockQueryController.state.onProfileComplete = onProfileComplete;
      simulateAnimationFrames(2000);
      expect(onProfileComplete).not.toHaveBeenCalled();
    };

    it('should handle cancellation during different phases', () => {
      mockQueryController.state.onProfileComplete = jest.fn();

      // Before tail recording
      profiler.startProfile('cancel-before-tail');
      profiler.cancelProfile();
      profiler.tryCompletingProfile();
      expect(profiler.isTailRecording()).toBe(false);

      // During tail recording
      profiler.startProfile('cancel-during-tail');
      profiler.tryCompletingProfile();
      expect(profiler.isTailRecording()).toBe(true);
      profiler.cancelProfile();
      expect(profiler.isTailRecording()).toBe(false);
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle race condition between completion and cancellation', () => {
      setupProfileTest('race-condition-test');
      setTimeout(() => profiler.cancelProfile(), 0);
      jest.advanceTimersByTime(1);
      expectNoCancelCallback();
    });

    it('should handle rapid start/cancel cycles', () => {
      for (let i = 0; i < 5; i++) {
        profiler.startProfile(`rapid-cycle-${i}`);
        if (i % 2 === 0) {
          profiler.tryCompletingProfile();
        }
        profiler.cancelProfile();
      }
      expect(profiler.isTailRecording()).toBe(false);
      expect(() => profiler.startProfile('final-test')).not.toThrow();
    });

    it('should handle cleanup during active tail recording', () => {
      setupProfileTest('cleanup-during-recording');
      profiler.cleanup();
      expect(profiler.isTailRecording()).toBe(false);
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  test.each([
    ['cancelTailRecording', (p: any) => p.cancelTailRecording()],
    ['cancelProfile', (p: any) => p.cancelProfile()],
  ])('should handle animation frame cancellation via %s', (method, cancelFn) => {
    setupProfileTest('animation-frame-test');
    expect(global.requestAnimationFrame).toHaveBeenCalled();

    cancelFn(profiler);
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
    expect(profiler.isTailRecording()).toBe(false);
  });

  it('should handle complete profile lifecycle with crumbs', () => {
    profiler.startProfile('dashboard-load');
    profiler.addCrumb('variables-loaded');

    mockQueryController.runningQueriesCount = jest.fn(() => 3);
    profiler.addCrumb('queries-started');
    profiler.tryCompletingProfile();
    expect(profiler.isTailRecording()).toBe(false);

    mockQueryController.runningQueriesCount = jest.fn(() => 0);
    profiler.addCrumb('all-queries-complete');
    profiler.tryCompletingProfile();
    expect(profiler.isTailRecording()).toBe(true);
  });

  it('should handle profile behavior during active tail recording', () => {
    setupProfileTest('first-interaction');
    profiler.startProfile('second-interaction');

    // Start tail recording for the second profile
    profiler.tryCompletingProfile();
    expect(profiler.isTailRecording()).toBe(true); // Second profile now tail recording

    profiler.cancelProfile();
    expect(profiler.isTailRecording()).toBe(false);
  });

  it('should handle profile cancellation via tab visibility', () => {
    const addEventListenerSpy = jest.spyOn(global.document, 'addEventListener');
    try {
      const freshProfiler = new SceneRenderProfiler(mockQueryController);
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      freshProfiler.startProfile('interrupted-profile');
      freshProfiler.tryCompletingProfile();
      expect(freshProfiler.isTailRecording()).toBe(true);

      const visibilityCall = addEventListenerSpy.mock.calls.find((call) => call[0] === 'visibilitychange');
      const actualHandler = visibilityCall![1];
      Object.defineProperty(global.document, 'hidden', { value: true, writable: true });

      if (typeof actualHandler === 'function') {
        actualHandler(new Event('visibilitychange'));
      } else {
        actualHandler.handleEvent(new Event('visibilitychange'));
      }

      expect(freshProfiler.isTailRecording()).toBe(false);
      Object.defineProperty(global.document, 'hidden', { value: false, writable: true });
      freshProfiler.cleanup();
    } finally {
      addEventListenerSpy.mockRestore();
    }
  });

  describe('Performance API integration', () => {
    beforeEach(() => {
      mockQueryController.runningQueriesCount = jest.fn(() => 0);
    });

    it('should call performance.now() during profiling operations', () => {
      const initialCallCount = (global.performance.now as jest.Mock).mock.calls.length;

      profiler.startProfile('timing-test');

      // Verify performance.now() is called during profile start
      expect(global.performance.now).toHaveBeenCalled();
      expect((global.performance.now as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should call performance.measure with correct parameters during profile completion', () => {
      profiler.startProfile('measure-test');
      profiler.tryCompletingProfile();
      simulateAnimationFrames(3000, 16); // Trigger profile completion

      // Verify performance.measure was called with the correct format
      expect(global.performance.measure).toHaveBeenCalledWith(
        'DashboardInteraction measure-test',
        expect.objectContaining({
          start: 1000, // From mock setup
          end: 1016, // From mock setup
        })
      );
    });

    it('should call performance.getEntriesByType and clearResourceTimings during network capture', () => {
      // Mock network entries
      const mockNetworkEntries = [
        {
          name: 'api/dashboard.json',
          startTime: 1500,
          responseEnd: 1800,
        } as PerformanceResourceTiming,
      ];
      (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockNetworkEntries);

      profiler.startProfile('network-test');
      profiler.tryCompletingProfile();
      simulateAnimationFrames(3000, 16); // Trigger profile completion

      // Verify the profiler captured and processed network data
      expect(global.performance.getEntriesByType).toHaveBeenCalledWith('resource');
      expect(global.performance.clearResourceTimings).toHaveBeenCalled();
    });

    it('should access performance.memory when available during profiling', () => {
      // Ensure memory is available
      (global.performance as any).memory = {
        jsHeapSizeLimit: 1000000,
        usedJSHeapSize: 500000,
        totalJSHeapSize: 800000,
      } as any;

      profiler.startProfile('memory-test');
      profiler.tryCompletingProfile();
      simulateAnimationFrames(3000, 16); // Trigger profile completion

      // Verify memory was accessed (by checking it still exists and wasn't deleted)
      expect((global.performance as any).memory).toBeDefined();
      expect((global.performance as any).memory.jsHeapSizeLimit).toBe(1000000);
    });

    it('should handle missing performance.memory gracefully', () => {
      // Remove performance.memory
      delete (global.performance as any).memory;

      // Should not throw when performance.memory is missing
      expect(() => {
        profiler.startProfile('no-memory-test');
        profiler.tryCompletingProfile();
        simulateAnimationFrames(3000, 16); // Trigger profile completion
      }).not.toThrow();

      // Verify other performance APIs are still called
      expect(global.performance.measure).toHaveBeenCalledWith(
        'DashboardInteraction no-memory-test',
        expect.objectContaining({
          start: 1000, // From mock setup
          end: 1016, // From mock setup
        })
      );
    });

    it('should integrate multiple performance APIs in complex scenarios', () => {
      // Set up comprehensive performance data
      const mockNetworkEntries = [
        {
          name: 'api/dashboard.json',
          startTime: 1500,
          responseEnd: 1650,
        } as PerformanceResourceTiming,
        {
          name: 'api/user.json',
          startTime: 1550,
          responseEnd: 1700,
        } as PerformanceResourceTiming,
      ];
      (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockNetworkEntries);

      (global.performance as any).memory = {
        jsHeapSizeLimit: 2000000,
        usedJSHeapSize: 750000,
        totalJSHeapSize: 1200000,
      } as any;

      profiler.startProfile('complex-integration-test');
      profiler.tryCompletingProfile();
      simulateAnimationFrames(3000, 16); // Trigger profile completion

      // Verify all performance APIs were consumed correctly
      expect(global.performance.now).toHaveBeenCalled();
      expect(global.performance.measure).toHaveBeenCalledWith(
        'DashboardInteraction complex-integration-test',
        expect.objectContaining({
          start: 1000, // From mock setup
          end: 1016, // From mock setup
        })
      );
      expect(global.performance.getEntriesByType).toHaveBeenCalledWith('resource');
      expect(global.performance.clearResourceTimings).toHaveBeenCalled();
      expect((global.performance as any).memory).toBeDefined();
    });

    it('should consume performance APIs during network capture operations', () => {
      // Mock network entries for capture
      const mockNetworkEntries = [
        {
          name: 'api/test.json',
          startTime: 1200,
          responseEnd: 1400,
        } as PerformanceResourceTiming,
      ];
      (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockNetworkEntries);

      profiler.startProfile('network-operations-test');
      profiler.tryCompletingProfile();
      simulateAnimationFrames(3000, 16); // Trigger profile completion

      // Verify all network-related performance APIs were called correctly
      expect(global.performance.getEntriesByType).toHaveBeenCalledWith('resource');
      expect(global.performance.clearResourceTimings).toHaveBeenCalled();
      expect(global.performance.measure).toHaveBeenCalledWith(
        'DashboardInteraction network-operations-test',
        expect.objectContaining({
          start: 1000,
          end: 1016,
        })
      );

      // Verify performance APIs were consumed for network processing
      expect((global.performance.getEntriesByType as jest.Mock).mock.calls.length).toBeGreaterThan(0);
      expect((global.performance.clearResourceTimings as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
  });
});

describe('calculateNetworkTime', () => {
  it('should return 0 for empty array', () => {
    expect(calculateNetworkTime([])).toBe(0);
  });

  it('should return the duration of a single request', () => {
    const requests: PerformanceResourceTiming[] = [{ startTime: 0, responseEnd: 100 } as PerformanceResourceTiming];
    expect(calculateNetworkTime(requests)).toBe(100);
  });

  it('should return the total time for non-overlapping requests', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 100 } as PerformanceResourceTiming,
      { startTime: 200, responseEnd: 300 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(200);
  });

  it('should merge overlapping requests correctly', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 100 } as PerformanceResourceTiming,
      { startTime: 50, responseEnd: 150 } as PerformanceResourceTiming,
      { startTime: 200, responseEnd: 300 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(250); // 0-150 + 200-300 = 150 + 100
  });

  it('should handle multiple overlapping intervals', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 200 } as PerformanceResourceTiming,
      { startTime: 100, responseEnd: 300 } as PerformanceResourceTiming,
      { startTime: 250, responseEnd: 350 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(350); // 0-350 = 350
  });

  it('should sort requests correctly regardless of input order', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 100, responseEnd: 300 } as PerformanceResourceTiming,
      { startTime: 0, responseEnd: 200 } as PerformanceResourceTiming,
      { startTime: 250, responseEnd: 350 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(350);
  });
});

describe('processRecordedSpans', () => {
  it('should return the whole array if the last element is greater than 30', () => {
    const spans = [10, 10, 40];
    expect(processRecordedSpans(spans)).toEqual([10, 10, 40]);
  });

  it('should return up to the last element greater than 30', () => {
    const spans = [10, 20, 30, 40, 60, 10];
    expect(processRecordedSpans(spans)).toEqual([10, 20, 30, 40, 60]);
  });

  it('should return only the first element if all are below or equal to 30', () => {
    const spans = [10, 20, 15, 5];
    expect(processRecordedSpans(spans)).toEqual([10]);
  });

  it('should handle single element above threshold', () => {
    const spans = [50];
    expect(processRecordedSpans(spans)).toEqual([50]);
  });

  it('should handle single element below threshold', () => {
    const spans = [20];
    expect(processRecordedSpans(spans)).toEqual([20]);
  });

  it('should handle empty array gracefully', () => {
    const spans: number[] = [];
    // processRecordedSpans returns [undefined] for empty arrays (doesn't throw)
    expect(() => processRecordedSpans(spans)).not.toThrow();
  });
});

describe('captureNetwork', () => {
  let mockPerformance: any;
  let originalPerformance: any;

  beforeEach(() => {
    originalPerformance = global.performance;
    mockPerformance = {
      getEntriesByType: jest.fn(),
      clearResourceTimings: jest.fn(),
      measure: jest.fn(),
    };
    global.performance = mockPerformance;
  });

  afterEach(() => {
    global.performance = originalPerformance;
    jest.clearAllMocks();
  });

  it('should return 0 when no network entries exist', () => {
    mockPerformance.getEntriesByType.mockReturnValue([]);

    const result = captureNetwork(100, 300);

    expect(result).toBe(0);
  });

  it('should handle captureNetwork with empty entries', () => {
    mockPerformance.getEntriesByType.mockReturnValue([]);
    const result = captureNetwork(100, 300);
    expect(result).toBe(0);
  });

  it('should handle captureNetwork with invalid time windows', () => {
    const mockEntries = [
      {
        name: 'request1.js',
        startTime: 150,
        responseEnd: 250,
      } as PerformanceResourceTiming,
    ];
    mockPerformance.getEntriesByType.mockReturnValue(mockEntries);

    expect(() => {
      const result = captureNetwork(300, 100); // Invalid: endTs < startTs
      expect(typeof result).toBe('number');
    }).not.toThrow();
  });
});

describe('SceneRenderProfiler - Interaction Profiling', () => {
  let profiler: SceneRenderProfiler;
  let mockOnInteractionComplete: jest.Mock<void, [SceneComponentInteractionEvent]>;

  beforeEach(() => {
    mockOnInteractionComplete = jest.fn();

    profiler = new SceneRenderProfiler();
    profiler.setInteractionCompleteHandler(mockOnInteractionComplete);

    // Mock performance.now to return predictable values
    jest
      .spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // startInteraction
      .mockReturnValueOnce(1200); // stopInteraction

    // Mock performance.mark and performance.measure
    jest.spyOn(performance, 'mark').mockImplementation();
    jest.spyOn(performance, 'measure').mockImplementation();
  });

  afterEach(() => {
    profiler.cleanup();
    jest.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should start and stop interaction correctly', () => {
      profiler.startInteraction(ADHOC_KEYS_DROPDOWN_INTERACTION);

      expect(profiler.getCurrentInteraction()).toBe(ADHOC_KEYS_DROPDOWN_INTERACTION);

      profiler.stopInteraction();
      expect(profiler.getCurrentInteraction()).toBe(null);
    });

    it('should handle profiler without query controller callback', () => {
      const standaloneProfiler = new SceneRenderProfiler();

      standaloneProfiler.startInteraction(ADHOC_KEYS_DROPDOWN_INTERACTION);
      expect(standaloneProfiler.getCurrentInteraction()).toBe(ADHOC_KEYS_DROPDOWN_INTERACTION);

      standaloneProfiler.stopInteraction();
      expect(standaloneProfiler.getCurrentInteraction()).toBe(null);

      standaloneProfiler.cleanup();
    });

    it('should cancel existing interaction when starting a new one', () => {
      profiler.startInteraction(ADHOC_KEYS_DROPDOWN_INTERACTION);
      expect(profiler.getCurrentInteraction()).toBe(ADHOC_KEYS_DROPDOWN_INTERACTION);

      profiler.startInteraction(GROUPBY_DIMENSIONS_INTERACTION);
      expect(profiler.getCurrentInteraction()).toBe(GROUPBY_DIMENSIONS_INTERACTION);
    });
  });

  describe('profile completion', () => {
    it('should complete interaction profile correctly', () => {
      // Start a profile first, then interaction
      profiler.startProfile('test-profile');
      profiler.startInteraction(ADHOC_KEYS_DROPDOWN_INTERACTION);
      profiler.stopInteraction();

      expect(mockOnInteractionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: ADHOC_KEYS_DROPDOWN_INTERACTION,
          duration: expect.any(Number),
          networkDuration: expect.any(Number),
          startTs: expect.any(Number),
          endTs: expect.any(Number),
        })
      );
    });

    it('should create performance marks and measures', () => {
      // Start a profile first, then interaction
      profiler.startProfile('test-profile');
      profiler.startInteraction(GROUPBY_DIMENSIONS_INTERACTION);
      profiler.stopInteraction();

      expect(performance.mark).toHaveBeenCalledWith(
        'groupby_dimensions_start',
        expect.objectContaining({ startTime: expect.any(Number) })
      );
      expect(performance.mark).toHaveBeenCalledWith(
        'groupby_dimensions_end',
        expect.objectContaining({ startTime: expect.any(Number) })
      );
      expect(performance.measure).toHaveBeenCalledWith(
        'Interaction_groupby_dimensions',
        'groupby_dimensions_start',
        'groupby_dimensions_end'
      );
    });
  });

  describe('interaction types', () => {
    it('should support all defined interaction types', () => {
      expect(ADHOC_KEYS_DROPDOWN_INTERACTION).toBe('adhoc_keys_dropdown');
      expect(ADHOC_VALUES_DROPDOWN_INTERACTION).toBe('adhoc_values_dropdown');
      expect(GROUPBY_DIMENSIONS_INTERACTION).toBe('groupby_dimensions');
    });

    it('should measure different interaction types', () => {
      const interactions = [
        ADHOC_KEYS_DROPDOWN_INTERACTION,
        ADHOC_VALUES_DROPDOWN_INTERACTION,
        GROUPBY_DIMENSIONS_INTERACTION,
      ];

      const mockCallback = jest.fn();

      const testProfiler = new SceneRenderProfiler();
      testProfiler.setInteractionCompleteHandler(mockCallback);

      interactions.forEach((interaction) => {
        // Start a profile first, then interaction
        testProfiler.startProfile('test-profile');
        testProfiler.startInteraction(interaction);
        testProfiler.stopInteraction();
      });

      expect(mockCallback).toHaveBeenCalledTimes(3);
      const results = mockCallback.mock.calls.map((call) => call[0]);
      interactions.forEach((interaction) => {
        expect(results.some((result) => result.origin === interaction)).toBe(true);
      });

      testProfiler.cleanup();
    });
  });

  describe('error handling', () => {
    it('should handle stopInteraction when no interaction is active', () => {
      expect(() => profiler.stopInteraction()).not.toThrow();
      expect(mockOnInteractionComplete).not.toHaveBeenCalled();
    });
  });
});

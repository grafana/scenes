import { LongFrameDetector, LongFrameEvent } from './LongFrameDetector';

// Mock writeSceneLog to avoid console output during tests
jest.mock('../utils/writeSceneLog', () => ({
  writeSceneLog: jest.fn(),
}));

describe('LongFrameDetector', () => {
  let detector: LongFrameDetector;
  let callback: jest.Mock<void, [LongFrameEvent]>;

  beforeEach(() => {
    callback = jest.fn();
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 16); // Simulate 60fps
      return 1;
    });
    global.cancelAnimationFrame = jest.fn();

    // Mock performance.now
    let time = 0;
    global.performance.now = jest.fn(() => {
      time += 16; // Simulate normal 16ms frames
      return time;
    });
  });

  afterEach(() => {
    if (detector) {
      detector.stop();
    }
    jest.clearAllMocks();
  });

  describe('Manual Frame Tracking', () => {
    beforeEach(() => {
      // Ensure LoAF is not available to force manual tracking
      delete (global as any).PerformanceObserver;
      detector = new LongFrameDetector();
    });

    it('should start manual tracking when LoAF unavailable', () => {
      detector.start(callback);

      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(detector.isTracking()).toBe(true);

      detector.stop();
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
      expect(detector.isTracking()).toBe(false);
    });
  });
});

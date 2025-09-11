import { writeSceneLog } from '../utils/writeSceneLog';

const LONG_FRAME_THRESHOLD = 50; // Threshold for both LoAF and manual tracking (ms)

export interface LongFrameEvent {
  duration: number; // Frame duration in milliseconds
  timestamp: number; // When the frame occurred
  method: 'manual' | 'loaf'; // Which detection method was used
}

export type LongFrameCallback = (event: LongFrameEvent) => void;

/**
 * LongFrameDetector is a module for detecting long animation frames.
 *
 * It supports two detection methods with automatic fallback:
 * 1. LoAF API (default when available): Uses Long Animation Frame API with 50ms threshold
 * 2. Manual tracking (fallback): Uses requestAnimationFrame with configurable threshold (default: 50ms)
 *
 * The detector automatically uses LoAF when available for better attribution and performance,
 * falling back to manual tracking for broader browser support.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing
 */
export class LongFrameDetector {
  #isTracking = false;
  #callback: LongFrameCallback | null = null;

  // Manual tracking state
  #frameTrackingId: number | null = null;
  #lastFrameTime = 0;

  // LoAF tracking state
  #loafObserver: PerformanceObserver | null = null;

  /**
   * Check if LoAF API is available in the browser
   */
  private isLoAFAvailable(): boolean {
    return (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes &&
      PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')
    );
  }

  /**
   * Start detecting long frames and call the provided callback when they occur
   */
  public start(callback: LongFrameCallback): void {
    if (this.#isTracking) {
      writeSceneLog('LongFrameDetector', 'Already tracking frames, stopping previous session');
      this.stop();
    }

    this.#callback = callback;
    this.#isTracking = true;

    if (this.isLoAFAvailable()) {
      this.startLoAFTracking();
    } else {
      this.startManualFrameTracking();
    }

    writeSceneLog(
      'LongFrameDetector',
      `Started tracking with ${
        this.isLoAFAvailable() ? 'LoAF API' : 'manual'
      } method, threshold: ${LONG_FRAME_THRESHOLD}ms`
    );
  }

  /**
   * Stop detecting long frames
   */
  public stop(): void {
    if (!this.#isTracking) {
      return;
    }

    this.#isTracking = false;
    this.#callback = null;

    // Stop both tracking methods to ensure cleanup
    this.stopLoAFTracking();
    this.stopManualFrameTracking();
  }

  /**
   * Check if currently tracking frames
   */
  public isTracking(): boolean {
    return this.#isTracking;
  }

  /**
   * Start tracking using the Long Animation Frame API
   * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameTiming
   */
  private startLoAFTracking(): void {
    if (!this.isLoAFAvailable()) {
      writeSceneLog('LongFrameDetector', 'LoAF API not available, falling back to manual tracking');
      this.startManualFrameTracking();
      return;
    }

    try {
      this.#loafObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // No duration check needed - LoAF API already filters for long frames (>50ms)
          const event: LongFrameEvent = {
            duration: entry.duration,
            timestamp: entry.startTime,
            method: 'loaf',
          };

          if (this.#callback) {
            this.#callback(event);
          }

          // Add performance marks and measurements for debugging in dev tools
          if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
            const frameId = `long-frame-${entry.startTime.toFixed(0)}`;
            const startMarkName = `${frameId}-start`;
            const endMarkName = `${frameId}-end`;
            const measureName = `Long Frame (LoAF): ${entry.duration.toFixed(1)}ms`;

            try {
              // Create start and end marks
              performance.mark(startMarkName, { startTime: entry.startTime });
              performance.mark(endMarkName, { startTime: entry.startTime + entry.duration });

              // Create measurement span
              performance.measure(measureName, startMarkName, endMarkName);
            } catch {
              // Fallback for browsers that don't support startTime option
              performance.mark(measureName);
            }
          }

          writeSceneLog('LongFrameDetector', `Long frame detected (LoAF): ${entry.duration}ms at ${entry.startTime}ms`);
        }
      });

      this.#loafObserver.observe({ type: 'long-animation-frame', buffered: false });
    } catch (error) {
      writeSceneLog('LongFrameDetector', 'Failed to start LoAF tracking, falling back to manual:', error);
      this.startManualFrameTracking();
    }
  }

  /**
   * Stop LoAF tracking
   */
  private stopLoAFTracking(): void {
    if (this.#loafObserver) {
      this.#loafObserver.disconnect();
      this.#loafObserver = null;
      writeSceneLog('LongFrameDetector', 'Stopped LoAF tracking');
    }
  }

  /**
   * Start manual frame tracking using requestAnimationFrame
   */
  private startManualFrameTracking(): void {
    this.#lastFrameTime = performance.now();
    this.#frameTrackingId = requestAnimationFrame(() => this.measureFrames());
  }

  /**
   * Stop manual frame tracking
   */
  private stopManualFrameTracking(): void {
    if (this.#frameTrackingId) {
      cancelAnimationFrame(this.#frameTrackingId);
      this.#frameTrackingId = null;
      writeSceneLog('LongFrameDetector', 'Stopped manual frame tracking');
    }
  }

  /**
   * Measure frame durations using requestAnimationFrame
   */
  private measureFrames = (): void => {
    if (!this.#isTracking) {
      return;
    }

    const currentFrameTime = performance.now();
    const frameLength = currentFrameTime - this.#lastFrameTime;

    // Check if frame exceeds threshold
    if (frameLength > LONG_FRAME_THRESHOLD) {
      const event: LongFrameEvent = {
        duration: frameLength,
        timestamp: currentFrameTime,
        method: 'manual',
      };

      if (this.#callback) {
        this.#callback(event);
      }

      // Add performance marks and measurements for debugging in dev tools
      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        const frameId = `long-frame-manual-${currentFrameTime.toFixed(0)}`;
        const startMarkName = `${frameId}-start`;
        const endMarkName = `${frameId}-end`;
        const measureName = `Long Frame (Manual): ${frameLength.toFixed(1)}ms`;

        try {
          // Create start and end marks
          performance.mark(startMarkName, { startTime: currentFrameTime - frameLength });
          performance.mark(endMarkName, { startTime: currentFrameTime });

          // Create measurement span
          performance.measure(measureName, startMarkName, endMarkName);
        } catch {
          // Fallback for browsers that don't support startTime option
          performance.mark(measureName);
        }
      }

      writeSceneLog(
        'LongFrameDetector',
        `Long frame detected (manual): ${frameLength}ms (threshold: ${LONG_FRAME_THRESHOLD}ms)`
      );
    }

    this.#lastFrameTime = currentFrameTime;

    // Continue tracking
    if (this.#isTracking) {
      this.#frameTrackingId = requestAnimationFrame(this.measureFrames);
    }
  };
}

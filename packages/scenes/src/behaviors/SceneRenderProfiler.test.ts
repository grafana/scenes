import { calculateNetworkTime, processRecordedSpans } from "./SceneRenderProfiler";

describe('calculateNetworkTime', () => {
  it('should return the duration of a single request', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 100 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(100);
  });

  it('should return the total time for non-overlapping requests', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 100 } as PerformanceResourceTiming,
      { startTime: 200, responseEnd: 300 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(200);
  });

  it('should merge overlapping requests and return the correct total time', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 100 } as PerformanceResourceTiming,
      { startTime: 50, responseEnd: 150 } as PerformanceResourceTiming,
      { startTime: 200, responseEnd: 300 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(250);
  });

  it('should handle multiple overlapping intervals', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 200 } as PerformanceResourceTiming,
      { startTime: 100, responseEnd: 300 } as PerformanceResourceTiming,
      { startTime: 250, responseEnd: 350 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(350);
  });

  it('should handle multiple overlapping intervals in wrong order', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 100, responseEnd: 300 } as PerformanceResourceTiming,
      { startTime: 0, responseEnd: 200 } as PerformanceResourceTiming,
      { startTime: 250, responseEnd: 350 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(350);
  });

  it('should correctly calculate time with gaps between requests', () => {
    const requests: PerformanceResourceTiming[] = [
      { startTime: 0, responseEnd: 100 } as PerformanceResourceTiming,
      { startTime: 150, responseEnd: 250 } as PerformanceResourceTiming,
      { startTime: 300, responseEnd: 400 } as PerformanceResourceTiming,
    ];
    expect(calculateNetworkTime(requests)).toBe(300);
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
  });

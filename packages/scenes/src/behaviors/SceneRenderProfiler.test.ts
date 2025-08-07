import { calculateNetworkTime, processRecordedSpans, captureNetwork } from './SceneRenderProfiler';

describe('calculateNetworkTime', () => {
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

describe('captureNetwork', () => {
  let mockEntries: PerformanceResourceTiming[];

  beforeEach(() => {
    mockEntries = [];

    // Clear any previous mock calls
    jest.clearAllMocks();

    // Set up our mock data for the global performance mocks
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should capture network requests that start and end within the time window', () => {
    // Request that starts and ends within the window [100, 300]
    mockEntries = [
      {
        name: 'request1.js',
        startTime: 150,
        responseEnd: 250,
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.getEntriesByType).toHaveBeenCalledWith('resource');
    expect(global.performance.clearResourceTimings).toHaveBeenCalled();
    expect(global.performance.measure).toHaveBeenCalledWith('Network entry request1.js', {
      start: 150,
      end: 250,
    });
    expect(result).toBe(100); // Duration: 250 - 150 = 100
  });

  it('should NOT capture requests that start within window but end after endTs', () => {
    // Request starts within window but ends after endTs
    mockEntries = [
      {
        name: 'long-request.js',
        startTime: 200, // Within [100, 300]
        responseEnd: 400, // After endTs=300
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).not.toHaveBeenCalled();
    expect(result).toBe(0); // No requests captured
  });

  it('should NOT capture requests that start before startTs but end within window', () => {
    // Request starts before window but ends within window
    mockEntries = [
      {
        name: 'early-request.js',
        startTime: 50, // Before startTs=100
        responseEnd: 200, // Within [100, 300]
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).not.toHaveBeenCalled();
    expect(result).toBe(0); // No requests captured
  });

  it('should NOT capture requests that start and end outside the time window', () => {
    mockEntries = [
      {
        name: 'early-request.js',
        startTime: 50,
        responseEnd: 80, // Both before window [100, 300]
      } as PerformanceResourceTiming,
      {
        name: 'late-request.js',
        startTime: 400,
        responseEnd: 500, // Both after window [100, 300]
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).not.toHaveBeenCalled();
    expect(result).toBe(0); // No requests captured
  });

  it('should capture multiple valid requests within the time window', () => {
    mockEntries = [
      {
        name: 'request1.js',
        startTime: 110,
        responseEnd: 150,
      } as PerformanceResourceTiming,
      {
        name: 'request2.css',
        startTime: 160,
        responseEnd: 200,
      } as PerformanceResourceTiming,
      {
        name: 'request3.png',
        startTime: 250,
        responseEnd: 290,
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).toHaveBeenCalledTimes(3);
    expect(global.performance.measure).toHaveBeenCalledWith('Network entry request1.js', {
      start: 110,
      end: 150,
    });
    expect(global.performance.measure).toHaveBeenCalledWith('Network entry request2.css', {
      start: 160,
      end: 200,
    });
    expect(global.performance.measure).toHaveBeenCalledWith('Network entry request3.png', {
      start: 250,
      end: 290,
    });
    // Total duration: (150-110) + (200-160) + (290-250) = 40 + 40 + 40 = 120
    expect(result).toBe(120);
  });

  it('should filter out invalid requests and capture only valid ones', () => {
    mockEntries = [
      {
        name: 'valid-request.js',
        startTime: 120,
        responseEnd: 180, // Valid: within [100, 300]
      } as PerformanceResourceTiming,
      {
        name: 'invalid-early.js',
        startTime: 50,
        responseEnd: 150, // Invalid: starts before window
      } as PerformanceResourceTiming,
      {
        name: 'invalid-late.js',
        startTime: 200,
        responseEnd: 400, // Invalid: ends after window
      } as PerformanceResourceTiming,
      {
        name: 'valid-request2.css',
        startTime: 220,
        responseEnd: 260, // Valid: within [100, 300]
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).toHaveBeenCalledTimes(2);
    expect(global.performance.measure).toHaveBeenCalledWith('Network entry valid-request.js', {
      start: 120,
      end: 180,
    });
    expect(global.performance.measure).toHaveBeenCalledWith('Network entry valid-request2.css', {
      start: 220,
      end: 260,
    });
    // Total duration: (180-120) + (260-220) = 60 + 40 = 100
    expect(result).toBe(100);
  });

  it('should handle overlapping valid requests correctly', () => {
    mockEntries = [
      {
        name: 'request1.js',
        startTime: 110,
        responseEnd: 160,
      } as PerformanceResourceTiming,
      {
        name: 'request2.css',
        startTime: 140,
        responseEnd: 200, // Overlaps with request1
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).toHaveBeenCalledTimes(2);
    // Total overlapping duration: 110 to 200 = 90ms
    expect(result).toBe(90);
  });

  it('should handle edge case where request starts and ends exactly at window boundaries', () => {
    mockEntries = [
      {
        name: 'boundary-request.js',
        startTime: 100, // Exactly at startTs
        responseEnd: 300, // Exactly at endTs
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).toHaveBeenCalledWith('Network entry boundary-request.js', {
      start: 100,
      end: 300,
    });
    expect(result).toBe(200); // Duration: 300 - 100 = 200
  });

  it('should return 0 when no network entries exist', () => {
    mockEntries = [];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.getEntriesByType).toHaveBeenCalledWith('resource');
    expect(global.performance.clearResourceTimings).toHaveBeenCalled();
    expect(global.performance.measure).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle the case where responseEnd equals startTime (zero-duration request)', () => {
    mockEntries = [
      {
        name: 'instant-request.js',
        startTime: 150,
        responseEnd: 150, // Same as startTime
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).toHaveBeenCalledWith('Network entry instant-request.js', {
      start: 150,
      end: 150,
    });
    expect(result).toBe(0); // Duration: 150 - 150 = 0
  });

  it('should properly handle requests with unusual timing edge cases', () => {
    mockEntries = [
      {
        name: 'request-starts-at-end.js',
        startTime: 300, // Starts exactly at endTs
        responseEnd: 300, // Ends exactly at endTs
      } as PerformanceResourceTiming,
      {
        name: 'request-ends-at-start.js',
        startTime: 100, // Starts exactly at startTs
        responseEnd: 100, // Ends exactly at startTs
      } as PerformanceResourceTiming,
    ];
    (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockEntries);

    const result = captureNetwork(100, 300);

    expect(global.performance.measure).toHaveBeenCalledTimes(2);
    expect(result).toBe(0); // Both requests have zero duration
  });
});

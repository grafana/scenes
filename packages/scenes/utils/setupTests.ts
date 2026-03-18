import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock Performance API methods that don't exist in Jest/jsdom environment
if (!global.performance) {
  global.performance = {} as Performance;
}

// Add the missing Performance Resource Timing API methods
Object.assign(global.performance, {
  getEntriesByType: jest.fn(() => []),
  clearResourceTimings: jest.fn(),
  measure: jest.fn(),
  // Keep existing methods like now() that might already exist
  now: global.performance.now || jest.fn(() => Date.now()),
  mark: global.performance.mark || jest.fn(),
});

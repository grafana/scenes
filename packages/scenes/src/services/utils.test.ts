import { isUrlValueEqual } from './utils';

describe('isUrlValueEqual', () => {
  it('should handle all cases', () => {
    expect(isUrlValueEqual([], [])).toBe(true);
    expect(isUrlValueEqual([], undefined)).toBe(true);
    expect(isUrlValueEqual([], null)).toBe(true);

    expect(isUrlValueEqual(['asd'], 'asd')).toBe(true);
    expect(isUrlValueEqual(['asd'], ['asd'])).toBe(true);
    expect(isUrlValueEqual(['asd', '2'], ['asd', '2'])).toBe(true);

    expect(isUrlValueEqual(['asd', '2'], 'asd')).toBe(false);
    expect(isUrlValueEqual(['asd2'], 'asd')).toBe(false);
  });
});

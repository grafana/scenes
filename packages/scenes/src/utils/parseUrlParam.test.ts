import { parseUrlParam } from './parseUrlParam';

const intervalSuffixes = ['s', 'S', 'm', 'M', 'h', 'H', 'd', 'D', 'w', 'W', 'y', 'Y'];

describe('parseUrlParam', () => {
  it.each(intervalSuffixes)('should parse %s', (suffix) => {
    expect(parseUrlParam('1' + suffix)).toBe('1' + suffix);
  });

  it('return null for non-string value', () => {
    expect(parseUrlParam(['d'])).toBeNull();
    expect(parseUrlParam(undefined)).toBeNull();
    expect(parseUrlParam(null)).toBeNull();
  });

  it('return parse relative time string', () => {
    expect(parseUrlParam('now')).toBe('now');
    expect(parseUrlParam('now-1d')).toBe('now-1d');
  });

  it('should parse date string', () => {
    expect(parseUrlParam('20230901')).toMatchInlineSnapshot(`"2023-09-01T00:00:00.000Z"`);
  });

  it('should parse datetime string', () => {
    expect(parseUrlParam('20230901T091500')).toMatchInlineSnapshot(`"2023-09-01T09:15:00.000Z"`);
    expect(parseUrlParam('2023-09-01T09:15:20.200Z')).toMatchInlineSnapshot(`"2023-09-01T09:15:20.200Z"`);
  });

  it('should parse epoch', () => {
    expect(parseUrlParam('1693559700000')).toMatchInlineSnapshot(`"2023-09-01T09:15:00.000Z"`);
  });

  it('should parse human readable date', () => {
    expect(parseUrlParam('2024-09-30 00:00:00')).toMatchInlineSnapshot(`"2024-09-30T00:00:00.000Z"`);
  });
});

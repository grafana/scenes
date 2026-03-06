import { buildApplicabilityMatcher } from './applicabilityUtils';

describe('buildApplicabilityMatcher', () => {
  it('should match entries by key', () => {
    const response = [
      { key: 'env', applicable: true },
      { key: 'cluster', applicable: false, reason: 'not found' },
    ];

    const match = buildApplicabilityMatcher(response);

    expect(match('env')).toEqual({ key: 'env', applicable: true });
    expect(match('cluster')).toEqual({ key: 'cluster', applicable: false, reason: 'not found' });
  });

  it('should match entries by key + origin', () => {
    const response = [
      { key: 'env', applicable: true },
      { key: 'region', applicable: false, origin: 'dashboard' },
    ];

    const match = buildApplicabilityMatcher(response);

    expect(match('env')).toEqual({ key: 'env', applicable: true });
    expect(match('region', 'dashboard')).toEqual({ key: 'region', applicable: false, origin: 'dashboard' });
  });

  it('should return undefined for unknown keys', () => {
    const response = [{ key: 'env', applicable: true }];

    const match = buildApplicabilityMatcher(response);

    expect(match('unknown')).toBeUndefined();
  });

  it('should return undefined for empty response', () => {
    const match = buildApplicabilityMatcher([]);

    expect(match('env')).toBeUndefined();
  });

  it('should return the last entry for duplicate keys', () => {
    const response = [
      { key: 'env', applicable: true },
      { key: 'env', applicable: false, reason: 'value not found' },
    ];

    const match = buildApplicabilityMatcher(response);

    expect(match('env')).toEqual({ key: 'env', applicable: false, reason: 'value not found' });
  });

  it('should return the same result on repeated lookups (stateless)', () => {
    const response = [{ key: 'env', applicable: true }];

    const match = buildApplicabilityMatcher(response);

    expect(match('env')).toEqual({ key: 'env', applicable: true });
    expect(match('env')).toEqual({ key: 'env', applicable: true });
    expect(match('env')).toEqual({ key: 'env', applicable: true });
  });

  it('should keep key-only and key+origin entries separate', () => {
    const response = [
      { key: 'env', applicable: true },
      { key: 'env', applicable: false, origin: 'dashboard' },
    ];

    const match = buildApplicabilityMatcher(response);

    expect(match('env')).toEqual({ key: 'env', applicable: true });
    expect(match('env', 'dashboard')).toEqual({ key: 'env', applicable: false, origin: 'dashboard' });
  });

  it('should not match key+origin entry when queried without origin', () => {
    const response = [{ key: 'region', applicable: false, origin: 'dashboard' }];

    const match = buildApplicabilityMatcher(response);

    expect(match('region')).toBeUndefined();
    expect(match('region', 'dashboard')).toEqual({ key: 'region', applicable: false, origin: 'dashboard' });
  });

  it('should not match key-only entry when queried with origin', () => {
    const response = [{ key: 'region', applicable: true }];

    const match = buildApplicabilityMatcher(response);

    expect(match('region', 'dashboard')).toBeUndefined();
    expect(match('region')).toEqual({ key: 'region', applicable: true });
  });

  it('should handle mixed keys and origins correctly', () => {
    const response = [
      { key: 'cluster', applicable: false, reason: 'overridden' },
      { key: 'env', applicable: true, origin: 'scope' },
      { key: 'pod', applicable: true },
      { key: 'cluster', applicable: true, origin: 'dashboard' },
    ];

    const match = buildApplicabilityMatcher(response);

    expect(match('pod')).toEqual({ key: 'pod', applicable: true });
    expect(match('env', 'scope')).toEqual({ key: 'env', applicable: true, origin: 'scope' });
    expect(match('cluster')).toEqual({ key: 'cluster', applicable: false, reason: 'overridden' });
    expect(match('cluster', 'dashboard')).toEqual({ key: 'cluster', applicable: true, origin: 'dashboard' });
  });

  it('should handle multiple origins for the same key', () => {
    const response = [
      { key: 'env', applicable: true, origin: 'scope' },
      { key: 'env', applicable: false, origin: 'dashboard' },
    ];

    const match = buildApplicabilityMatcher(response);

    expect(match('env', 'scope')).toEqual({ key: 'env', applicable: true, origin: 'scope' });
    expect(match('env', 'dashboard')).toEqual({ key: 'env', applicable: false, origin: 'dashboard' });
  });
});

import { getAdhocOptionSearcher } from './getAdhocOptionSearcher';

describe('getAdhocOptionSearcher', () => {
  it('Should return options', async () => {
    const optionSearcher = getAdhocOptionSearcher([{ label: 'A', value: '1' }]);
    expect(optionSearcher('')).toEqual([{ label: 'A', value: '1' }]);
  });

  it('Can filter options by search query', async () => {
    const options = [
      { label: 'Test', value: '1' },
      { label: 'Google', value: '2' },
      { label: 'estimate', value: '2' },
    ];
    const optionSearcher = getAdhocOptionSearcher(options);

    expect(optionSearcher('est')).toEqual([
      { label: 'estimate', value: '2' },
      { label: 'Test', value: '1' },
    ]);
  });

  it('Preserves other parameters when filtering', async () => {
    const options = [
      { label: 'Test', value: '1', foo: 'foo', group: 'group1' },
      { label: 'Google', value: '2' },
      { label: 'estimate', value: '2' },
    ];
    const optionSearcher = getAdhocOptionSearcher(options);

    expect(optionSearcher('est')).toEqual([
      { label: 'estimate', value: '2' },
      { label: 'Test', value: '1', foo: 'foo', group: 'group1' },
    ]);
  });
});

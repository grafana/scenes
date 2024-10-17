import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { getOptionSearcher } from './getOptionSearcher';

describe('getOptionSearcher', () => {
  it('Should return options', async () => {
    const optionSearcher = getOptionSearcher([{ label: 'A', value: '1' }], false);
    expect(optionSearcher('')).toEqual([{ label: 'A', value: '1' }]);
  });

  it('Should return include All option when includeAll is true', async () => {
    const optionSearcher = getOptionSearcher([{ label: 'A', value: '1' }], true);
    expect(optionSearcher('')).toEqual([
      { label: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE },
      { label: 'A', value: '1' },
    ]);
  });

  it('Can filter options by search query', async () => {
    const options = [
      { label: 'Test', value: '1' },
      { label: 'Google', value: '2' },
      { label: 'estimate', value: '2' },
    ];
    const optionSearcher = getOptionSearcher(options, false);

    expect(optionSearcher('est')).toEqual([
      { label: 'estimate', value: '2' },
      { label: 'Test', value: '1' },
    ]);
  });
});

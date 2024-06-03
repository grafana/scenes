import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { getOptionSearcher } from './getOptionSearcher';

describe('getOptionSearcher', () => {
  it('Should return options', async () => {
    const optionSearcher = getOptionSearcher([{ label: 'A', value: '1' }], false, '1', 'A');
    expect(optionSearcher('')).toEqual([{ label: 'A', value: '1' }]);
  });

  it('Should return include All option when includeAll is true', async () => {
    const optionSearcher = getOptionSearcher([{ label: 'A', value: '1' }], true, '1', 'A');
    expect(optionSearcher('')).toEqual([
      { label: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE },
      { label: 'A', value: '1' },
    ]);
  });

  it('Should add current value if not found', async () => {
    const optionSearcher = getOptionSearcher([], false, 'customValue', 'customText');
    expect(optionSearcher('')).toEqual([{ label: 'customText', value: 'customValue' }]);
  });

  it('Can filter options by search query', async () => {
    const options = [
      { label: 'Test', value: '1' },
      { label: 'Google', value: '2' },
      { label: 'estimate', value: '2' },
    ];
    const optionSearcher = getOptionSearcher(options, false, '', '');

    expect(optionSearcher('est')).toEqual([
      { label: 'Test', value: '1' },
      { label: 'estimate', value: '2' },
    ]);
  });
});

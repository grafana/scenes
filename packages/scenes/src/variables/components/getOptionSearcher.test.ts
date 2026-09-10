import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { getOptionSearcher } from './getOptionSearcher';

const translations: Record<string, string> = {};

jest.mock('@grafana/i18n', () => ({
  ...jest.requireActual('@grafana/i18n'),
  t: (id: string, defaultMessage: string) => translations[id] ?? defaultMessage,
}));

describe('getOptionSearcher', () => {
  afterEach(() => {
    for (const key of Object.keys(translations)) {
      delete translations[key];
    }
  });

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

  it('Should localize the All option label', async () => {
    translations['grafana-scenes.variables.variable-value-select.all-label'] = 'Tout';

    const optionSearcher = getOptionSearcher([{ label: 'A', value: '1' }], true);
    expect(optionSearcher('')).toEqual([
      { label: 'Tout', value: ALL_VARIABLE_VALUE },
      { label: 'A', value: '1' },
    ]);
  });

  it('Can filter the localized All option by its translated label', async () => {
    translations['grafana-scenes.variables.variable-value-select.all-label'] = 'Tout';

    const optionSearcher = getOptionSearcher([{ label: 'A', value: '1' }], true);
    expect(optionSearcher('Tou')).toEqual([{ label: 'Tout', value: ALL_VARIABLE_VALUE }]);
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

import { lastValueFrom } from 'rxjs';

import { ValueSelectVariable } from './ValueSelectVariable';
import { CsvValueOptionsProvider } from './CsvValueOptionsProvider';

describe('ValueSelectVariable', () => {
  describe('With csv value provider', () => {
    it('Should generate correctly the options for only value queries', async () => {
      const variable = new ValueSelectVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        providers: [new CsvValueOptionsProvider('A,B,C')],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('A');
      expect(variable.state.text).toEqual('A');
      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
      ]);
    });
  });
});

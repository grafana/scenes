import { VariableSort } from '@grafana/data';
import { metricNamesToVariableValues } from './utils';

describe('When null values are returned', () => {
  it('Should translated to empty strings', async () => {
    const values = metricNamesToVariableValues('', VariableSort.disabled, [{ text: null, value: null }]);
    expect(values).toEqual([{ label: '', value: '' }]);
  });
});

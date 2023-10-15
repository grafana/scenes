import { AdHocFiltersVariable } from './AdHocFiltersVariable';

describe('AdHocFiltersVariable', () => {
  it('AdHocFiltersVariable by default renders a prometheus / loki compatible label filter', () => {
    const variable = AdHocFiltersVariable.create({
      datasource: { uid: 'hello' },
      filters: [
        {
          key: 'key1',
          operator: '=',
          value: 'val1',
          condition: '',
        },
        {
          key: 'key2',
          operator: '=~',
          value: '[val2]',
          condition: '',
        },
      ],
    });

    variable.activate();

    expect(variable.getValue()).toBe(`key1="val1",key2=~"\\\\[val2\\\\]"`);
  });
});

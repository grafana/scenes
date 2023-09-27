import { AdHocFilterSet } from './AdHocFiltersSet';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';

describe('AdHocFiltersVariable', () => {
  it('AdHocFiltersVariable by default renders a prometheus / loki compatible label filter', () => {
    const variable = new AdHocFiltersVariable({
      name: 'Filters',
      set: new AdHocFilterSet({
        name: 'Filters',
        filters: [
          {
            key: 'key1',
            operator: '=',
            value: 'val1',
          },
          {
            key: 'key2',
            operator: '=~',
            value: '[val2]',
          },
        ],
      }),
    });

    variable.activate();

    expect(variable.getValue()).toBe(`key1="val1",key2=~"\\\\[val2\\\\]",`);
  });
});

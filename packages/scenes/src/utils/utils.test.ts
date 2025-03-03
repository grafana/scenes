import { deepIterate } from './utils';

describe('deepIterate', () => {
  it('should transform nested object values', () => {
    const nestedObject = {
      a: {
        b: {
          c: 'cabbage',
          c2: 99,
        },
        b2: 'lettuce',
        b3: true,
      },
      a2: 'eggplant',
      a3: 420,
    };

    const transformedObject = deepIterate(nestedObject, (o) => {
      if (typeof o === 'string') {
        return o.toUpperCase();
      } else if (typeof o === 'number') {
        return o * 2;
      }
    });

    expect(nestedObject.a.b.c).toBe('cabbage');
    expect(nestedObject.a.b.c2).toBe(99);
    expect(nestedObject.a.b2).toBe('lettuce');
    expect(nestedObject.a.b3).toBe(true);
    expect(nestedObject.a2).toBe('eggplant');
    expect(nestedObject.a3).toBe(420);

    expect(transformedObject.a.b.c).toBe('CABBAGE');
    expect(transformedObject.a.b.c2).toBe(198);
    expect(transformedObject.a.b2).toBe('LETTUCE');
    expect(transformedObject.a.b3).toBe(true);
    expect(transformedObject.a2).toBe('EGGPLANT');
    expect(transformedObject.a3).toBe(840);
  });

  it('should transform nested object values #2', () => {
    const nestedObject = {
      id: 'filterByValue',
      options: {
        filters: [
          {
            config: {
              id: 'equal',
              options: {
                value: '${myvar}',
              },
            },
            fieldName: 'str',
          },
        ],
        match: 'any',
        type: 'exclude',
      },
    };

    const nestedExpect = JSON.parse(JSON.stringify(nestedObject));

    const transformedExpect = JSON.parse(JSON.stringify(nestedObject));
    transformedExpect.options.filters[0].config.options.value = 'yay!';

    const transformedObject = deepIterate(nestedObject, (o) => {
      if (typeof o === 'string') {
        // mock interpolation
        if (o === '${myvar}') {
          return 'yay!';
        }
      }
    });

    expect(nestedObject).toEqual(nestedExpect);
    expect(transformedObject).toEqual(transformedExpect);
  });
});

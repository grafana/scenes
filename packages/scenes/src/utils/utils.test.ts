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

    expect(transformedObject.a.b.c).toBe('CABBAGE');
    expect(transformedObject.a.b.c2).toBe(198);
    expect(transformedObject.a.b2).toBe('LETTUCE');
    expect(transformedObject.a.b3).toBe(true);
    expect(transformedObject.a2).toBe('EGGPLANT');
    expect(transformedObject.a3).toBe(840);
  });
});

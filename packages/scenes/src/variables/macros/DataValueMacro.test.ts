import { FieldType, toDataFrame } from '@grafana/data';
import { DataContextScopedVar } from '../macros/DataValueMacro';
import { sceneInterpolator } from '../interpolation/sceneInterpolator';
import { TestScene } from '../TestScene';

describe('DataValueMacro', () => {
  it('Can use use ${__value.*} interpolation when dataContext exist', () => {
    const scene = new TestScene({});
    const data = toDataFrame({
      name: 'A',
      fields: [
        {
          name: 'number',
          type: FieldType.number,
          values: [5, 10],
          display: (value: number) => {
            return { text: value.toString(), numeric: value, suffix: '%' };
          },
        },
        {
          name: 'time',
          type: FieldType.time,
          values: [5000, 10000],
        },
      ],
    });

    const dataContext: DataContextScopedVar = {
      value: {
        frame: data,
        fieldIndex: 0,
        valueIndex: 1,
      },
    };

    const scopedVars = { __dataContext: dataContext };

    expect(sceneInterpolator(scene, '${__value.raw}', scopedVars)).toBe('10');
    expect(sceneInterpolator(scene, '${__value.numeric}', scopedVars)).toBe('10');
    expect(sceneInterpolator(scene, '${__value}', scopedVars)).toBe('10%');
    expect(sceneInterpolator(scene, '${__value.time}', scopedVars)).toBe('10000');
  });
});

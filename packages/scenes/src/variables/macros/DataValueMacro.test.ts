import { FieldType, toDataFrame, DataContextScopedVar } from '@grafana/data';
import { sceneInterpolator } from '../interpolation/sceneInterpolator';
import { TestScene } from '../TestScene';

describe('DataValueMacro', () => {
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

  it('Can use use ${__value.*} interpolation when dataContext exist', () => {
    const scene = new TestScene({});
    const dataContext: DataContextScopedVar = {
      value: {
        frame: data,
        field: data.fields[0],
        rowIndex: 1,
      },
    };

    const scopedVars = { __dataContext: dataContext };

    expect(sceneInterpolator(scene, '${__value.raw}', scopedVars)).toBe('10');
    expect(sceneInterpolator(scene, '${__value.numeric}', scopedVars)).toBe('10');
    expect(sceneInterpolator(scene, '${__value}', scopedVars)).toBe('10%');
    expect(sceneInterpolator(scene, '${__value.text}', scopedVars)).toBe('10%');
    expect(sceneInterpolator(scene, '${__value.time}', scopedVars)).toBe('10000');
  });

  it('Can use use ${__value.*} with calculatedValue', () => {
    const scene = new TestScene({});
    const dataContext: DataContextScopedVar = {
      value: {
        frame: data,
        field: data.fields[0],
        calculatedValue: {
          text: '15',
          numeric: 15,
          suffix: '%',
        },
      },
    };

    const scopedVars = { __dataContext: dataContext };

    expect(sceneInterpolator(scene, '${__value.raw}', scopedVars)).toBe('15');
    expect(sceneInterpolator(scene, '${__value.numeric}', scopedVars)).toBe('15');
    expect(sceneInterpolator(scene, '${__value.text}', scopedVars)).toBe('15%');
    expect(sceneInterpolator(scene, '${__value}', scopedVars)).toBe('15%');
    expect(sceneInterpolator(scene, '${__value.time}', scopedVars)).toBe('');
  });
});

import { SceneTimeRange } from '../../core/SceneTimeRange';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { ConstantVariable } from '../variants/ConstantVariable';
import { ObjectVariable } from '../variants/ObjectVariable';
import { TestVariable } from '../variants/TestVariable';
import { FormatRegistryID } from './formatRegistry';

import { sceneInterpolator } from './sceneInterpolator';

describe('sceneInterpolator', () => {
  it('Should be interpolated and use closest variable', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new ConstantVariable({
            name: 'test',
            value: 'hello',
          }),
          new ConstantVariable({
            name: 'atRootOnly',
            value: 'RootValue',
          }),
        ],
      }),
      nested: new TestScene({
        $variables: new SceneVariableSet({
          variables: [
            new ConstantVariable({
              name: 'test',
              value: 'nestedValue',
            }),
          ],
        }),
      }),
    });

    expect(sceneInterpolator(scene, '${test}')).toBe('hello');
    expect(sceneInterpolator(scene.state.nested!, '${test}')).toBe('nestedValue');
    expect(sceneInterpolator(scene.state.nested!, '${atRootOnly}')).toBe('RootValue');
  });

  describe('Given a variable with allValue', () => {
    it('Should not escape it', () => {
      const scene = new TestScene({
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'test',
              value: ALL_VARIABLE_VALUE,
              text: ALL_VARIABLE_TEXT,
              allValue: '.*',
            }),
          ],
        }),
      });

      expect(sceneInterpolator(scene, '${test:regex}')).toBe('.*');
    });
  });

  describe('Given an expression with fieldPath', () => {
    it('Should interpolate correctly', () => {
      const scene = new TestScene({
        $variables: new SceneVariableSet({
          variables: [
            new ObjectVariable({
              type: 'custom',
              name: 'test',
              value: { prop1: 'prop1Value' },
            }),
          ],
        }),
      });

      expect(sceneInterpolator(scene, '${test.prop1}')).toBe('prop1Value');
    });
  });

  it('Can use format', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new ConstantVariable({
            name: 'test',
            value: 'hello',
          }),
        ],
      }),
    });

    expect(sceneInterpolator(scene, '${test:queryparam}')).toBe('var-test=hello');
  });

  it('Can format multi valued values', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({
            name: 'test',
            value: ['hello', 'world'],
          }),
        ],
      }),
    });

    expect(sceneInterpolator(scene, 'test.${test}.asd')).toBe('test.{hello,world}.asd');
  });

  it('Can format multi valued values using text formatter', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({
            name: 'test',
            value: ['1', '2'],
            text: ['hello', 'world'],
          }),
        ],
      }),
    });

    expect(sceneInterpolator(scene, '${test:text}')).toBe('hello + world');
  });

  it('Can use formats with arguments', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({
            name: 'test',
            value: 1594671549254,
          }),
        ],
      }),
    });

    expect(sceneInterpolator(scene, '${test:date:YYYY-MM}')).toBe('2020-07');
  });

  it('Can use scopedVars', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [],
      }),
    });

    const scopedVars = { __from: { value: 'a', text: 'b' } };

    expect(sceneInterpolator(scene, '${__from}', scopedVars)).toBe('a');
    expect(sceneInterpolator(scene, '${__from:text}', scopedVars)).toBe('b');
  });

  it('Can use scopedVars with fieldPath', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [],
      }),
    });

    const scopedVars = { __data: { value: { name: 'Main org' }, text: '' } };
    expect(sceneInterpolator(scene, '${__data.name}', scopedVars)).toBe('Main org');
  });

  it('Can use custom formatter', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({
            name: 'cluster',
            value: ['1', '2'],
            text: ['hello', 'world'],
            isMulti: true,
            includeAll: true,
          }),
        ],
      }),
    });

    const formatter = jest.fn().mockReturnValue('custom');

    expect(sceneInterpolator(scene, '$cluster', undefined, formatter)).toBe('custom');
    expect(formatter.mock.calls[0][1]).toEqual({ name: 'cluster', type: 'custom', multi: true, includeAll: true });
  });

  it('Can use use $__all_variables', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [new TestVariable({ name: 'cluster', value: 'A', text: 'A' })],
      }),
    });

    expect(sceneInterpolator(scene, '$__all_variables')).toBe('var-cluster=A');
    // Should not url encode again if format is queryparam
    expect(sceneInterpolator(scene, '$__all_variables', {}, FormatRegistryID.percentEncode)).toBe('var-cluster=A');
  });

  it('Can use use $__url_time_range', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
    });

    expect(sceneInterpolator(scene, '$__url_time_range')).toBe('from=now-5m&to=now');
  });
});

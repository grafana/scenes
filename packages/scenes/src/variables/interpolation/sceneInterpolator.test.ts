import { SceneTimeRange } from '../../core/SceneTimeRange';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { ConstantVariable } from '../variants/ConstantVariable';
import { ObjectVariable } from '../variants/ObjectVariable';
import { TestVariable } from '../variants/TestVariable';
import { VariableInterpolation } from '@grafana/runtime';
import { VariableFormatID } from '@grafana/schema';

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

    it('It can contain a variable expression', () => {
      const scene = new TestScene({
        $variables: new SceneVariableSet({
          variables: [
            new TestVariable({
              name: 'test',
              value: ALL_VARIABLE_VALUE,
              text: ALL_VARIABLE_TEXT,
              allValue: '$other',
            }),
            new TestVariable({
              name: 'other',
              value: 'hello',
              text: 'hello',
            }),
          ],
        }),
      });

      expect(sceneInterpolator(scene, '${test}')).toBe('hello');
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
    // Can use fieldPath index to access specific array value
    expect(sceneInterpolator(scene, 'test.${test.1}.asd')).toBe('test.world.asd');
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
    expect(sceneInterpolator(scene, '$__all_variables', {}, VariableFormatID.PercentEncode)).toBe('var-cluster=A');
  });

  it('Can use use $__url_time_range with explicit browser timezone', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now', timeZone: 'browser' }),
    });

    // Browser timezone should be preserved as "browser", not resolved to actual timezone
    expect(sceneInterpolator(scene, '$__url_time_range')).toBe('from=now-5m&to=now&timezone=browser');
  });

  it('Can use use $__url_time_range when timezone is undefined', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
    });

    // When timezone is undefined, getUrlState() will use getTimeZone() which resolves to browser default
    // This should include the resolved timezone in the URL
    const result = sceneInterpolator(scene, '$__url_time_range');
    expect(result).toContain('from=now-5m');
    expect(result).toContain('to=now');
    expect(result).toContain('timezone=');
  });

  it('Can use use $__url_time_range with custom timezone', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now', timeZone: 'utc' }),
    });

    expect(sceneInterpolator(scene, '$__url_time_range')).toBe('from=now-5m&to=now&timezone=utc');
  });

  describe('Interval variables', () => {
    it('Does not add curly braces to unbraced variables', () => {
      const scene = new TestScene({
        $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
      });

      expect(sceneInterpolator(scene, '$__interval')).toBe('$__interval');
    });
    it('Does not remove curly braces from braced variables', () => {
      const scene = new TestScene({
        $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
      });

      expect(sceneInterpolator(scene, '${__interval}')).toBe('${__interval}');
    });
  });

  describe('Interpolations', () => {
    it('populates found interpolations', () => {
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
      const interpolations: VariableInterpolation[] = [];
      sceneInterpolator(scene, '${cluster:text}', undefined, undefined, interpolations);
      expect(interpolations).toHaveLength(1);
      expect(interpolations[0].match).toEqual('${cluster:text}');
      expect(interpolations[0].variableName).toEqual('cluster');
      expect(interpolations[0].fieldPath).toBeUndefined();
      expect(interpolations[0].format).toEqual('text');
      expect(interpolations[0].found).toEqual(true);
      expect(interpolations[0].value).toEqual('hello + world');
    });
    it('populates not found interpolations', () => {
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
      const interpolations: VariableInterpolation[] = [];
      sceneInterpolator(scene, '${namespace}', undefined, undefined, interpolations);
      expect(interpolations).toHaveLength(1);
      expect(interpolations[0].match).toEqual('${namespace}');
      expect(interpolations[0].variableName).toEqual('namespace');
      expect(interpolations[0].fieldPath).toBeUndefined();
      expect(interpolations[0].format).toBeUndefined();
      expect(interpolations[0].found).toEqual(false);
      expect(interpolations[0].value).toEqual('${namespace}');
    });
  });

  describe('Variable expression with variable name that exists on object prototype', () => {
    it('Should return original expression', () => {
      const str = '$toString = 1';

      const scene = new TestScene({
        $variables: new SceneVariableSet({
          variables: [],
        }),
      });

      expect(sceneInterpolator(scene, str, {})).toBe(str);
      expect(sceneInterpolator(scene, str)).toBe(str);
    });
  });

  it('should not try to interpolate and return value if it is not a string', () => {
    const scene = new TestScene({});

    expect(sceneInterpolator(scene, 123 as any)).toBe(123);
  });
});

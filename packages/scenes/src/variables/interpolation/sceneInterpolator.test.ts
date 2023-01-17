import { sceneGraph } from '../../core/sceneGraph';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectStatePlain } from '../../core/types';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { ConstantVariable } from '../variants/ConstantVariable';
import { ObjectVariable } from '../variants/ObjectVariable';
import { TestVariable } from '../variants/TestVariable';

import { sceneInterpolator } from './sceneInterpolator';

interface TestSceneState extends SceneObjectStatePlain {
  nested?: TestScene;
}

class TestScene extends SceneObjectBase<TestSceneState> {}

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

    expect(sceneInterpolator(scene, '${test}', sceneGraph.getVariables)).toBe('hello');
    expect(sceneInterpolator(scene.state.nested!, '${test}', sceneGraph.getVariables)).toBe('nestedValue');
    expect(sceneInterpolator(scene.state.nested!, '${atRootOnly}', sceneGraph.getVariables)).toBe('RootValue');
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

      expect(sceneInterpolator(scene, '${test:regex}', sceneGraph.getVariables)).toBe('.*');
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

      expect(sceneInterpolator(scene, '${test.prop1}', sceneGraph.getVariables)).toBe('prop1Value');
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

    expect(sceneInterpolator(scene, '${test:queryparam}', sceneGraph.getVariables)).toBe('var-test=hello');
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

    expect(sceneInterpolator(scene, 'test.${test}.asd', sceneGraph.getVariables)).toBe('test.{hello,world}.asd');
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

    expect(sceneInterpolator(scene, '${test:text}', sceneGraph.getVariables)).toBe('hello + world');
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

    expect(sceneInterpolator(scene, '${test:date:YYYY-MM}', sceneGraph.getVariables)).toBe('2020-07');
  });

  it('Can use scopedVars', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [],
      }),
    });

    const scopedVars = { __from: { value: 'a', text: 'b' } };

    expect(sceneInterpolator(scene, '${__from}', sceneGraph.getVariables, scopedVars)).toBe('a');
    expect(sceneInterpolator(scene, '${__from:text}', sceneGraph.getVariables, scopedVars)).toBe('b');
  });

  it('Can use scopedVars with fieldPath', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [],
      }),
    });

    const scopedVars = { __data: { value: { name: 'Main org' }, text: '' } };
    expect(sceneInterpolator(scene, '${__data.name}', sceneGraph.getVariables, scopedVars)).toBe('Main org');
  });
});

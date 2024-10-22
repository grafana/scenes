import { SceneVariableSet } from '../sets/SceneVariableSet';
import { ConstantVariable } from '../variants/ConstantVariable';
import { ObjectVariable } from '../variants/ObjectVariable';
import { TestVariable } from '../variants/TestVariable';
import { AllVariablesMacro } from './AllVariablesMacro';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { TestScene } from '../TestScene';

describe('UrlVariables', () => {
  it('Should include variables from all levels', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [new TestVariable({ name: 'cluster', value: 'A', text: 'A' })],
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

    const urlVars = new AllVariablesMacro('__all_variables', scene.state.nested!);
    expect(urlVars.getValue().formatter()).toBe('var-cluster=A');
  });

  it('Should handle variable with custom all value', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({
            name: 'cluster',
            value: ALL_VARIABLE_VALUE,
            text: ALL_VARIABLE_TEXT,
            isMulti: true,
            allValue: '.*',
            includeAll: true,
          }),
        ],
      }),
    });

    const urlVars = new AllVariablesMacro('__all_variables', scene);
    expect(urlVars.getValue().formatter()).toBe('var-cluster=$__all');
  });

  it('Should handle variable with all value', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({
            name: 'cluster',
            value: ALL_VARIABLE_VALUE,
            text: ALL_VARIABLE_TEXT,
            isMulti: true,
            includeAll: true,
          }),
        ],
      }),
    });

    const urlVars = new AllVariablesMacro('__all_variables', scene);
    expect(urlVars.getValue().formatter()).toBe('var-cluster=$__all');
  });

  it('Should ignore variables with skipUrlSync', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({ name: 'cluster', value: 'A', text: 'A' }),
          new TestVariable({ name: 'server', value: 'A', text: 'A', skipUrlSync: true }),
          new ObjectVariable({ name: 'test', type: 'custom', value: {} }),
          new ConstantVariable({ name: 'constant', value: 'Muahaha' }),
        ],
      }),
    });

    const urlVars = new AllVariablesMacro('__all_variables', scene);
    expect(urlVars.getValue().formatter()).toBe('var-cluster=A');
  });
});

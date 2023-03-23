import { SceneVariableSet } from '../sets/SceneVariableSet';
import { VariableValueCustom } from '../types';
import { ConstantVariable } from '../variants/ConstantVariable';
import { ObjectVariable } from '../variants/ObjectVariable';
import { TestVariable } from '../variants/TestVariable';
import { TestScene } from './sceneInterpolator.test';
import { UrlVariables } from './UrlVariables';

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

    const urlVars = new UrlVariables('__all_variables', scene);
    const value = urlVars.getValue() as VariableValueCustom;
    expect(value.skipFormatting).toBe(true);
    expect(value.toString()).toBe('var-cluster=A');
  });

  it('Should ignore object variables and constant variables', () => {
    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [
          new TestVariable({ name: 'cluster', value: 'A', text: 'A' }),
          new ObjectVariable({ name: 'test', type: 'custom', value: {} }),
          new ConstantVariable({ name: 'test', value: 'Muahaha' }),
        ],
      }),
    });

    const urlVars = new UrlVariables('__all_variables', scene);
    expect(urlVars.getValue()?.toString()).toBe('var-cluster=A');
  });
});

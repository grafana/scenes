import { SceneVariableSet } from '../sets/SceneVariableSet';
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

    const urlVars = new UrlVariables('__all_variables', scene.state.nested!);
    expect(urlVars.getValue().format()).toBe('var-cluster=A');
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

    const urlVars = new UrlVariables('__all_variables', scene);
    expect(urlVars.getValue().format()).toBe('var-cluster=A');
  });
});

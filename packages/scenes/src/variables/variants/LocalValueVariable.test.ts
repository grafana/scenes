import { SceneVariableSet } from '../sets/SceneVariableSet';
import { TestScene } from '../TestScene';
import { LocalValueVariable } from './LocalValueVariable';
import { TestVariable } from './TestVariable';

describe('LocalValueVariable', () => {
  describe('isAncestorLoading', () => {
    it('Should return ancestor state', async () => {
      const { scene, localVar } = setup();

      scene.activate();
      expect(localVar.isAncestorLoading()).toBe(true);
    });

    it('Should handle missing parent var', async () => {
      const { scene, localVar } = setup();

      scene.setState({ $variables: new SceneVariableSet({ variables: [] }) });
      scene.activate();

      expect(localVar.isAncestorLoading()).toBe(false);
    });

    it('Supports multiple properties', async () => {
      const localVar = new LocalValueVariable({
        name: 'test',
        value: 'value',
        properties: { prop1: 'one', prop2: 'two' },
      });

      expect(localVar.getValue()).toBe('value');
      expect(localVar.getValue('prop2')).toBe('two');
    });
  });
});

function setup() {
  const localVar = new LocalValueVariable({
    name: 'test',
    value: 'nestedValue',
  });

  const scene = new TestScene({
    $variables: new SceneVariableSet({
      variables: [
        new TestVariable({
          name: 'test',
          options: [],
          optionsToReturn: [{ label: 'B', value: 'B' }],
        }),
      ],
    }),
    nested: new TestScene({
      $variables: new SceneVariableSet({
        variables: [localVar],
      }),
    }),
  });
  return { scene, localVar };
}

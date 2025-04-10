import { TestScene } from '../TestScene';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { ConstantVariable } from './ConstantVariable';
import { TestVariable } from './TestVariable';

describe('ConstantVariable', () => {
  describe('Can use other variable expressions inside', () => {
    it('Should default to empty options', async () => {
      const varA = new TestVariable({
        name: 'A',
        value: 'AA',
        query: 'A.*',
        delayMs: 0,
      });
      const varB = new ConstantVariable({
        name: 'B',
        value: '$A',
      });
      const varC = new TestVariable({
        name: 'C',
        query: `A.$B.*`,
        delayMs: 0,
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [varA, varB, varC] }),
      });

      scene.activate();

      expect(varB.getValue()).toEqual('AA');
      expect(varC.state.issuedQuery).toBe('A.AA.*');
      expect(varC.getValue()).toEqual('AAA');

      varA.changeValueTo('AB');
      expect(varB.getValue()).toEqual('AB');
      expect(varC.state.issuedQuery).toBe('A.AB.*');
      expect(varC.getValue()).toEqual('ABA');
    });
  });
});

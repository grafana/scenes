import { SceneVariableSet } from '../variables/sets/SceneVariableSet';

import { SceneDataNode } from './SceneDataNode';
import { SceneObjectBase } from './SceneObjectBase';
import { SceneObjectStateChangedEvent } from './events';
import { SceneDataProvider, SceneObject, SceneObjectState } from './types';
import { SceneTimeRange } from '../core/SceneTimeRange';

interface TestSceneState extends SceneObjectState {
  name?: string;
  nested?: SceneObject<TestSceneState>;
  children?: TestScene[];
  actions?: SceneObject[];
}

class TestScene extends SceneObjectBase<TestSceneState> {}

describe('SceneObject', () => {
  it('Can clone', () => {
    const scene = new TestScene({
      nested: new TestScene({
        name: 'nested',
      }),
      actions: [
        new TestScene({
          name: 'action child',
        }),
      ],
      children: [
        new TestScene({
          name: 'layout child',
        }),
      ],
    });

    scene.state.nested?.activate();

    const clone = scene.clone();
    expect(clone).not.toBe(scene);
    expect(clone.state.nested).not.toBe(scene.state.nested);
    expect(clone.state.nested?.isActive).toBe(false);
    expect(clone.state.children![0]).not.toBe(scene.state.children![0]);
    expect(clone.state.actions![0]).not.toBe(scene.state.actions![0]);
  });

  it('SceneObject should have parent when added to container', () => {
    const scene = new TestScene({
      nested: new TestScene({
        name: 'nested',
      }),
      children: [
        new TestScene({
          name: 'layout child',
        }),
      ],
      actions: [
        new TestScene({
          name: 'layout child',
        }),
      ],
    });

    expect(scene.parent).toBe(undefined);
    expect(scene.state.nested?.parent).toBe(scene);
    expect(scene.state.children![0].parent).toBe(scene);
    expect(scene.state.actions![0].parent).toBe(scene);
  });

  it('Can clone with state change', () => {
    const scene = new TestScene({
      nested: new TestScene({
        name: 'nested',
      }),
    });

    const clone = scene.clone({ name: 'new name' });
    expect(clone.state.name).toBe('new name');
  });

  it('Cannot modify state', () => {
    const scene = new TestScene({ name: 'name' });
    expect(() => {
      scene.state.name = 'new name';
    }).toThrow();

    scene.setState({ name: 'new name' });
    expect(scene.state.name).toBe('new name');

    expect(() => {
      scene.state.name = 'other name';
    }).toThrow();
  });

  describe('When activated', () => {
    const scene = new TestScene({
      $data: new SceneDataNode({}),
      $variables: new SceneVariableSet({ variables: [] }),
      $timeRange: new SceneTimeRange({}),
    });

    scene.activate();

    it('Should set isActive true', () => {
      expect(scene.isActive).toBe(true);
    });

    describe('$data', () => {
      test('when an instance', () => {
        expect((scene.state.$data as SceneDataProvider)!.isActive).toBe(true);
      });

      test('when an array', () => {
        const n1 = new SceneDataNode({});
        const n2 = new SceneDataNode({});
        const scene = new TestScene({
          $data: [n1, n2],
          $variables: new SceneVariableSet({ variables: [] }),
          $timeRange: new SceneTimeRange({}),
        });

        scene.activate();
        expect(n1.isActive).toBe(true);
        expect(n2.isActive).toBe(true);
      });
    });

    it('Should activate $variables', () => {
      expect(scene.state.$variables!.isActive).toBe(true);
    });

    it('Should activate $timeRange', () => {
      expect(scene.state.$timeRange!.isActive).toBe(true);
    });
  });

  describe('When deactivated', () => {
    const scene = new TestScene({
      $data: new SceneDataNode({}),
      $variables: new SceneVariableSet({ variables: [] }),
    });

    const deactivateScene = scene.activate();

    // Subscribe to state change and to event
    const stateSub = scene.subscribeToState(() => {});
    const eventSub = scene.subscribeToEvent(SceneObjectStateChangedEvent, () => {});

    deactivateScene();

    it('Should close subscriptions', () => {
      expect((stateSub as any).closed).toBe(true);
      expect((eventSub as any).closed).toBe(true);
    });

    it('Should set isActive false', () => {
      expect(scene.isActive).toBe(false);
    });

    it('Should deactivate $data', () => {
      expect((scene.state.$data as SceneDataProvider)!.isActive).toBe(false);
    });

    it('Should deactivate $variables', () => {
      expect(scene.state.$variables!.isActive).toBe(false);
    });
  });

  describe('Can wire up objects', () => {
    it('State handle activation handlers', () => {
      const nestedScene = new TestScene({ name: 'nested' });
      const scene = new TestScene({
        name: 'root',
        nested: nestedScene,
      });

      // This is just a dummy example of subscribing and reacting to scene object state change from outside the scene objects
      // This should allow more custom behaviors without needing custom scene objects
      let unsubscribed = false;

      scene.addActivationHandler(() => {
        const sub = nestedScene.subscribeToState((state) => scene.setState({ name: state.name }));

        return () => {
          sub.unsubscribe();
          unsubscribed = true;
        };
      });

      const deactivateScene = scene.activate();

      expect(scene.state.name).toBe('root');

      nestedScene.setState({ name: 'new name' });

      expect(scene.state.name).toBe('new name');

      deactivateScene();

      expect(unsubscribed).toBe(true);

      nestedScene.setState({ name: 'new name 2' });

      // Nothing should happen when state change while inactive
      expect(scene.state.name).toBe('new name');

      // Activate scene again
      scene.activate();

      // verify that the wiring is back
      nestedScene.setState({ name: 'new name 3' });
      expect(scene.state.name).toBe('new name 3');
    });

    it('Call activation handlers for new objects in state', () => {
      const scene = new TestScene({
        name: 'root',
        $variables: new SceneVariableSet({ variables: [] }),
        $data: new SceneDataNode({}),
        $timeRange: new SceneTimeRange({}),
      });

      scene.activate();

      const oldState = scene.state;

      scene.setState({
        $variables: new SceneVariableSet({ variables: [] }),
        $data: new SceneDataNode({}),
        $timeRange: new SceneTimeRange({}),
      });

      const newState = scene.state;

      // Verify old state is deactivated
      expect(oldState.$variables!.isActive).toBe(false);
      expect((oldState.$data as SceneDataProvider)!.isActive).toBe(false);
      expect(oldState.$timeRange!.isActive).toBe(false);

      // Verify new state is activated
      expect(newState.$variables!.isActive).toBe(true);
      expect((newState.$data as SceneDataProvider)!.isActive).toBe(true);
      expect(newState.$timeRange!.isActive).toBe(true);
    });
  });

  describe('Ref counting activations', () => {
    it('Should deactivate after last activation caller is deactived', () => {
      const scene = new TestScene({ name: 'nested' });
      let activateCounter = 0;
      let deactivatedCounter = 0;

      scene.addActivationHandler(() => {
        activateCounter++;
        return () => deactivatedCounter++;
      });

      const ref1 = scene.activate();
      expect(activateCounter).toBe(1);
      expect(scene.isActive).toBe(true);

      const ref2 = scene.activate();
      expect(activateCounter).toBe(1);

      ref1();
      expect(deactivatedCounter).toBe(0);

      ref2();
      expect(deactivatedCounter).toBe(1);
    });

    it('Cannot call deactivation function twice', () => {
      const scene = new TestScene({ name: 'nested' });

      const deactivateScene = scene.activate();
      deactivateScene();

      expect(() => deactivateScene()).toThrow();
    });
  });
});

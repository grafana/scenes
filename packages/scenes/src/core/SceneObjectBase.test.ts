import { SceneVariableSet } from '../variables/sets/SceneVariableSet';

import { SceneDataNode } from './SceneDataNode';
import { SceneObjectBase, useSceneObjectState } from './SceneObjectBase';
import { SceneObjectStateChangedEvent } from './events';
import { SceneObject, SceneObjectState } from './types';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { act, renderHook } from '@testing-library/react';
import { SceneObjectRef } from './SceneObjectRef';

export interface TestSceneState extends SceneObjectState {
  name?: string;
  nested?: SceneObject<TestSceneState>;
  children?: TestScene[];
  actions?: SceneObject[];
  ref?: SceneObjectRef<TestScene>;
}

export class TestScene extends SceneObjectBase<TestSceneState> {
  public static created = 0;

  public constructor(state: TestSceneState) {
    super(state);
    TestScene.created++;
  }
}

describe('SceneObject', () => {
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

  it('Can get SceneObjectRef', () => {
    const scene = new TestScene({});
    const ref = scene.getRef();

    expect(scene).toBe(ref.resolve());
    expect(ref).toBe(scene.getRef());
  });

  it('Can json stringify', () => {
    const scene = new TestScene({
      key: 'root',
      nested: new TestScene({ key: 'nested' }),
    });

    expect(JSON.stringify(scene)).toBe(
      '{"type":"TestScene","isActive":false,"state":{"key":"root","nested":{"type":"TestScene","isActive":false,"state":{"key":"nested"}}}}'
    );
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

    it('Should activate $data', () => {
      expect(scene.state.$data!.isActive).toBe(true);
    });

    it('Should activate $variables', () => {
      expect(scene.state.$variables!.isActive).toBe(true);
    });

    it('Should activate $timeRange', () => {
      expect(scene.state.$timeRange!.isActive).toBe(true);
    });
  });

  describe('Should activate itself before child objects', () => {
    const dataChild = new SceneDataNode({});
    const scene = new TestScene({
      $data: dataChild,
    });

    let parentActive = false;

    scene.addActivationHandler(() => {
      parentActive = true;
    });

    dataChild.addActivationHandler(() => {
      expect(parentActive).toBe(true);
    });

    scene.activate();
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
      expect(scene.state.$data!.isActive).toBe(false);
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
        $behaviors: [],
      });

      scene.activate();

      const oldState = scene.state;

      scene.setState({
        $variables: new SceneVariableSet({ variables: [] }),
        $data: new SceneDataNode({}),
        $timeRange: new SceneTimeRange({}),
        $behaviors: [],
      });

      const newState = scene.state;

      // Verify old state is deactivated
      expect(oldState.$variables!.isActive).toBe(false);
      expect(oldState.$data!.isActive).toBe(false);
      expect(oldState.$timeRange!.isActive).toBe(false);

      // Verify new state is activated
      expect(newState.$variables!.isActive).toBe(true);
      expect(newState.$data!.isActive).toBe(true);
      expect(newState.$timeRange!.isActive).toBe(true);
    });

    it('Call activation handlers for new behaviors in state', () => {
      const behavior1Deactivate = jest.fn();
      const behavior1 = jest.fn().mockReturnValue(behavior1Deactivate);
      const behavior2Deactivate = jest.fn();
      const behavior2 = jest.fn().mockReturnValue(behavior2Deactivate);
      const behavior3Deactivate = jest.fn();
      const behavior3 = jest.fn().mockReturnValue(behavior3Deactivate);

      const scene = new TestScene({
        name: 'root',
        $behaviors: [behavior1, behavior2],
      });

      const deactivate = scene.activate();

      // Remove behavior 2 and and behavior 3
      scene.setState({ $behaviors: [behavior1, behavior3] });

      // 1 should have been called 1 times and not deactivated
      expect(behavior1Deactivate).toHaveBeenCalledTimes(0);
      expect(behavior1).toHaveBeenCalledTimes(1);

      // 2 should have been deactivated
      expect(behavior2Deactivate).toHaveBeenCalledTimes(1);

      // 3 should have been activated
      expect(behavior3).toHaveBeenCalledTimes(1);

      deactivate();
      expect(behavior1Deactivate).toHaveBeenCalledTimes(1);
      expect(behavior2Deactivate).toHaveBeenCalledTimes(1); // just to check it's not deactivated again
      expect(behavior3Deactivate).toHaveBeenCalledTimes(1);
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

    describe('When calling deactivation function twice', () => {
      it('should throw error', () => {
        const scene = new TestScene({ name: 'nested' });

        const deactivateScene = scene.activate();
        deactivateScene();

        expect(() => deactivateScene()).toThrow();
      });
    });
  });
});

describe('useSceneObjectState', () => {
  it('When called with no options', () => {
    const scene = new TestScene({ name: 'nested' });

    const { result } = renderHook(() => useSceneObjectState(scene));

    expect(result.current).toBe(scene.state);
    expect(scene.isActive).toBe(false);

    act(() => scene.setState({ name: 'New name' }));

    expect(result.current.name).toBe('New name');
  });

  it('Should activate scene object when shouldActivateOrKeepAlive is true', () => {
    const scene = new TestScene({ name: 'nested' });

    const { result, unmount } = renderHook(() => useSceneObjectState(scene, { shouldActivateOrKeepAlive: true }));

    expect(scene.isActive).toBe(true);
    expect(result.current).toBe(scene.state);

    act(() => scene.setState({ name: 'New name' }));

    expect(result.current.name).toBe('New name');

    // Verify multiple components can useState on same object
    const { result: result2, unmount: unmount2 } = renderHook(() =>
      useSceneObjectState(scene, { shouldActivateOrKeepAlive: true })
    );

    unmount();
    expect(scene.isActive).toBe(true);

    act(() => scene.setState({ name: 'Second update' }));
    expect(result2.current.name).toBe('Second update');

    // Last useState unmounts deactive scene object
    unmount2();
    expect(scene.isActive).toBe(false);
  });

  it('Should return latest state on rerender', () => {
    const scene = new TestScene({ name: 'nested' });

    const { result, rerender } = renderHook((scene) => useSceneObjectState(scene), { initialProps: scene });

    const scene2 = new TestScene({ name: 'new scene name' });

    rerender(scene2);

    expect(result.current.name).toBe('new scene name');
  });
});

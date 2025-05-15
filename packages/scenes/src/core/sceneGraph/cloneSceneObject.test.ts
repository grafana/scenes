import { cloneDeep } from 'lodash';
import { VizPanel } from '../../components/VizPanel/VizPanel';
import { TestScene } from '../SceneObjectBase.test';

describe('cloneSceneObject', () => {
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

  it('Can clone with ref', () => {
    const refValue = new TestScene({ name: 'ref' });
    const scene = new TestScene({
      name: 'clone',
      ref: refValue.getRef(),
    });

    const clone = scene.clone();
    expect(clone.state.name).toBe('clone');
    expect(clone.state.ref?.resolve()).toBe(refValue);
  });

  it('Should ignore cloning properties specified in overrides', () => {
    const scene = new TestScene({ name: 'clone', nested: new TestScene({ name: 'nested' }) });

    TestScene.created = 0;

    scene.clone();

    expect(TestScene.created).toBe(2);

    scene.clone({ nested: undefined });

    expect(TestScene.created).toBe(3);
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

  it('Can clone with state and that state should not be cloned', () => {
    const nested = new TestScene({ name: 'nested' });
    const scene = new TestScene({ name: 'test', nested });

    const clone = scene.clone({ nested });
    expect(clone.state.nested).toBe(nested);
  });

  it('Performance test', () => {
    const largeObj = getLargeOptionsObject();

    const scene = new TestScene({
      nested: new VizPanel({
        options: largeObj,
      }),
    });

    const sceneCloneTime = measureAction(() => {
      for (let i = 0; i < 10000; i++) {
        scene.clone();
      }
    });

    const plainCloneTime = measureAction(() => {
      for (let i = 0; i < 10000; i++) {
        cloneDeep(largeObj);
      }
    });

    // not sure how slow ci systems are so just comparing against plain clone of just the object*3
    expect(sceneCloneTime).toBeLessThan(plainCloneTime * 3);
  });
});

function measureAction(action: () => void) {
  const mark1 = performance.now();
  action();
  const mark2 = performance.now();
  return mark2 - mark1;
}

function getLargeOptionsObject() {
  return {
    inlineEditing: true,
    showAdvancedTypes: true,
    panZoom: false,
    infinitePan: false,
    root: {
      background: {
        color: {
          fixed: 'transparent',
        },
        image: {
          fixed: 'img/bg/p4.png',
          mode: 'fixed',
        },
      },
      border: {
        color: {
          fixed: 'dark-green',
        },
      },
      constraint: {
        horizontal: 'left',
        vertical: 'top',
      },
      elements: [
        {
          background: {
            color: {
              field: 'time',
              fixed: '#D9D9D9',
            },
          },
          border: {
            color: {
              fixed: 'dark-green',
            },
          },
          config: {
            align: 'center',
            color: {
              fixed: '#000000',
            },
            size: 20,
            text: {
              field: 'time',
              fixed: '',
              mode: 'field',
            },
            valign: 'middle',
          },
          constraint: {
            horizontal: 'left',
            vertical: 'top',
          },
          links: [],
          name: 'Element 1',
          placement: {
            height: 173,
            left: 53,
            rotation: 0,
            top: 24,
            width: 224,
          },
          type: 'metric-value',
        },
        {
          background: {
            color: {
              fixed: '#D9D9D9',
            },
          },
          border: {
            color: {
              fixed: 'dark-green',
            },
          },
          config: {
            align: 'center',
            color: {
              fixed: '#000000',
            },
            valign: 'middle',
          },
          constraint: {
            horizontal: 'left',
            vertical: 'top',
          },
          links: [],
          name: 'Element 2',
          placement: {
            height: 117,
            left: 388,
            rotation: 325,
            top: 110,
            width: 210,
          },
          type: 'ellipse',
        },
        {
          background: {
            color: {
              fixed: '#D9D9D9',
            },
          },
          border: {
            color: {
              fixed: 'dark-green',
            },
          },
          config: {
            align: 'center',
            color: {
              fixed: '#000000',
            },
            valign: 'middle',
          },
          constraint: {
            horizontal: 'left',
            vertical: 'top',
          },
          links: [],
          name: 'Element 3',
          placement: {
            height: 160,
            left: 872,
            rotation: 45,
            top: 64,
            width: 240,
          },
          type: 'rectangle',
        },
        {
          background: {
            color: {
              fixed: 'transparent',
            },
          },
          border: {
            color: {
              fixed: 'dark-green',
            },
          },
          config: {
            type: 'Single',
          },
          constraint: {
            horizontal: 'left',
            vertical: 'top',
          },
          links: [],
          name: 'Element 4',
          placement: {
            height: 121,
            left: 700,
            rotation: 0,
            top: 108,
            width: 168,
          },
          type: 'server',
        },
        {
          background: {
            color: {
              fixed: 'transparent',
            },
          },
          border: {
            color: {
              fixed: 'dark-green',
            },
          },
          constraint: {
            horizontal: 'left',
            vertical: 'top',
          },
          links: [],
          name: 'Element 5',
          placement: {
            height: 175,
            left: 590,
            rotation: 0,
            top: 10,
            width: 101,
          },
          type: 'windTurbine',
        },
        {
          background: {
            color: {
              fixed: 'transparent',
            },
          },
          border: {
            color: {
              fixed: 'dark-green',
            },
          },
          constraint: {
            horizontal: 'left',
            vertical: 'top',
          },
          links: [],
          name: 'Element 6',
          placement: {
            height: 26,
            left: 607,
            rotation: 0,
            top: 285,
            width: 100,
          },
          type: 'droneSide',
        },
      ],
      name: 'Element 1747132468024',
      placement: {
        height: 100,
        left: 0,
        rotation: 0,
        top: 0,
        width: 100,
      },
      type: 'frame',
    },
  };
}

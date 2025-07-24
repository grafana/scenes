import { render } from '@testing-library/react';
import { SceneComponentProps, SceneObjectState } from './types';
import { SceneObjectBase } from './SceneObjectBase';

/**
 * Used in a couple of unit tests
 */
export interface TestSceneState extends SceneObjectState {
  name?: string;
}

export class TestScene extends SceneObjectBase<TestSceneState> {
  public renderCount = 0;

  public setRenderBeforeActivation(value: boolean) {
    this._renderBeforeActivation = value;
  }

  public static Component = ({ model }: SceneComponentProps<TestScene>) => {
    const { name } = model.useState();

    model.renderCount += 1;

    return (
      <div>
        <div>name: {name}</div>
        <div>isActive: {model.isActive.toString()}</div>
      </div>
    );
  };
}

describe('SceneComponentWrapper', () => {
  it('Should render should activate object', () => {
    const scene = new TestScene({ name: 'nested' });
    render(<scene.Component model={scene} />);

    expect(scene.renderCount).toBe(1);
    expect(scene.isActive).toBe(true);
  });

  it('Unmount should deactivate', () => {
    const scene = new TestScene({ name: 'nested' });
    const { unmount } = render(<scene.Component model={scene} />);

    expect(scene.isActive).toBe(true);

    unmount();

    expect(scene.isActive).toBe(false);
  });

  it('should not render component until after activation', () => {
    const scene = new TestScene({ name: 'nested' });
    const screen = render(<scene.Component model={scene} />);

    expect(scene.renderCount).toBe(1);
    expect(screen.getByText('isActive: true')).toBeInTheDocument();
  });

  it('should render component before activation whgen renderBeforeActivation is true', () => {
    const scene = new TestScene({ name: 'nested' });
    scene.setRenderBeforeActivation(true);

    render(<scene.Component model={scene} />);

    expect(scene.renderCount).toBe(2);
  });
});

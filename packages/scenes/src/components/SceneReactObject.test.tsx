import { Button } from '@grafana/ui';
import { screen, render, act } from '@testing-library/react';
import { SceneReactObject } from './SceneReactObject';
import { SceneFlexItem, SceneFlexLayout } from './layout/SceneFlexLayout';

describe('SceneReactObject', () => {
  it('should render component', () => {
    const jrmr = new SceneReactObject({
      component: MyCoolComponent,
      props: { prop: 'initial text' },
    });

    const scene = new SceneFlexLayout({ children: [new SceneFlexItem({ body: jrmr })] });

    render(<scene.Component model={scene} />);

    expect(screen.getByText('initial text')).toBeInTheDocument();

    // Verify we can update props and get a re-render
    act(() => {
      jrmr.setState({ props: { prop: 'updatedText' } });
    });

    expect(screen.getByText('updatedText')).toBeInTheDocument();
  });

  it('should render ReactNode', () => {
    const jrmr = new SceneReactObject({
      reactNode: <Button>buttonText</Button>,
    });

    const scene = new SceneFlexLayout({ children: [new SceneFlexItem({ body: jrmr })] });

    render(<scene.Component model={scene} />);

    expect(screen.getByText('buttonText')).toBeInTheDocument();
  });
});

interface Props {
  prop: string;
}

export function MyCoolComponent({ prop }: Props) {
  return <div>{prop}</div>;
}

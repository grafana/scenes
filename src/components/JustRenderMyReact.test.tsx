import { Button } from '@grafana/ui';
import { screen, render, act } from '@testing-library/react';
import React from 'react';
import { JustRenderMyReact } from './JustRenderMyReact';
import { SceneFlexLayout } from './layout/SceneFlexLayout';

describe('JustRenderMyReact', () => {
  it('should render component', () => {
    const jrmr = new JustRenderMyReact({
      component: Button,
      props: { children: 'buttonText' },
    });

    const scene = new SceneFlexLayout({ children: [jrmr] });

    render(<scene.Component model={scene} />);

    expect(screen.getByText('buttonText')).toBeInTheDocument();

    // Verify we can update props and get a re-render
    act(() => {
      jrmr.setState({ props: { children: 'updatedText' } });
    });

    expect(screen.getByText('updatedText')).toBeInTheDocument();
  });

  it('should render ReactNode', () => {
    const jrmr = new JustRenderMyReact({
      reactNode: <Button>buttonText</Button>,
    });

    const scene = new SceneFlexLayout({ children: [jrmr] });

    render(<scene.Component model={scene} />);

    expect(screen.getByText('buttonText')).toBeInTheDocument();
  });
});

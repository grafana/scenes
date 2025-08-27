import { screen, render, waitFor, act } from '@testing-library/react';

import { NestedScene } from './NestedScene';
import { EmbeddedScene } from './EmbeddedScene';
import { SceneCanvasText } from './SceneCanvasText';
import { SceneFlexItem, SceneFlexLayout } from './layout/SceneFlexLayout';

function setup() {
  const scene = new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: new NestedScene({
            title: 'Nested title',
            canRemove: true,
            canCollapse: true,
            body: new SceneFlexLayout({
              children: [new SceneFlexItem({ body: new SceneCanvasText({ text: 'SceneCanvasText' }) })],
            }),
          }),
        }),
      ],
    }),
  });

  render(<scene.Component model={scene} />);
}

describe('NestedScene', () => {
  it('Renders heading and layout', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Nested title' })).toBeInTheDocument();
    expect(screen.getByText('SceneCanvasText')).toBeInTheDocument();
  });

  it('Can remove', async () => {
    setup();

    act(() => {
      screen.getByRole('button', { name: 'Remove scene' }).click();
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Nested title' })).not.toBeInTheDocument();
    });
  });

  it('Can collapse and expand', async () => {
    setup();

    act(() => {
      screen.getByRole('button', { name: 'Collapse scene' }).click();
    });

    await waitFor(() => {
      expect(screen.queryByText('SceneCanvasText')).not.toBeInTheDocument();
    });

    act(() => {
      screen.getByRole('button', { name: 'Expand scene' }).click();
    });

    await waitFor(() => {
      expect(screen.queryByText('SceneCanvasText')).toBeInTheDocument();
    });
  });
});

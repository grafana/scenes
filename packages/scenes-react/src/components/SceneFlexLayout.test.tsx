import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { SceneFlexLayout as SceneFlexLayoutObject } from '@grafana/scenes';

import { SceneFlexItem } from './SceneFlexItem';
import { SceneFlexLayout } from './SceneFlexLayout';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    buildInfo: {
      version: '1.0.0',
    },
    theme2: {
      breakpoints: {
        down: jest.fn().mockReturnValue('@media (max-width: 0px)'),
      },
      visualization: {
        getColorByName: jest.fn().mockReturnValue('red'),
      },
    },
  },
}));

describe('SceneFlexLayout', () => {
  it('Should add itself to scene and clean up on unmount', async () => {
    const scene = new SceneContextObject();

    const { unmount } = render(
      <TestContextProvider value={scene}>
        <SceneFlexLayout direction="column">
          <SceneFlexItem>
            <div>Child</div>
          </SceneFlexItem>
        </SceneFlexLayout>
      </TestContextProvider>
    );

    await waitFor(() => expect(scene.state.children.length).toBe(1));
    expect(scene.state.children[0]).toBeInstanceOf(SceneFlexLayoutObject);

    // Content renders through the layout's scene renderer
    expect(await screen.findByText('Child')).toBeInTheDocument();

    unmount();
    expect(scene.state.children.length).toBe(0);
  });

  it('Should keep DOM order in sync with React child order', async () => {
    const scene = new SceneContextObject();

    const renderTree = (swap: boolean) => (
      <TestContextProvider value={scene}>
        <SceneFlexLayout direction="column">
          {swap ? (
            <>
              <SceneFlexItem key="b">
                <div>B</div>
              </SceneFlexItem>
              <SceneFlexItem key="a">
                <div>A</div>
              </SceneFlexItem>
            </>
          ) : (
            <>
              <SceneFlexItem key="a">
                <div>A</div>
              </SceneFlexItem>
              <SceneFlexItem key="b">
                <div>B</div>
              </SceneFlexItem>
            </>
          )}
        </SceneFlexLayout>
      </TestContextProvider>
    );

    const { rerender } = render(renderTree(false));

    expect(await screen.findByText('A')).toBeInTheDocument();
    expect(await screen.findByText('B')).toBeInTheDocument();

    const a1 = screen.getByText('A');
    const b1 = screen.getByText('B');
    expect(a1.compareDocumentPosition(b1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    rerender(renderTree(true));

    await waitFor(() => {
      const a2 = screen.getByText('A');
      const b2 = screen.getByText('B');
      expect(b2.compareDocumentPosition(a2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});

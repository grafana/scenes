import React from 'react';
import { render } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { VizConfigBuilders, VizPanel as VizPanelObject } from '@grafana/scenes';
import { VizPanel } from './VizPanel';
import { PanelPlugin } from '@grafana/data';
import { TestContextProvider } from '../utils/testUtils';

let pluginToLoad: PanelPlugin | undefined;

global.ResizeObserver = class {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  observe() {}
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  disconnect() {}
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getPluginImportUtils: () => ({
    getPanelPluginFromCache: jest.fn(() => pluginToLoad),
  }),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 500, height: 500 }],
}));

describe('VizPanel', () => {
  it('Should add itself to scene', async () => {
    const scene = new SceneContextObject();
    const viz = VizConfigBuilders.timeseries().build();

    const { rerender, unmount } = render(
      <TestContextProvider value={scene}>
        <VizPanel title="Test" viz={viz} />
      </TestContextProvider>
    );

    const panel = scene.state.children[0] as VizPanelObject;
    expect(panel.state.title).toBe('Test');

    rerender(
      <TestContextProvider value={scene}>
        <VizPanel title="New title" viz={viz} />
      </TestContextProvider>
    );

    expect(panel.state.title).toBe('New title');

    unmount();

    expect(scene.state.children.length).toBe(0);
  });

  it('Should render with titleItems', () => {
    const scene = new SceneContextObject();
    const viz = VizConfigBuilders.timeseries().build();
    const titleItems = <div>Title Item</div>;

    const { getByText } = render(
      <TestContextProvider value={scene}>
        <VizPanel title="Test" titleItems={titleItems} viz={viz} />
      </TestContextProvider>
    );

    expect(getByText('Title Item')).toBeInTheDocument();
  });

  it('Should render with headerActions', () => {
    const scene = new SceneContextObject();
    const viz = VizConfigBuilders.timeseries().build();
    const headerActions = <button>Action</button>;

    const { getByText } = render(
      <TestContextProvider value={scene}>
        <VizPanel title="Test" headerActions={headerActions} viz={viz} />
      </TestContextProvider>
    );

    expect(getByText('Action')).toBeInTheDocument();
  });
});

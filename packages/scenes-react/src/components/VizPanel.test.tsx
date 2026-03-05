import React from 'react';
import { render } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { VizConfigBuilders, VizPanel as VizPanelObject, VizPanelMenu } from '@grafana/scenes';
import { VizPanel, VizPanelProps } from './VizPanel';
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
    const titleItems = <div key="title-item">Title Item</div>;

    const { rerender, unmount } = render(
      <TestContextProvider value={scene}>
        <VizPanel titleItems={titleItems} title="Test" viz={viz} />
      </TestContextProvider>
    );

    const panel = scene.state.children[0] as VizPanelObject;
    expect(panel.state.titleItems).toEqual(titleItems);

    rerender(
      <TestContextProvider value={scene}>
        <VizPanel titleItems={undefined} title="Test" viz={viz} />
      </TestContextProvider>
    );

    expect(panel.state.titleItems).toEqual(undefined);

    unmount();

    expect(scene.state.children.length).toBe(0);
  });

  it('Should render with headerActions', () => {
    const scene = new SceneContextObject();
    const viz = VizConfigBuilders.timeseries().build();
    const headerActions = <button>Action</button>;

    const { rerender, unmount } = render(
      <TestContextProvider value={scene}>
        <VizPanel title="Test" viz={viz} headerActions={headerActions} />
      </TestContextProvider>
    );

    const panel = scene.state.children[0] as VizPanelObject;
    expect(panel.state.headerActions).toEqual(headerActions);

    rerender(
      <TestContextProvider value={scene}>
        <VizPanel title="Test" viz={viz} />
      </TestContextProvider>
    );

    unmount();

    expect(scene.state.children.length).toBe(0);
  });

  it('Should render VizPanelProps', () => {
    const scene = new SceneContextObject();
    const viz = VizConfigBuilders.timeseries().build();
    const headerActions = <button>Action</button>;
    const seriesLimit = 1;
    const collapsed = true;
    const collapsible = true;
    const hoverHeader = true;
    const description = 'description';
    const menu = new VizPanelMenu({});
    const title = 'title';
    const props: VizPanelProps = {
      title,
      viz,
      headerActions,
      seriesLimit,
      collapsed,
      collapsible,
      hoverHeader,
      description,
      menu,
    };

    const { rerender, unmount } = render(
      <TestContextProvider value={scene}>
        <VizPanel {...props} headerActions={headerActions} />
      </TestContextProvider>
    );

    const panel = scene.state.children[0] as VizPanelObject;
    expect(panel.state.headerActions).toEqual(headerActions);
    expect(panel.state.collapsed).toEqual(collapsed);
    expect(panel.state.seriesLimit).toEqual(seriesLimit);
    expect(panel.state.collapsible).toEqual(collapsible);
    expect(panel.state.hoverHeader).toEqual(hoverHeader);
    expect(panel.state.description).toEqual(description);
    expect(panel.state.menu).toEqual(menu);

    rerender(
      <TestContextProvider value={scene}>
        <VizPanel title="Test" viz={viz} />
      </TestContextProvider>
    );

    expect(panel.state.headerActions).toEqual(undefined);
    expect(panel.state.collapsed).toEqual(undefined);
    expect(panel.state.seriesLimit).toEqual(undefined);
    expect(panel.state.collapsible).toEqual(undefined);
    expect(panel.state.hoverHeader).toEqual(undefined);
    expect(panel.state.description).toEqual(undefined);
    expect(panel.state.menu).toEqual(undefined);

    unmount();

    expect(scene.state.children.length).toBe(0);
  });
});

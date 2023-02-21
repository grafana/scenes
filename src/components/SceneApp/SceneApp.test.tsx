import { screen, render } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';
import { SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneCanvasText } from '../SceneCanvasText';
import { SceneApp, SceneAppPage, SceneRouteMatch } from './SceneApp';

const setupScene = (inspectableObject: SceneObject) => {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [inspectableObject],
    }),
  });
};

let history = createMemoryHistory();
const getDrilldownScene = (match: SceneRouteMatch<{ id: string }>) =>
  setupScene(new SceneCanvasText({ text: `${match.params.id} drilldown!` }));

describe('SceneApp', () => {
  it('should error when rendered outside of a router context', () => {
    const page1Scene = setupScene(new SceneCanvasText({ text: 'Page 1' }));
    const app = new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          getScene: () => {
            return page1Scene;
          },
        }),
      ],
    });

    expect(() => render(<app.Component model={app} />)).toThrowErrorMatchingInlineSnapshot(
      `"Invariant failed: You should not use <Switch> outside a <Router>"`
    );
  });

  it('should render a top level page', async () => {
    const p1Object = new SceneCanvasText({ text: 'Page 1' });
    const p2Object = new SceneCanvasText({ text: 'Page 2' });
    const page1Scene = setupScene(p1Object);
    const page2Scene = setupScene(p2Object);

    const app = new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          getScene: () => {
            return page1Scene;
          },
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          getScene: () => {
            return page2Scene;
          },
        }),
      ],
    });

    history.push('/test');
    render(
      <Router history={history}>
        <app.Component model={app} />
      </Router>
    );
    expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();
    expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();

    history.push('/test1');
    await new Promise((r) => setTimeout(r, 1));

    expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
    expect(screen.queryByTestId(p2Object.state.key!)).toBeInTheDocument();
  });

  it('should render a sub page (tab)', async () => {
    const p1Object = new SceneCanvasText({ text: 'Page 1' });
    const p2Object = new SceneCanvasText({ text: 'Page 2' });
    const page2Scene = setupScene(p2Object);

    const t1Object = new SceneCanvasText({ text: 'Tab 1' });
    const t2Object = new SceneCanvasText({ text: 'Tab 2' });
    const tab1Scene = setupScene(t1Object);
    const tab2Scene = setupScene(t2Object);

    const app = new SceneApp({
      pages: [
        // Page with tabs
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          getScene: () => {
            return tab1Scene;
          },
          tabs: [
            new SceneAppPage({
              title: 'Test',
              url: '/test/tab1',
              getScene: () => {
                return tab1Scene;
              },
            }),
            new SceneAppPage({
              title: 'Test',
              url: '/test/tab2',
              getScene: () => {
                return tab2Scene;
              },
            }),
          ],
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          getScene: () => {
            return page2Scene;
          },
        }),
      ],
    });

    history.push('/test/tab1');
    render(
      <Router history={history}>
        <app.Component model={app} />
      </Router>
    );
    expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
    expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
    expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
    expect(screen.queryByTestId(t2Object.state.key!)).not.toBeInTheDocument();

    history.push('/test/tab2');
    await new Promise((r) => setTimeout(r, 1));

    expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
    expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
    expect(screen.queryByTestId(t1Object.state.key!)).not.toBeInTheDocument();
    expect(screen.queryByTestId(t2Object.state.key!)).toBeInTheDocument();
  });

  describe('drilldown', () => {
    it('should render a drilldown page', async () => {
      const p1Object = new SceneCanvasText({ text: 'Page 1' });
      const page1Scene = setupScene(p1Object);

      const app = new SceneApp({
        pages: [
          // Page with tabs
          new SceneAppPage({
            title: 'Test',
            url: '/test-drilldown',
            getScene: () => {
              return page1Scene;
            },
            drilldowns: [
              {
                routePath: '/test-drilldown/:id',
                getPage: (match: SceneRouteMatch<{ id: string }>) => {
                  return new SceneAppPage({
                    title: 'drilldown',
                    url: `/test-drilldown/${match.params.id}`,
                    getScene: () => getDrilldownScene(match),
                  });
                },
              },
            ],
          }),
        ],
      });

      history.push('/test-drilldown');
      render(
        <Router history={history}>
          <app.Component model={app} />
        </Router>
      );
      expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();

      history.push('/test-drilldown/some-id');
      await new Promise((r) => setTimeout(r, 1));
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByText('some-id drilldown!')).toBeInTheDocument();

      history.push('/test-drilldown/some-other-id');
      await new Promise((r) => setTimeout(r, 1));
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();
      expect(screen.queryByText('some-other-id drilldown!')).toBeInTheDocument();
    });

    it('should render a drilldown that is part of tab page', async () => {
      const p1Object = new SceneCanvasText({ text: 'Page 1' });
      const page1Scene = setupScene(p1Object);
      const t1Object = new SceneCanvasText({ text: 'Tab 1' });
      const tab1Scene = setupScene(t1Object);

      const app = new SceneApp({
        pages: [
          // Page with tabs
          new SceneAppPage({
            title: 'Test',
            url: '/test',
            getScene: () => {
              return page1Scene;
            },
            tabs: [
              new SceneAppPage({
                title: 'Test',
                url: '/test/tab',
                getScene: () => {
                  return tab1Scene;
                },
                drilldowns: [
                  {
                    routePath: '/test/tab/:id',
                    getPage: (match: SceneRouteMatch<{ id: string }>) => {
                      return new SceneAppPage({
                        title: 'drilldown',
                        url: `/test/tab/${match.params.id}`,
                        getScene: () => getDrilldownScene(match),
                      });
                    },
                  },
                ],
              }),
            ],
          }),
        ],
      });

      history.push('/test/tab');
      render(
        <Router history={history}>
          <app.Component model={app} />
        </Router>
      );
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();

      history.push('/test/tab/some-id');
      await new Promise((r) => setTimeout(r, 1));
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByText('some-id drilldown!')).toBeInTheDocument();

      history.push('/test/tab/some-other-id');
      await new Promise((r) => setTimeout(r, 1));
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();
      expect(screen.queryByText('some-other-id drilldown!')).toBeInTheDocument();
    });
  });
});

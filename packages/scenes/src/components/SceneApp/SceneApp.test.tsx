import { screen, render } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';
import { SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneCanvasText } from '../SceneCanvasText';
import { SceneApp } from './SceneApp';
import { SceneAppPage } from './SceneAppPage';
import { SceneRouteMatch } from './types';

let history = createMemoryHistory();

describe('SceneApp', () => {
  const original = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = original;
  });

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

  describe('Given an app with two pages', () => {
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

    beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test'));

    it('should render correct page on mount', async () => {
      expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Can navigate to other page', async () => {
      history.push('/test1');
      await new Promise((r) => setTimeout(r, 1));
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(p2Object.state.key!)).toBeInTheDocument();
    });

    // it('When url does not match any page show fallback route', async () => {
    //   history.push('/asdsad');
    //   await new Promise((r) => setTimeout(r, 1));
    //   expect(await screen.findByText('Not found')).toBeInTheDocument();
    // });
  });

  describe('Given a page with two tabs', () => {
    const p2Object = new SceneCanvasText({ text: 'Page 2' });
    const t1Object = new SceneCanvasText({ text: 'Tab 1' });
    const t2Object = new SceneCanvasText({ text: 'Tab 2' });

    const app = new SceneApp({
      pages: [
        // Page with tabs
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          tabs: [
            new SceneAppPage({
              title: 'Test',
              url: '/test/tab1',
              getScene: () => setupScene(t1Object),
            }),
            new SceneAppPage({
              title: 'Test',
              url: '/test/tab2',
              getScene: () => setupScene(t2Object),
            }),
          ],
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          getScene: () => setupScene(p2Object),
        }),
      ],
    });

    beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test'));

    it('Render first tab with the url of the parent', () => {
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(t2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Render first tab with its own url', async () => {
      history.push('/test/tab1');
      await new Promise((r) => setTimeout(r, 1));
      expect(await screen.findByTestId(t1Object.state.key!)).toBeInTheDocument();
    });

    it('Can render second tab', async () => {
      history.push('/test/tab2');
      await new Promise((r) => setTimeout(r, 1));
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t2Object.state.key!)).toBeInTheDocument();
    });
  });

  describe('drilldowns', () => {
    describe('Drilldowns on page level', () => {
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

      beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test-drilldown'));

      it('should render a drilldown page', async () => {
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
    });

    describe('Drilldowns on tab level', () => {
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

      beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/test/tab'));

      it('should render a drilldown that is part of tab page', async () => {
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
});

function setupScene(inspectableObject: SceneObject) {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [new SceneFlexItem({ body: inspectableObject })],
    }),
  });
}

function getDrilldownScene(match: SceneRouteMatch<{ id: string }>) {
  return setupScene(new SceneCanvasText({ text: `${match.params.id} drilldown!` }));
}

function renderAppInsideRouterWithStartingUrl(app: SceneApp, startingUrl: string) {
  history.push(startingUrl);
  render(
    <Router history={history}>
      <app.Component model={app} />
    </Router>
  );
}

import { NavModelItem } from '@grafana/data';
import { locationService, PluginPageProps } from '@grafana/runtime';
import { screen, render } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { renderAppInsideRouterWithStartingUrl } from '../../../utils/test/utils';
import { SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneCanvasText } from '../SceneCanvasText';
import { SceneApp, useSceneApp } from './SceneApp';
import { SceneAppPage } from './SceneAppPage';
import { SceneRouteMatch } from './types';
import { SceneReactObject } from '../SceneReactObject';

let history = createMemoryHistory();
let pluginPageProps: PluginPageProps | undefined;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  PluginPage: function PluginPageMock(props: PluginPageProps) {
    pluginPageProps = props;
    return <div>{props.children}</div>;
  },
}));

jest.mock('../../utils/utils', () => ({
  ...jest.requireActual('../../utils/utils'),
  useLocationServiceSafe: () => locationService,
}));

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

    beforeEach(() => renderAppInsideRouterWithStartingUrl(history, app, '/test'));

    it('should render correct page on mount', async () => {
      expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Can navigate to other page', async () => {
      history.push('/test1');

      expect(await screen.findByTestId(p2Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
    });
  });

  describe('Given a page with two tabs', () => {
    const p2Object = new SceneCanvasText({ text: 'Page 2' });
    const t1Object = new SceneCanvasText({ text: 'Tab 1' });
    const t2Object = new SceneCanvasText({ text: 'Tab 2' });

    const app = new SceneApp({
      pages: [
        // Page with tabs
        new SceneAppPage({
          title: 'Container page',
          url: '/test',
          tabs: [
            new SceneAppPage({
              title: 'Tab1',
              titleIcon: 'grafana',
              tabSuffix: () => <strong>tab1 suffix</strong>,
              url: '/test/tab1',
              getScene: () => setupScene(t1Object, 'tab1-scene'),
            }),
            new SceneAppPage({
              title: 'Tab2',
              url: '/test/tab2',
              getScene: () => setupScene(t2Object, 'tab2-scene'),
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

    beforeEach(() => renderAppInsideRouterWithStartingUrl(history, app, '/test'));

    it('should render correct breadcrumbs', async () => {
      expect(flattenPageNav(pluginPageProps?.pageNav!)).toEqual(['Container page']);
    });

    it('Inner embedded scene should be active and connected to containerPage', async () => {
      expect((window as any).__grafanaSceneContext.state.key).toBe('tab1-scene');
      expect((window as any).__grafanaSceneContext.parent.state.title).toBe('Container page');
    });

    it('should render tab title with icon and suffix', async () => {
      expect(pluginPageProps?.pageNav?.children?.[0].icon).toEqual('grafana');
      const suffix = pluginPageProps?.pageNav?.children?.[0].tabSuffix;
      expect((suffix as any)()).toEqual(<strong>tab1 suffix</strong>);
    });

    it('Render first tab with the url of the parent', () => {
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(t2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Render first tab with its own url', async () => {
      history.push('/test/tab1');
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
    });

    it('Can render second tab', async () => {
      history.push('/test/tab2');

      expect(await screen.findByTestId(t2Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).not.toBeInTheDocument();

      expect((window as any).__grafanaSceneContext.state.key).toBe('tab2-scene');
    });
  });

  describe('drilldowns', () => {
    describe('Drilldowns on page level', () => {
      const p1Object = new SceneCanvasText({ text: 'Page 1' });
      const page1Scene = setupScene(p1Object);

      const app = new SceneApp({
        name: 'cool-app-123',
        key: 'cool-app-123',
        pages: [
          // Page with tabs
          new SceneAppPage({
            key: 'top-level-page',
            title: 'Top level page',
            url: '/test-drilldown',
            getScene: () => {
              return page1Scene;
            },
            drilldowns: [
              {
                routePath: '/test-drilldown/:id',
                getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                  return new SceneAppPage({
                    key: 'drilldown-page',
                    title: `Drilldown ${match.params.id}`,
                    url: `/test-drilldown/${match.params.id}`,
                    getScene: () => getDrilldownScene(match),
                    getParentPage: () => parent,
                  });
                },
              },
            ],
          }),
        ],
      });

      beforeEach(() => renderAppInsideRouterWithStartingUrl(history, app, '/test-drilldown'));

      it('should render a drilldown page', async () => {
        expect(screen.queryByTestId(p1Object.state.key!)).toBeInTheDocument();

        history.push('/test-drilldown/some-id');

        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

        // Verify embedded scene is activated and is connected to it's parent page
        expect((window as any).__grafanaSceneContext.state.key).toBe('drilldown-scene-some-id');
        expect((window as any).__grafanaSceneContext.parent.state.key).toBe('drilldown-page');

        // Verify pageNav is correct
        expect(flattenPageNav(pluginPageProps?.pageNav!)).toEqual(['Drilldown some-id', 'Top level page']);

        history.push('/test-drilldown/some-other-id');

        expect(await screen.findByText('some-other-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
        expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();

        // Verify data enricher is forwarded to SceneApp
        const page = (window as any).__grafanaSceneContext.parent as SceneAppPage;
        expect(page.enrichDataRequest(page)).toEqual({ app: 'cool-app-123' });
      });

      it('When url does not match any drilldown sub page show fallback route', async () => {
        history.push('/test-drilldown/some-id/does-not-exist');
        expect(await screen.findByTestId('default-fallback-content')).toBeInTheDocument();
      });

      describe('Drilldowns on page level with tabs', () => {
        const p1Object = new SceneCanvasText({ text: 'Page 1' });
        const page1Scene = setupScene(p1Object);

        const app = new SceneApp({
          pages: [
            // Page with tabs
            new SceneAppPage({
              title: 'Top level page',
              url: '/main',
              tabs: [
                new SceneAppPage({
                  title: 'Tab ',
                  url: '/main/tab',
                  getScene: () => {
                    return page1Scene;
                  },
                }),
              ],
              drilldowns: [
                {
                  routePath: '/main/drilldown/:id',
                  getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                    return new SceneAppPage({
                      title: `Drilldown ${match.params.id}`,
                      url: `/main/drilldown/${match.params.id}`,
                      getScene: () => getDrilldownScene(match),
                      getParentPage: () => parent,
                    });
                  },
                },
              ],
            }),
          ],
        });

        beforeEach(() => renderAppInsideRouterWithStartingUrl(history, app, '/main/drilldown/10'));

        it('should render a drilldown page', async () => {
          expect(await screen.findByText('10 drilldown!')).toBeInTheDocument();
          expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

          // Verify pageNav is correct
          expect(flattenPageNav(pluginPageProps?.pageNav!)).toEqual(['Drilldown 10', 'Top level page']);
        });
      });
    });

    describe('Drilldowns on tab level', () => {
      const p1Object = new SceneCanvasText({ text: 'Page 1' });
      const t1Object = new SceneCanvasText({ text: 'Tab 1' });
      const tab1Scene = setupScene(t1Object);
      let drillDownScenesGenerated = 0;

      const app = new SceneApp({
        pages: [
          // Page with tabs
          new SceneAppPage({
            title: 'Container page',
            url: '/test',
            tabs: [
              new SceneAppPage({
                title: 'Tab ',
                url: '/test/tab',
                getScene: () => {
                  return tab1Scene;
                },
                drilldowns: [
                  {
                    routePath: '/test/tab/:id',
                    getPage: (match: SceneRouteMatch<{ id: string }>) => {
                      drillDownScenesGenerated++;

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

      beforeEach(() => renderAppInsideRouterWithStartingUrl(history, app, '/test/tab'));

      it('should render a drilldown that is part of tab page', async () => {
        expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();

        history.push('/test/tab/some-id');

        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

        history.push('/test/tab/some-other-id');

        expect(await screen.findByText('some-other-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
        expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();

        // go back to the first drilldown
        history.push('/test/tab/some-id');
        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();

        // Verify that drilldown page was cached (getPage should not have been called again)
        expect(drillDownScenesGenerated).toBe(2);
      });

      it('When url does not match any drilldown sub page show fallback route', async () => {
        history.push('/test/tab/drilldown-id/does-not-exist');
        expect(await screen.findByTestId('default-fallback-content')).toBeInTheDocument();
      });
    });

    describe('Custom fallback page', () => {
      const page1Obj = new SceneCanvasText({ text: 'Page 1' });
      const page1Scene = setupScene(page1Obj);
      const app = new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Test',
            url: '/test',
            getScene: () => {
              return page1Scene;
            },
            getFallbackPage: () => {
              return new SceneAppPage({
                title: 'Loading',
                url: '',
                getScene: () =>
                  new EmbeddedScene({
                    body: new SceneReactObject({
                      component: () => <div data-testid="custom-fallback-content">Loading...</div>,
                    }),
                  }),
              });
            },
          }),
        ],
      });

      it('should render custom fallback page if url does not match', async () => {
        renderAppInsideRouterWithStartingUrl(history, app, '/test');
        expect(await screen.findByTestId(page1Obj.state.key!)).toBeInTheDocument();
        history.push('/test/does-not-exist');
        expect(await screen.findByTestId('custom-fallback-content')).toBeInTheDocument();
      });
    });
  });

  it('useSceneApp should cache instance', () => {
    const getSceneApp1 = () =>
      new SceneApp({
        pages: [],
      });

    const getSceneApp2 = () =>
      new SceneApp({
        pages: [],
      });

    const app1 = useSceneApp(getSceneApp1);
    const app2 = useSceneApp(getSceneApp2);

    expect(app1).toBe(useSceneApp(getSceneApp1));
    expect(app2).toBe(useSceneApp(getSceneApp2));
  });
});

function setupScene(inspectableObject: SceneObject, key?: string) {
  return new EmbeddedScene({
    key,
    body: new SceneFlexLayout({
      children: [new SceneFlexItem({ body: inspectableObject })],
    }),
  });
}

function getDrilldownScene(match: SceneRouteMatch<{ id: string }>) {
  return setupScene(
    new SceneCanvasText({ text: `${match.params.id} drilldown!` }),
    `drilldown-scene-${match.params.id}`
  );
}

function flattenPageNav(pageNav: NavModelItem | undefined) {
  const items: string[] = [];

  while (pageNav) {
    items.push(pageNav.text);
    pageNav = pageNav.parentItem;
  }

  return items;
}

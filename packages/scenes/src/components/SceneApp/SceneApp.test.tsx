import { NavModelItem } from '@grafana/data';
import { locationService, PluginPage, PluginPageProps } from '@grafana/runtime';
import { screen, render } from '@testing-library/react';
import React from 'react';
import { renderAppInsideRouterWithStartingUrl } from '../../../utils/test/renderAppInsideRoutingWithStartingUrl';
import { SceneObject } from '../../core/types';
import { EmbeddedScene } from '../EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../layout/SceneFlexLayout';
import { SceneCanvasText } from '../SceneCanvasText';
import { SceneApp, useSceneApp } from './SceneApp';
import { SceneAppPage } from './SceneAppPage';
import { SceneRouteMatch } from './types';
import { SceneReactObject } from '../SceneReactObject';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  PluginPage: jest.fn().mockImplementation((props: PluginPageProps) => {
    return <div>{props.children}</div>;
  }),
}));
jest.mock('../../utils/utils', () => ({
  ...jest.requireActual('../../utils/utils'),
  useLocationServiceSafe: () => locationService,
}));

describe('SceneApp', () => {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn(); // Prevent "You rendered descendant <Routes> (or called `useRoutes()`) at "/test/" (under <Route path="">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render."
    jest.mocked(PluginPage).mockClear();
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  it('should error when rendered outside of a router context', () => {
    const page1Scene = setupScene(new SceneCanvasText({ text: 'Page 1' }));
    const app = new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Test',
          url: '/test',
          routePath: 'test/*',
          getScene: () => {
            return page1Scene;
          },
        }),
      ],
    });

    expect(() => render(<app.Component model={app} />)).toThrowErrorMatchingInlineSnapshot(
      `"useRoutes() may be used only in the context of a <Router> component."`
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
          routePath: 'test/*',
          getScene: () => {
            return page1Scene;
          },
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          routePath: 'test1/*',
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
      locationService.push('/test1');

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
          routePath: 'test/*',
          tabs: [
            new SceneAppPage({
              title: 'Tab1',
              titleIcon: 'grafana',
              tabSuffix: () => <strong>tab1 suffix</strong>,
              url: '/test/tab1',
              routePath: 'tab1/*',
              getScene: () => setupScene(t1Object, 'tab1-scene'),
            }),
            new SceneAppPage({
              title: 'Tab2',
              url: '/test/tab2',
              routePath: 'tab2/*',
              getScene: () => setupScene(t2Object, 'tab2-scene'),
            }),
          ],
        }),
        new SceneAppPage({
          title: 'Test',
          url: '/test1',
          routePath: 'test1/*',
          getScene: () => setupScene(p2Object),
        }),
      ],
    });

    beforeEach(() => {
      renderAppInsideRouterWithStartingUrl(app, '/test');
    });

    it('should render correct breadcrumbs', async () => {
      expect(flattenPageNav(jest.mocked(PluginPage).mock.calls[0][0].pageNav!)).toEqual(['Container page']);
    });

    it('Inner embedded scene should be active and connected to containerPage', async () => {
      expect((window as any).__grafanaSceneContext.state.key).toBe('tab1-scene');
      expect((window as any).__grafanaSceneContext.parent.state.title).toBe('Container page');
    });

    it('should render tab title with icon and suffix', async () => {
      const pageNav = jest.mocked(PluginPage).mock.calls[0][0].pageNav!;

      expect(pageNav?.children?.[0].icon).toEqual('grafana');
      expect(pageNav?.children?.[0].icon).toEqual('grafana');
      const suffix = pageNav?.children?.[0].tabSuffix;
      expect((suffix as any)()).toEqual(<strong>tab1 suffix</strong>);
    });

    it('Render first tab with the url of the parent', () => {
      expect(screen.queryByTestId(p2Object.state.key!)).not.toBeInTheDocument();
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
      expect(screen.queryByTestId(t2Object.state.key!)).not.toBeInTheDocument();
    });

    it('Render first tab with its own url', async () => {
      locationService.push('/test/tab1');
      expect(screen.queryByTestId(t1Object.state.key!)).toBeInTheDocument();
    });

    it('Can render second tab', async () => {
      locationService.push('/test/tab2');

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
            routePath: 'test-drilldown/*',
            getScene: () => {
              return page1Scene;
            },
            drilldowns: [
              {
                routePath: ':id/*',
                getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                  return new SceneAppPage({
                    key: 'drilldown-page',
                    title: `Drilldown ${match.params.id}`,
                    url: `/test-drilldown/${match.params.id}`,
                    routePath: '/:id/*',
                    getScene: () => getDrilldownScene(match),
                    getParentPage: () => parent,
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

        locationService.push('/test-drilldown/some-id');

        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

        // Verify embedded scene is activated and is connected to it's parent page
        expect((window as any).__grafanaSceneContext.state.key).toBe('drilldown-scene-some-id');
        expect((window as any).__grafanaSceneContext.parent.state.key).toBe('drilldown-page');

        // Verify pageNav is correct
        expect(flattenPageNav(jest.mocked(PluginPage).mock.calls[1][0].pageNav!)).toEqual([
          'Drilldown some-id',
          'Top level page',
        ]);

        locationService.push('/test-drilldown/some-other-id');

        expect(await screen.findByText('some-other-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
        expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();

        // Verify data enricher is forwarded to SceneApp
        const page = (window as any).__grafanaSceneContext.parent as SceneAppPage;
        expect(page.enrichDataRequest(page)).toEqual({ app: 'cool-app-123' });
      });

      it('When url does not match any drilldown sub page show fallback route', async () => {
        locationService.push('/test-drilldown/some-id/does-not-exist');
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
              routePath: 'main/*',
              tabs: [
                new SceneAppPage({
                  title: 'Tab ',
                  url: '/main/tab',
                  routePath: 'tab/*',
                  getScene: () => {
                    return page1Scene;
                  },
                }),
              ],
              drilldowns: [
                {
                  routePath: 'drilldown/:id/*',
                  getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                    return new SceneAppPage({
                      title: `Drilldown ${match.params.id}`,
                      url: `/main/drilldown/${match.params.id}`,
                      routePath: 'drilldown/:id/*',
                      getScene: () => getDrilldownScene(match),
                      getParentPage: () => parent,
                    });
                  },
                },
              ],
            }),
          ],
        });

        beforeEach(() => renderAppInsideRouterWithStartingUrl(app, '/main/drilldown/10'));

        it('should render a drilldown page', async () => {
          expect(await screen.findByText('10 drilldown!')).toBeInTheDocument();
          expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

          // Verify pageNav is correct
          expect(flattenPageNav(jest.mocked(PluginPage).mock.calls[1][0].pageNav!)).toEqual([
            'Drilldown 10',
            'Top level page',
          ]);
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
            routePath: 'test/*',
            tabs: [
              new SceneAppPage({
                title: 'Tab ',
                url: '/test/tab',
                routePath: 'tab/*',
                getScene: () => {
                  return tab1Scene;
                },
                drilldowns: [
                  {
                    routePath: 'tab/:id/*',
                    getPage: (match: SceneRouteMatch<{ id: string }>) => {
                      drillDownScenesGenerated++;

                      return new SceneAppPage({
                        title: 'drilldown',
                        url: `/test/tab/${match.params.id}`,
                        routePath: 'tab/:id/*',
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

        locationService.push('/test/tab/some-id');

        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();

        locationService.push('/test/tab/some-other-id');

        expect(await screen.findByText('some-other-id drilldown!')).toBeInTheDocument();
        expect(screen.queryByTestId(p1Object.state.key!)).not.toBeInTheDocument();
        expect(screen.queryByText('some-id drilldown!')).not.toBeInTheDocument();

        // go back to the first drilldown
        locationService.push('/test/tab/some-id');
        expect(await screen.findByText('some-id drilldown!')).toBeInTheDocument();

        // Verify that drilldown page was cached (getPage should not have been called again)
        expect(drillDownScenesGenerated).toBe(2);
      });

      it('When url does not match any drilldown sub page show fallback route', async () => {
        locationService.push('/test/tab/drilldown-id/does-not-exist');
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
            routePath: 'test/*',
            getScene: () => {
              return page1Scene;
            },
            getFallbackPage: () => {
              return new SceneAppPage({
                title: 'Loading',
                url: '',
                routePath: '*',
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
        renderAppInsideRouterWithStartingUrl(app, '/test');
        expect(await screen.findByTestId(page1Obj.state.key!)).toBeInTheDocument();

        locationService.push('/test/does-not-exist');

        expect(await screen.findByTestId('custom-fallback-content')).toBeInTheDocument();
      });
    });

    describe('Custom fallback page that loops on itself', () => {
      const page: SceneAppPage = new SceneAppPage({
        title: 'Test',
        url: '/test',
        routePath: 'test/*',
        getScene: () => {
          return new EmbeddedScene({
            body: new SceneReactObject({
              component: () => <div data-testid="custom-fallback-content">Loading...</div>,
            }),
          });
        },
        getFallbackPage: () => page,
      });
      const app = new SceneApp({
        pages: [page],
      });

      it('should render custom loopback fallback page if url does not match', async () => {
        renderAppInsideRouterWithStartingUrl(app, '/test/does-not-exist');
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

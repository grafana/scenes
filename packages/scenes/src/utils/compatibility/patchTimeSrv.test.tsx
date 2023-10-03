import React from 'react';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneAppPage } from '../../components/SceneApp/SceneAppPage';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneApp } from '../../components/SceneApp/SceneApp';
import { createMemoryHistory } from 'history';
import { screen } from '@testing-library/react';
import { SceneRouteMatch } from '../../components/SceneApp/types';
import { renderAppInsideRouterWithStartingUrl } from '../../../utils/test/utils';

let history = createMemoryHistory();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
}));

describe('patchTimeSrv', () => {
  beforeEach(() => {
    delete (window as any).__timeRangeSceneObject;
  });

  test('standalone EmbeddedScene', () => {
    const timeRange = new SceneTimeRange({
      key: 'embeddedScene-tr',
    });

    const scene = new EmbeddedScene({
      $timeRange: timeRange,
      body: new SceneCanvasText({ text: 'Hello World' }),
    });

    const deactivate = scene.activate();

    expect((window as any).__timeRangeSceneObject.state.key).toBe('embeddedScene-tr');

    deactivate();
    expect((window as any).__timeRangeSceneObject).toBeUndefined();
  });

  describe('SceneApp', () => {
    test('SceneAppPage with time range', () => {
      const timeRange = new SceneTimeRange({
        key: 'app-tr',
      });

      const scene = new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Page',
            url: '/page',
            $timeRange: timeRange,
            getScene: () =>
              new EmbeddedScene({
                body: new SceneCanvasText({ text: 'Hello World' }),
              }),
          }),
        ],
      });

      renderAppInsideRouterWithStartingUrl(history, scene, '/page');

      expect((window as any).__timeRangeSceneObject.state.key).toBe('app-tr');
    });

    test('SceneAppPage with time range on EmbeddedScene', () => {
      const timeRange = new SceneTimeRange({
        key: 'app-tr',
      });

      const pageTimeRange = new SceneTimeRange({
        key: 'page-tr',
      });

      const scene = new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Page',
            url: '/page',
            $timeRange: timeRange,
            getScene: () =>
              new EmbeddedScene({
                $timeRange: pageTimeRange,
                body: new SceneCanvasText({ text: 'Hello World' }),
              }),
          }),
        ],
      });

      renderAppInsideRouterWithStartingUrl(history, scene, '/page');

      expect((window as any).__timeRangeSceneObject.state.key).toBe('page-tr');
    });

    test('Navigating between pages', async () => {
      const timeRange1 = new SceneTimeRange({
        key: 'page1-tr',
      });

      const timeRange2 = new SceneTimeRange({
        key: 'page2-tr',
      });

      const scene = new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Page',
            url: '/page1',
            $timeRange: timeRange1,
            getScene: () =>
              new EmbeddedScene({
                body: new SceneCanvasText({ text: 'Hello World1' }),
              }),
          }),
          new SceneAppPage({
            title: 'Page',
            url: '/page2',
            $timeRange: timeRange2,
            getScene: () =>
              new EmbeddedScene({
                body: new SceneCanvasText({ text: 'Hello World2' }),
              }),
          }),
        ],
      });

      renderAppInsideRouterWithStartingUrl(history, scene, '/page1');

      history.push('/page2');
      expect(await screen.findByText('Hello World2')).toBeInTheDocument();

      expect((window as any).__timeRangeSceneObject.state.key).toBe('page2-tr');
    });

    test('Tabs support', async () => {
      const sharedTimeRange = new SceneTimeRange({
        key: 'shared-tr',
      });

      const tab2TimeRange = new SceneTimeRange({
        key: 'tab2-tr',
      });

      const scene = new SceneApp({
        pages: [
          // Page with tabs
          new SceneAppPage({
            key: 'container',
            title: 'Container page',
            url: '/test',
            $timeRange: sharedTimeRange,
            tabs: [
              new SceneAppPage({
                key: 'tab1',
                title: 'Tab1',
                titleIcon: 'grafana',
                tabSuffix: () => <strong>tab1 suffix</strong>,
                url: '/test/tab1',
                getScene: () =>
                  new EmbeddedScene({
                    body: new SceneCanvasText({ text: 'Hello World1' }),
                  }),
              }),
              new SceneAppPage({
                key: 'tab2',
                title: 'Tab2',
                url: '/test/tab2',
                getScene: () =>
                  new EmbeddedScene({
                    $timeRange: tab2TimeRange,
                    body: new SceneCanvasText({ text: 'Hello World2' }),
                  }),
              }),
            ],
          }),
        ],
      });

      renderAppInsideRouterWithStartingUrl(history, scene, '/test');
      expect(await screen.findByText('Hello World1')).toBeInTheDocument();
      expect((window as any).__timeRangeSceneObject.state.key).toBe('shared-tr');

      history.push('/test/tab2');
      expect(await screen.findByText('Hello World2')).toBeInTheDocument();
      expect((window as any).__timeRangeSceneObject.state.key).toBe('tab2-tr');
    });

    test('Drilldown support', async () => {
      const sharedTimeRange = new SceneTimeRange({
        key: 'shared-tr',
      });

      const drilldown1TimeRange = new SceneTimeRange({
        key: 'drilldown1-tr',
      });
      const drilldown2TimeRange = new SceneTimeRange({
        key: 'drilldown2-tr',
      });

      const app = new SceneApp({
        key: 'app',
        pages: [
          // Page with tabs
          new SceneAppPage({
            key: 'top-level-page',
            title: 'Top level page',
            url: '/test-drilldown',
            $timeRange: sharedTimeRange,
            getScene: () =>
              new EmbeddedScene({
                body: new SceneCanvasText({ text: 'Hello World1' }),
              }),
            drilldowns: [
              {
                routePath: '/test-drilldown/:id',
                getPage: (match: SceneRouteMatch<{ id: string }>, parent) => {
                  return new SceneAppPage({
                    key: 'drilldown-page',
                    title: `Drilldown ${match.params.id}`,
                    url: `/test-drilldown/${match.params.id}`,
                    $timeRange: drilldown1TimeRange,
                    getScene: () =>
                      new EmbeddedScene({
                        body: new SceneCanvasText({ text: 'Hello World2' }),
                      }),
                    drilldowns: [
                      {
                        routePath: `/test-drilldown/${match.params.id}/:id`,
                        getPage: (innerMatch: SceneRouteMatch<{ id: string }>, parent) => {
                          return new SceneAppPage({
                            key: 'drilldown-page',
                            title: `Drilldown ${match.params.id}`,
                            url: `/test-drilldown/${match.params.id}/${innerMatch.params.id}`,
                            getScene: () =>
                              new EmbeddedScene({
                                $timeRange: drilldown2TimeRange,
                                controls: [],
                                body: new SceneCanvasText({ text: 'Hello World3' }),
                              }),
                            getParentPage: () => parent,
                          });
                        },
                      },
                    ],
                    getParentPage: () => parent,
                  });
                },
              },
            ],
          }),
        ],
      });

      renderAppInsideRouterWithStartingUrl(history, app, '/test-drilldown');

      expect(await screen.findByText('Hello World1')).toBeInTheDocument();
      expect((window as any).__timeRangeSceneObject.state.key).toBe('shared-tr');

      history.push('/test-drilldown/some-id');
      expect(await screen.findByText('Hello World2')).toBeInTheDocument();
      expect((window as any).__timeRangeSceneObject.state.key).toBe('drilldown1-tr');

      history.push('/test-drilldown/some-id/some-inner-id');
      expect(await screen.findByText('Hello World3')).toBeInTheDocument();
      expect((window as any).__timeRangeSceneObject.state.key).toBe('drilldown2-tr');
    });
  });
});

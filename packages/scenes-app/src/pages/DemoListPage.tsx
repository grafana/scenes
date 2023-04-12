import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexLayout,
  SceneFlexItem,
  SceneReactObject,
} from '@grafana/scenes';
import { Stack } from '@grafana/experimental';
import React, { useMemo } from 'react';
import { demoUrl, prefixRoute } from '../utils/utils.routing';
import { DATASOURCE_REF, ROUTES } from '../constants';
import { DemoDescriptor, getDemos } from '../demos';
import { Alert, Card } from '@grafana/ui';
import { config } from '@grafana/runtime';

const getScene = () => {
  const demos = getDemos();

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Demos',
        key: 'SceneAppPage Demos',
        hideFromBreadcrumbs: true,
        url: prefixRoute(ROUTES.Demos),
        getScene: () => {
          return new EmbeddedScene({
            key: 'Demos EmbeddedScene',
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  flexGrow: 1,
                  body: new SceneReactObject({
                    component: () => <DemosList demos={demos} />,
                  }),
                }),
              ],
            }),
          });
        },
        drilldowns: [
          {
            routePath: `${demoUrl(':demo')}`,
            getPage: (routeMatch, parent) => {
              const demoSlug = decodeURIComponent(routeMatch.params.demo);
              const demoInfo = demos.find((x) => slugify(x.title) === demoSlug);

              if (!demoInfo) {
                return getDemoNotFoundPage(routeMatch.url);
              }

              return demoInfo.getPage({
                title: demoInfo.title,
                url: `${demoUrl(slugify(demoInfo.title))}`,
                getParentPage: () => parent,
              });
            },
          },
        ],
      }),
    ],
  });
};

export const DemoListPage = () => {
  const scene = useMemo(() => getScene(), []);
  return <scene.Component model={scene} />;
};

function DemosList({ demos }: { demos: DemoDescriptor[] }) {
  if (!config.featureToggles.topnav) {
    return (
      <Alert title="Missing topnav feature toggle">
        Scenes are designed to work with the new navigation wrapper that will be standard in grafana 10
      </Alert>
    );
  }

  if (!config.datasources[DATASOURCE_REF.uid]) {
    return (
      <Alert title={`Missing ${DATASOURCE_REF.uid} datasource`}>
        These demos depend on <b>testdata</b> datasource: <code>{JSON.stringify(DATASOURCE_REF)}</code>. See{' '}
        <a href="https://github.com/grafana/grafana/tree/main/devenv#set-up-your-development-environment">
          https://github.com/grafana/grafana/tree/main/devenv#set-up-your-development-environment
        </a>{' '}
        for more details.
      </Alert>
    );
  }

  return (
    <Stack direction="column" gap={1} flexGrow={1}>
      <Stack direction="column" gap={0}>
        {demos.map((demo) => (
          <Card key={demo.title} href={demoUrl(slugify(demo.title))}>
            <Card.Heading>{demo.title}</Card.Heading>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

function slugify(title: string) {
  const simplified = title
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '');

  return encodeURIComponent(simplified);
}

export function getDemoNotFoundPage(url: string): SceneAppPage {
  return new SceneAppPage({
    title: 'Demo not found',
    subTitle: 'So sorry sir but the demo cannot be found.',
    url: url,
    getScene: () => {
      return new EmbeddedScene({
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              flexGrow: 1,
              body: new SceneReactObject({
                component: () => {
                  return <div style={{ fontSize: 50 }}>😭</div>;
                },
              }),
            }),
          ],
        }),
      });
    },
  });
}

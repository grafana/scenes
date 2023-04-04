import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexLayout,
  SceneFlexItem,
  SceneReactObject,
  SceneAppPageLike,
} from '@grafana/scenes';
import { Stack } from '@grafana/experimental';
import React, { useMemo } from 'react';
import { prefixRoute } from '../utils/utils.routing';
import { DATASOURCE_REF, ROUTES } from '../constants';
import { getDemos } from '../demos';
import { Alert, Card } from '@grafana/ui';
import { config } from '@grafana/runtime';

const getScene = () => {
  const demos = getDemos();

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Scene demos',
        url: prefixRoute(ROUTES.Demos),
        getScene: () => {
          return new EmbeddedScene({
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
        drilldowns: demos.map((demo) => ({
          routePath: demo.state.url,
          getPage: (routeMatch, parent: SceneAppPageLike) => {
            demo.setState({ getParentPage: () => parent });

            return demo;
          },
        })),
      }),
    ],
  });
};

export const DemoListPage = () => {
  const scene = useMemo(() => getScene(), []);
  return <scene.Component model={scene} />;
};

function DemosList({ demos }: { demos: SceneAppPage[] }) {
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
          <Card key={demo.state.title} href={demo.state.url}>
            <Card.Heading>{demo.state.title}</Card.Heading>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

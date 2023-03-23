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
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { getDemoByTitle, getDemos } from './getDemos';
import { Card } from '@grafana/ui';

const getScene = () => {
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
                  child: new SceneReactObject({
                    component: () => <DemosList />,
                  }),
                }),
              ],
            }),
          });
        },
        drilldowns: [
          {
            routePath: `${prefixRoute(ROUTES.Demos)}/:id`,
            getPage: (match, parent) => {
              const id = match.params.id;
              return new SceneAppPage({
                title: id,
                url: `${prefixRoute(ROUTES.Demos)}/${id}`,
                getScene: () => getDemoByTitle(id),
              });
            },
          },
        ],
      }),
    ],
  });
};

export const DemoPage = () => {
  const scene = useMemo(() => getScene(), []);
  return <scene.Component model={scene} />;
};

function DemosList() {
  const demos = getDemos();
  return (
    <Stack direction="column" gap={1} flexGrow={1}>
      <Stack direction="column" gap={0}>
        {demos.map((demo) => (
          <Card key={demo.title} href={`${prefixRoute(ROUTES.Demos)}/${demo.title}`}>
            <Card.Heading>{demo.title}</Card.Heading>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

import React from 'react';
import { DATASOURCE_REF } from '../../constants';
import {
  EmbeddedScene,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';
import { Counter } from '@grafana/ui';
import { getHumidityOverviewScene, getRoomDrilldownScene } from './scenes';
import { getRoomsTemperatureStats, getRoomsTemperatureTable } from './panels';
import { getEmbeddedSceneDefaults } from '../utils';

const roomsTemperatureQuery = {
  refId: 'Rooms temperature',
  datasource: DATASOURCE_REF,
  scenarioId: 'random_walk',
  seriesCount: 8,
  alias: '__house_locations',
  min: 10,
  max: 27,
};

const getScene = () =>
  new EmbeddedScene({
    ...getEmbeddedSceneDefaults(),
    $data: new SceneQueryRunner({
      datasource: DATASOURCE_REF,
      queries: [roomsTemperatureQuery],
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 300,
          body: getRoomsTemperatureTable(),
        }),
        new SceneFlexItem({
          ySizing: 'fill',
          body: getRoomsTemperatureStats(),
        }),
      ],
    }),
  });

export function getDrilldownsAppPageScene(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene,
    drilldowns: [
      {
        routePath: `room/:roomName/*`,
        getPage(routeMatch, parent) {
          const roomName = routeMatch.params.roomName;

          return new SceneAppPage({
            url: `${defaults.url}/room/${roomName}/temperature`,
            routePath: `room/:roomName/*`,
            title: `${roomName}`,
            subTitle: 'This scene is a particular room drilldown. It implements two tabs to organise the data.',
            getParentPage: () => parent,
            tabs: [
              new SceneAppPage({
                title: 'Temperature',
                titleIcon: 'dashboard',
                routePath: 'temperature',
                tabSuffix: () => <Counter value={1} />,
                url: `${defaults.url}/room/${roomName}/temperature`,
                getScene: () => getRoomDrilldownScene(roomName),
              }),
              new SceneAppPage({
                title: 'Humidity',
                titleIcon: 'chart-line',
                routePath: 'humidity',
                url: `${defaults.url}/room/${roomName}/humidity`,
                getScene: () => getHumidityOverviewScene(roomName),
              }),
            ],
          });
        },
      },
    ],
  });
}

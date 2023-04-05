import { demoUrl } from '../../utils/utils.routing';
import { DATASOURCE_REF } from '../../constants';
import { EmbeddedScene, SceneAppPage, SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { getHumidityOverviewScene, getTemperatureOverviewScene } from './scenes';
import { getRoomsTemperatureStats, getRoomsTemperatureTable } from './panels';

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

export function getDrilldownsAppPageScene() {
  return new SceneAppPage({
    title: 'Page with drilldown',
    subTitle: 'This scene showcases a basic drilldown functionality. Interact with room to see room details scene.',
    url: demoUrl('with-drilldown'),
    hideFromBreadcrumbs: true,
    getScene,
    drilldowns: [
      {
        routePath: `${demoUrl('with-drilldown')}/room/:roomName`,
        getPage(routeMatch, parent) {
          const roomName = routeMatch.params.roomName;

          return new SceneAppPage({
            url: `${demoUrl('with-drilldown')}/room/${roomName}/temperature`,
            title: `${roomName} overview`,
            subTitle: 'This scene is a particular room drilldown. It implements two tabs to organise the data.',
            getParentPage: () => parent,
            getScene: () => {
              return new EmbeddedScene({ body: new SceneFlexLayout({ children: [] }) });
            },
            tabs: [
              new SceneAppPage({
                title: 'Temperature',
                url: `${demoUrl('with-drilldown')}/room/${roomName}/temperature`,
                getScene: () => getTemperatureOverviewScene(roomName),
              }),
              new SceneAppPage({
                title: 'Humidity',
                url: `${demoUrl('with-drilldown')}/room/${roomName}/humidity`,
                getScene: () => getHumidityOverviewScene(roomName),
              }),
            ],
          });
        },
      },
    ],
  });
}

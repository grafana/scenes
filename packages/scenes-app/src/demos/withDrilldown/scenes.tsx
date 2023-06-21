import { ReducerID } from '@grafana/data';
import { EmbeddedScene, SceneFlexLayout, SceneQueryRunner, SceneFlexItem, PanelBuilders } from '@grafana/scenes';
import { DATASOURCE_REF } from '../../constants';
import { getEmbeddedSceneDefaults } from '../utils';
import { getRoomTemperatureStatPanel } from './panels';

export function getRoomDrilldownScene(roomName: string) {
  return new EmbeddedScene({
    $data: new SceneQueryRunner({
      datasource: DATASOURCE_REF,
      queries: [getRoomTemperatureQuery(roomName)],
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 500,
          body: PanelBuilders.timeseries().setTitle('Temperature over time').setUnit('celsius').build(),
        }),
        new SceneFlexItem({
          body: new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneFlexItem({
                body: getRoomTemperatureStatPanel([ReducerID.min]),
              }),
              new SceneFlexItem({
                body: getRoomTemperatureStatPanel([ReducerID.max]),
              }),
              new SceneFlexItem({
                body: getRoomTemperatureStatPanel([ReducerID.mean]),
              }),
            ],
          }),
        }),
      ],
    }),
    ...getEmbeddedSceneDefaults(),
  });
}

export function getHumidityOverviewScene(roomName: string) {
  return new EmbeddedScene({
    $data: new SceneQueryRunner({
      datasource: DATASOURCE_REF,
      queries: [getRoomHumidityQuery(roomName)],
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          height: 500,
          body: PanelBuilders.timeseries().setTitle('Humidity over time').setUnit('humidity').build(),
        }),
      ],
    }),
    ...getEmbeddedSceneDefaults(),
  });
}

export function getRoomTemperatureQuery(roomName: string) {
  return {
    refId: 'Temp',
    datasource: DATASOURCE_REF,
    scenarioId: 'random_walk',
    seriesCount: 1,
    alias: roomName,
    min: 10,
    max: 30,
  };
}

function getRoomHumidityQuery(roomName: string) {
  return {
    refId: 'Humidity',
    datasource: DATASOURCE_REF,
    scenarioId: 'random_walk',
    seriesCount: 1,
    alias: roomName,
    min: 30,
    max: 60,
  };
}

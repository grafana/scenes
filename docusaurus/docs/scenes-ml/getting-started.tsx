import { EmbeddedScene, SceneFlexLayout, SceneFlexItem, SceneQueryRunner, PanelBuilders, sceneUtils } from '@grafana/scenes';
import { SceneBaseliner, MLDemoDS } from '@grafana/scenes-ml';

// Register the demo datasource from `scenes-ml`.
// This isn't required for normal usage, it just gives us some sensible demo data.
sceneUtils.registerRuntimeDataSource({ dataSource: new MLDemoDS('ml-test', 'ml-test') })

function getForecastQueryRunner() {
  return new SceneQueryRunner({
    queries: [
      { refId: 'A', datasource: { uid: 'ml-test', type: 'ml-test', }, type: 'forecasts' },
    ],
  });
}

export function getScene() {
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '50%',
          height: 300,
          body: PanelBuilders.timeseries()
            .setTitle('Forecast demo')
            .setData(getForecastQueryRunner())
            // Add the `SceneBaseliner` to the panel.
            .setHeaderActions([new SceneBaseliner({ interval: 0.95 })])
            .build()
        }),
      ],
    }),
  });
}


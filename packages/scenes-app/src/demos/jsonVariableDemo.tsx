import {
  EmbeddedScene,
  JsonVariable,
  JsonVariableOptionProviders,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridLayout,
  SceneVariableSet,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';

export function getJsonVariableDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Example of a JSON variable',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new JsonVariable({
              name: 'env',
              value: 'test',
              provider: JsonVariableOptionProviders.fromString({
                json: `[
                  { "id": 1, "name": "dev", "cluster": "us-dev-1", "status": "updating" }, 
                  { "id": 2, "name": "prod", "cluster": "us-prod-2", "status": "ok" },
                  { "id": 3, "name": "staging", "cluster": "us-staging-2", "status": "down" }
                ]`,
              }),
            }),
            new JsonVariable({
              name: 'testRun',
              label: 'Test run',
              value: 'test',
              provider: JsonVariableOptionProviders.fromObjectArray({
                options: [
                  { runId: 'CAM-01', timeTaken: '10s', startTime: 1733492238318, endTime: 1733492338318 },
                  { runId: 'SSL-02', timeTaken: '2s', startTime: 1733472238318, endTime: 1733482338318 },
                  { runId: 'MRA-02', timeTaken: '13s', startTime: 1733462238318, endTime: 1733472338318 },
                ],
                valueProp: 'runId',
              }),
            }),
          ],
        }),
        body: new SceneCSSGridLayout({
          children: [
            PanelBuilders.text()
              .setTitle('Interpolation demos')
              .setOption(
                'content',
                `

              * env.id = \${env.id}
              * env.name = \${env.name}
              * env.status = \${env.status}
              

              * testRun.runId = \${testRun.runId}
              * testRun.timeTaken = \${testRun.timeTaken}
              * testRun.startTime = \${testRun.startTime}
              * testRun.endTime = \${testRun.endTime}
              * testRun.endTime:date = \${testRun.endTime:date}
            `
              )
              .build(),
          ],
        }),
      });
    },
  });
}

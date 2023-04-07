import {
  EmbeddedScene,
  SceneAppPage,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObject,
  SceneQueryRunner,
  SceneTimePicker,
  SceneTimeRange,
  SceneToolbarInput,
  VizPanel,
} from '@grafana/scenes';
import { SceneRadioToggle } from '../../components/SceneRadioToggle';
import { DATASOURCE_REF } from '../../constants';
import { demoUrl } from '../../utils/utils.routing';
import { getQueryRunnerWithRandomWalkQuery, newTimeSeriesPanel } from '../utils';
import { HiddenForTimeRangeBehavior } from './HiddenForTimeRangeBehavior';
import { HiddenWhenNoDataBehavior } from './HiddenWhenNoDataBehavior';
import { ShowBasedOnConditionBehavior } from './ShowBasedOnConditionBehavior';

export function getBehaviorsDemo() {
  return new SceneAppPage({
    title: 'Behaviors',
    subTitle: 'Behaviors can augments any scene object with new runtime behaviors and state logic',
    url: `${demoUrl('behaviors')}`,
    getScene: () => {
      const queryRunner = getQueryRunnerWithRandomWalkQuery({
        seriesCount: 2,
        alias: '__server_names',
        scenarioId: 'random_walk',
      });

      const showHideToggle = new SceneRadioToggle({
        options: [
          { value: 'visible', label: 'Show text panel' },
          { value: 'hidden', label: 'Hide text panel' },
        ],
        value: 'hidden',
      });

      return new EmbeddedScene({
        $timeRange: new SceneTimeRange(),
        controls: [
          new SceneToolbarInput({
            value: '2',
            onChange: (newValue) => {
              queryRunner.setState({
                queries: [
                  {
                    ...queryRunner.state.queries[0],
                    seriesCount: newValue,
                  },
                ],
              });
              queryRunner.runQueries();
            },
          }),
          showHideToggle,
          new SceneControlsSpacer(),
          new SceneTimePicker({ isOnCanvas: true }),
        ],
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              $behaviors: [new ShowBasedOnConditionBehavior({ getCondition: getTextPanelToggle(showHideToggle) })],
              body: new VizPanel({
                pluginId: 'text',
                options: { content: 'This panel can be hidden with a toggle!' },
              }),
            }),
            new SceneFlexItem({
              $behaviors: [new HiddenForTimeRangeBehavior({ greaterThan: 'now-2d' })],
              body: newTimeSeriesPanel(
                {
                  title: 'Hidden for time ranges > 2d',
                  key: 'Hidden for time ranges > 2d',
                  $data: new SceneQueryRunner({
                    key: 'Hidden for time range query runner',
                    $behaviors: [logEventsBehavior],
                    queries: [
                      {
                        refId: 'A',
                        datasource: DATASOURCE_REF,
                        scenarioId: 'random_walk',
                      },
                    ],
                  }),
                  $behaviors: [logEventsBehavior],
                },
                { fillOpacity: 20 }
              ),
            }),
            new SceneFlexItem({
              $behaviors: [new HiddenWhenNoDataBehavior()],
              $data: queryRunner,
              body: newTimeSeriesPanel({ title: 'Hidden when no time series' }),
            }),
          ],
        }),
      });
    },
  });
}

function getTextPanelToggle(toggle: SceneRadioToggle) {
  return () => ({ references: [toggle], condition: () => toggle.state.value === 'visible' });
}

function logEventsBehavior(sceneObject: SceneObject) {
  console.log(`[SceneObjectEvent]: ${sceneObject.constructor?.name} ${sceneObject.state.key} activated!`);

  sceneObject.subscribeToState((state) => {
    console.log(`[SceneObjectEvent]: ${sceneObject.constructor?.name} ${sceneObject.state.key} state changed!`, state);
  });

  return () => {
    console.log(`[SceneObjectEvent]: ${sceneObject.constructor?.name} ${sceneObject.state.key} deactivated!`);
  };
}

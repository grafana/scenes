import {
  CustomVariable,
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  SceneVariable,
  SceneVariableSet,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery } from './utils';

export function getDynamicQueries(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'A way to dynamically change queries in a panels.',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $variables: new SceneVariableSet({
          variables: [
            new CustomVariable({
              name: 'Query',
              query: 'Query A, Query B, Query C',
              value: 'Query A',
              text: '',
              description: 'Server name',
              options: [],
            }),
          ],
        }),
        body: new SceneFlexLayout({
          direction: 'column',
          $data: new SceneQueryRunner({
            datasource: DATASOURCE_REF,
            $behaviors: [new DyanmicQueryBehavior({})],
            queries: [],
          }),
          children: [
            new SceneFlexItem({
              body: PanelBuilders.timeseries().setTitle('Timeseries').build(),
              minHeight: 400,
              minWidth: '40%',
            }),
          ],
        }),
        $data: getQueryRunnerWithRandomWalkQuery(),
      });
    },
  });
}

class DyanmicQueryBehavior extends SceneObjectBase<SceneObjectState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['Query'],
    onReferencedVariableValueChanged: this.onVariableValueChanged.bind(this),
  });

  public onVariableValueChanged(variable: SceneVariable) {
    // you can look up other variables here with sceneGraph.lookupVariable

    const value = variable.getValue();
    const queryRunner = sceneGraph.getAncestor(this, SceneQueryRunner);

    switch (value) {
      case 'Query A':
        queryRunner.setState({
          queries: [
            {
              refId: 'A',
              scenarioId: 'random_walk',
              alias: 'Query A',
            },
          ],
        });
        queryRunner.runQueries();
        break;
      case 'Query B':
        queryRunner.setState({
          queries: [
            {
              refId: 'A',
              scenarioId: 'random_walk',
              alias: 'Query B',
            },
          ],
        });
        queryRunner.runQueries();
        break;
      case 'Query C':
        queryRunner.setState({
          queries: [
            {
              refId: 'A',
              scenarioId: 'random_walk',
              alias: 'Query C',
            },
          ],
        });
        queryRunner.runQueries();
        break;
    }
  }
}

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectState } from '../core/types';
import { DataQueryExtended, SceneQueryRunner } from '../querying/SceneQueryRunner';
import { VariableDependencyConfig } from '../variables/VariableDependencyConfig';
import { VariableValue, SceneVariable } from '../variables/types';

export interface DyanmicQueryBehaviorState extends SceneObjectState {
  variables: string[];
  buildQueries: (behavior: DyanmicQueryBehavior) => DataQueryExtended[];
}

export class DyanmicQueryBehavior extends SceneObjectBase<DyanmicQueryBehaviorState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['Query'],
    onReferencedVariableValueChanged: this.onVariableValueChanged.bind(this),
  });

  private issuedQuery: VariableValue | null | undefined;

  constructor(state: SceneObjectState) {
    super(state);

    this.addActivationHandler(this.onActivate.bind(this));
  }

  public onActivate() {
    if (!this._variableDependency.hasDependencyInLoadingState()) {
      this.onUpdateQueries();
    }
  }

  public onVariableValueChanged(variable: SceneVariable) {
    this.onUpdateQueries();
  }

  public onUpdateQueries() {
    const value = sceneGraph.lookupVariable('Query', this)!.getValue();
    const queryRunner = sceneGraph.getAncestor(this, SceneQueryRunner);

    if (this.issuedQuery === value) {
      return;
    }

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

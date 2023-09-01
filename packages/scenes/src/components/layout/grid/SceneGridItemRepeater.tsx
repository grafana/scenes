import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { VariableDependencyConfig } from '../../../variables/VariableDependencyConfig';
import { SceneVariableSet } from '../../../variables/sets/SceneVariableSet';
import { SceneVariable, VariableValueSingle } from '../../../variables/types';
import { ConstantVariable } from '../../../variables/variants/ConstantVariable';
import { SceneGridItem } from './SceneGridItem';
import { SceneGridLayout } from './SceneGridLayout';
import { GRID_COLUMN_COUNT } from './constants';
import { SceneGridItemStateLike, SceneGridItemLike } from './types';

interface SceneGridItemState extends SceneGridItemStateLike {
  source: SceneGridItem;
  repeats: SceneGridItem[];
  variableName: string;
}
export class SceneGridItemRepeater extends SceneObjectBase<SceneGridItemState> implements SceneGridItemLike {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: [this.state.variableName],
    onVariableUpdatesCompleted: this._onVariableChanged.bind(this),
  });

  private _onVariableChanged(changedVariables: Set<SceneVariable>): void {
    for (const variable of changedVariables) {
      if (this.state.variableName === variable.state.name) {
        this._processRepeat(variable);
      }
    }
  }

  private _processRepeat(variable: SceneVariable) {
    const grid = this.parent;
    if (!(grid instanceof SceneGridLayout)) {
      console.error('SceneGridItemRepeater: Layout of type SceneGridLayout not found');
      return;
    }

    console.log(`SceneGridItemRepeater: _processRepeat ${variable.state.name}`);

    const itemToClone = this.state.source;
    const values = variable.getValue();
    const maxPerRow = 4;
    const repeats: SceneGridItem[] = [];

    // Loop through variable values and create repeates
    if (Array.isArray(values)) {
      for (let i = 0; i < values.length; i++) {
        const item = this.cloneItem(itemToClone, variable.state.name, values[i], i, values.length, maxPerRow);
        repeats.push(item);
      }
    }

    this.setState({ repeats });

    grid.forceRender();
  }

  private cloneItem(
    sourceItem: SceneGridItem,
    variableName: string,
    value: VariableValueSingle,
    index: number,
    valueCount: number,
    maxPerRow: number
  ): SceneGridItem {
    console.log(`RepeatPanelByVariableBehavior. cloneItem setting ${variableName} = ${value}`);

    const x = sourceItem.state.x ?? 0;
    const width = Math.max(GRID_COLUMN_COUNT / valueCount, GRID_COLUMN_COUNT / maxPerRow);

    const clone = sourceItem.clone({
      $variables: new SceneVariableSet({
        variables: [new ConstantVariable({ name: variableName, value: value })],
      }),
      $behaviors: index === 0 ? sourceItem.state.$behaviors : [],
      key: index === 0 ? sourceItem.state.key : `${sourceItem.state.key}-clone-${index}`,
      x: x + width * index,
      width: width,
    });

    //const vizPanel = clone.state.body as VizPanel;
    //const queryRunner = vizPanel.state.$data as SceneQueryRunner;

    return clone;
  }

  public getSceneLayoutChild(key: string): SceneGridItem | null {
    // if (this.state.source.state.key === key) {
    //   return this.state.source;
    // }

    for (const repeat of this.state.repeats) {
      if (repeat.state.key === key) {
        return repeat;
      }
    }

    return null;
  }
}

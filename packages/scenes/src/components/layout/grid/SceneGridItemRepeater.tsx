import React, { CSSProperties } from 'react';
import { SceneObjectBase } from '../../../core/SceneObjectBase';
import { SceneComponentProps, SceneObject } from '../../../core/types';
import { VariableDependencyConfig } from '../../../variables/VariableDependencyConfig';
import { SceneVariableSet } from '../../../variables/sets/SceneVariableSet';
import { SceneVariable, VariableValueSingle } from '../../../variables/types';
import { ConstantVariable } from '../../../variables/variants/ConstantVariable';
import { SceneGridItem } from './SceneGridItem';
import { SceneGridLayout } from './SceneGridLayout';
import { GRID_CELL_HEIGHT, GRID_COLUMN_COUNT } from './constants';
import { SceneGridItemStateLike, SceneGridItemLike } from './types';

interface SceneGridItemRepeaterState extends SceneGridItemStateLike {
  source: SceneObject;
  repeats: SceneObject[];
  variableName: string;
}
export class SceneGridItemRepeater extends SceneObjectBase<SceneGridItemRepeaterState> implements SceneGridItemLike {
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
    const repeats: SceneObject[] = [];

    // Loop through variable values and create repeates
    if (Array.isArray(values)) {
      for (let i = 0; i < values.length; i++) {
        const item = this.cloneItem(itemToClone, variable.state.name, values[i], i, values.length, maxPerRow);
        repeats.push(item);
      }
    }

    this.setState({ repeats, height: this.state.height!, width: 24 });

    grid.forceRender();
  }

  private cloneItem(
    sourceItem: SceneObject,
    variableName: string,
    value: VariableValueSingle,
    index: number,
    valueCount: number,
    maxPerRow: number
  ): SceneObject {
    console.log(`RepeatPanelByVariableBehavior. cloneItem setting ${variableName} = ${value}`);

    const clone = sourceItem.clone({
      $variables: new SceneVariableSet({
        variables: [new ConstantVariable({ name: variableName, value: value })],
      }),
      key: `${sourceItem.state.key}-clone-${index}`,
    });

    //const vizPanel = clone.state.body as VizPanel;
    //const queryRunner = vizPanel.state.$data as SceneQueryRunner;

    return clone;
  }

  public getWrapperStyles(): CSSProperties {
    return {
      display: 'flex',
      width: '100%',
      height: GRID_CELL_HEIGHT * this.state.height!,
      gap: '8px',
    };
  }

  public getChildStyles(): CSSProperties {
    return {
      position: 'relative',
      flexGrow: 1,
    };
  }

  public static Component = ({ model }: SceneComponentProps<SceneGridItemRepeater>) => {
    const { repeats } = model.useState();

    //const children = [...repeats];

    return (
      <div style={model.getWrapperStyles()}>
        {repeats.map((child) => (
          <div style={model.getChildStyles()} key={model.state.key}>
            <child.Component model={child} key={model.state.key} />
          </div>
        ))}
      </div>
    );
  };
}

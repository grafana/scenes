import { SceneObjectUrlSyncHandler, SceneObjectUrlValues } from '../../core/types';
import { AggregationsSet } from './AggregationsSet';

export class AggregationsSetUrlSyncHandler implements SceneObjectUrlSyncHandler {
  public constructor(private _variable: AggregationsSet) {}

  private getKey = (): string => {
    return `var-${this._variable.state.name}`;
  }

  public getKeys = (): string[] => {
    return [this.getKey()];
  }

  public getUrlState = (): SceneObjectUrlValues => {
    const urlValue = this._variable.state.dimensions;
    return { [this.getKey()]: urlValue };
  }

  public updateFromUrl = (values: SceneObjectUrlValues): void => {
    const urlValue = values[this.getKey()];

    if (urlValue != null) {
      this._variable.setState({ dimensions: Array.isArray(urlValue) ? urlValue : [urlValue] });
    }
  }
}

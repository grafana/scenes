import { urlUtil } from '@grafana/data';
import { SceneObject, SceneTimeRangeLike } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { DefaultTimeRange } from '../interpolation/defaults';
import { SkipFormattingValue } from './types';

/**
 * Handles expressions like $__url_time_range.
 */
export class UrlTimeRangeMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _sceneObject: SceneObject;

  public constructor(name: string, sceneObject: SceneObject) {
    this.state = { name: name, type: 'time_macro' };
    this._sceneObject = sceneObject;
  }

  public getValue(): SkipFormattingValue {
    const timeRange = getTimeRange(this._sceneObject);
    const urlState = timeRange.urlSync?.getUrlState();
    return new SkipFormattingValue(urlUtil.toUrlParams(urlState));
  }

  public getValueText?(): string {
    return '';
  }
}

/**
 * Handles expressions like $__from and $__to.
 */
export class TimeFromAndToMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _sceneObject: SceneObject;

  public constructor(name: string, sceneObject: SceneObject) {
    this.state = { name: name, type: 'time_macro' };
    this._sceneObject = sceneObject;
  }

  public getValue() {
    const timeRange = getTimeRange(this._sceneObject);
    if (this.state.name === '__from') {
      return timeRange.state.value.from.valueOf();
    } else {
      return timeRange.state.value.to.valueOf();
    }
  }

  public getValueText?(): string {
    return '';
  }
}

function getTimeRange(sceneObject: SceneObject): SceneTimeRangeLike {
  const { $timeRange } = sceneObject.state;
  if ($timeRange) {
    return $timeRange;
  }

  if (sceneObject.parent) {
    return getTimeRange(sceneObject.parent);
  }

  return DefaultTimeRange;
}

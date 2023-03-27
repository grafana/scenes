import { urlUtil } from '@grafana/data';
import { SceneObject, SceneTimeRangeLike } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { DefaultTimeRange } from '../interpolation/defaults';
import { SkipFormattingValue } from './types';

export class UrlTimeRangeMacro implements FormatVariable {
  public state: { name: string; type: string };
  private _sceneObject: SceneObject;

  public constructor(name: string, sceneObject: SceneObject) {
    this.state = { name: name, type: 'url_variable' };
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

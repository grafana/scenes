import { SceneTimeRange } from '../../core/SceneTimeRange';
import { TestScene } from '../TestScene';

import { sceneInterpolator } from '../interpolation/sceneInterpolator';

describe('timeMacros', () => {
  it('Can use use $__url_time_range', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
    });

    expect(sceneInterpolator(scene, '$__url_time_range')).toBe('from=now-5m&to=now');
  });

  it('Can use use $__from and $__to', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: '2023-05-23T06:09:57.073Z', to: '2023-05-23T07:09:57.073Z' }),
    });

    expect(sceneInterpolator(scene, '$__from')).toBe('1684822197073');
    expect(sceneInterpolator(scene, '$__to')).toBe('1684825797073');

    expect(sceneInterpolator(scene, '${__to:date:YYYY}')).toBe('2023');
  });
});

import { SceneTimeRange } from '../../core/SceneTimeRange';
import { TestScene } from '../TestScene';

import { sceneInterpolator } from '../interpolation/sceneInterpolator';
import { SceneTimeZoneOverride } from '../../core/SceneTimeZoneOverride';
import { SceneDataNode } from '../../core/SceneDataNode';
import { LoadingState } from '@grafana/schema';
import { DataQueryRequest, getDefaultTimeRange } from '@grafana/data';

describe('timeMacros', () => {
  it('Can use use $__url_time_range with browser timeZone', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),
    });

    expect(sceneInterpolator(scene, '$__url_time_range')).toBe(
      `from=now-5m&to=now&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
    );
  });

  it('Can use use $__url_time_range with custom timeZone', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now', timeZone: 'utc' }),
    });

    expect(sceneInterpolator(scene, '$__url_time_range')).toBe('from=now-5m&to=now&timezone=utc');
  });

  it('Can use use $__from and $__to', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({ from: '2023-05-23T06:09:57.073Z', to: '2023-05-23T07:09:57.073Z' }),
    });

    expect(sceneInterpolator(scene, '$__from')).toBe('1684822197073');
    expect(sceneInterpolator(scene, '$__to')).toBe('1684825797073');

    expect(sceneInterpolator(scene, '${__to:date:YYYY}')).toBe('2023');
  });

  it('When default format is text should format correctly', () => {
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-05-23T06:09:57.073Z',
        to: '2023-05-23T07:09:57.073Z',
        timeZone: 'utc',
      }),
    });

    expect(sceneInterpolator(scene, '$__from', undefined, 'text')).toBe('2023-05-23 06:09:57');
    expect(sceneInterpolator(scene, '$__to', undefined, 'text')).toBe('2023-05-23 07:09:57');
  });

  it('Can use use $__timezone', () => {
    const scene1 = new TestScene({
      $timeRange: new SceneTimeRange({ from: '2023-05-23T06:09:57.073Z', to: '2023-05-23T07:09:57.073Z' }),
    });

    const nestedScene = new TestScene({});
    const scene2 = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-05-23T06:09:57.073Z',
        to: '2023-05-23T07:09:57.073Z',
        timeZone: 'America/New_York',
      }),
      nested: new TestScene({
        $timeRange: new SceneTimeZoneOverride({ timeZone: 'Africa/Abidjan' }),
        nested: nestedScene,
      }),
    });

    expect(sceneInterpolator(scene1, '$__timezone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(sceneInterpolator(scene2, '$__timezone')).toBe('America/New_York');
    expect(sceneInterpolator(nestedScene, '$__timezone')).toBe('Africa/Abidjan');
  });

  it('Can use use $__interval when data & request are present', () => {
    const scene1 = new TestScene({
      $data: new SceneDataNode({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [],
          request: {
            intervalMs: 10000,
            interval: '10s',
          } as DataQueryRequest,
        },
      }),
    });

    expect(sceneInterpolator(scene1, '$__interval')).toBe('10s');
    expect(sceneInterpolator(scene1, '$__interval_ms')).toBe('10000');
  });

  it('$__interval and $__interval_ms should return the variable expression when data request not found', () => {
    const scene1 = new TestScene({
      $data: new SceneDataNode({
        data: {
          state: LoadingState.Done,
          timeRange: getDefaultTimeRange(),
          series: [],
        },
      }),
    });

    expect(sceneInterpolator(scene1, '${__interval}')).toBe('${__interval}');
    expect(sceneInterpolator(scene1, '$__interval')).toBe('$__interval');
    expect(sceneInterpolator(scene1, '${__interval_ms}')).toBe('${__interval_ms}');
    expect(sceneInterpolator(scene1, '$__interval_ms')).toBe('$__interval_ms');
  });

  it('Date formatter should respect dashboard timezone when set to UTC', () => {
    // Test with UTC timezone - April 1st 2023, 23:00 UTC
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-04-01T23:00:00.000Z',
        to: '2023-04-01T23:00:00.000Z',
        timeZone: 'utc'
      }),
    });

    // When dashboard is set to UTC, month should be 4 (April) regardless of browser timezone
    expect(sceneInterpolator(scene, '${__to:date:M}')).toBe('4');
    expect(sceneInterpolator(scene, '${__to:date:D}')).toBe('1');
    expect(sceneInterpolator(scene, '${__to:date:YYYY-MM-DD}')).toBe('2023-04-01');
  });

  it('Date formatter should respect dashboard timezone when set to America/New_York', () => {
    // Test with America/New_York timezone - April 1st 2023, 23:00 UTC = April 1st 19:00 EDT (UTC-4)
    const scene = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-04-01T23:00:00.000Z',
        to: '2023-04-01T23:00:00.000Z',
        timeZone: 'America/New_York'
      }),
    });

    // In America/New_York timezone, this should still be April 1st (day 1) but hour should be 19
    expect(sceneInterpolator(scene, '${__to:date:M}')).toBe('4');
    expect(sceneInterpolator(scene, '${__to:date:D}')).toBe('1');
    expect(sceneInterpolator(scene, '${__to:date:HH}')).toBe('19');
  });

  it('Date formatter should handle timezone correctly across month boundaries', () => {
    // Test the specific bug case: March 31st 23:00 UTC
    // In New York (UTC-4), this is still March 31st at 19:00
    // But in Stockholm (UTC+2), this would be April 1st at 01:00
    const utcScene = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-03-31T23:00:00.000Z',
        to: '2023-03-31T23:00:00.000Z',
        timeZone: 'utc'
      }),
    });

    const nycScene = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-03-31T23:00:00.000Z',
        to: '2023-03-31T23:00:00.000Z',
        timeZone: 'America/New_York'
      }),
    });

    const stockholmScene = new TestScene({
      $timeRange: new SceneTimeRange({
        from: '2023-03-31T23:00:00.000Z',
        to: '2023-03-31T23:00:00.000Z',
        timeZone: 'Europe/Stockholm'
      }),
    });

    // UTC: March (month 3)
    expect(sceneInterpolator(utcScene, '${__to:date:M}')).toBe('3');
    expect(sceneInterpolator(utcScene, '${__to:date:D}')).toBe('31');

    // NYC: Still March 31st at 19:00 (UTC-4)
    expect(sceneInterpolator(nycScene, '${__to:date:M}')).toBe('3');
    expect(sceneInterpolator(nycScene, '${__to:date:D}')).toBe('31');

    // Stockholm: April 1st at 01:00 (UTC+2)
    expect(sceneInterpolator(stockholmScene, '${__to:date:M}')).toBe('4');
    expect(sceneInterpolator(stockholmScene, '${__to:date:D}')).toBe('1');
  });
});

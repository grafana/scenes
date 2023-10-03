import { dateTime, toUtc } from '@grafana/data';
import { screen, render } from '@testing-library/react';
import React from 'react';

import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneTimeRangeState } from '../core/types';
import { EmbeddedScene } from './EmbeddedScene';
import { SceneFlexLayout } from './layout/SceneFlexLayout';
import { getZoomedTimeRange, SceneTimePicker, SceneTimePickerState } from './SceneTimePicker';

function setupScene(
  timeRangeProps: Partial<SceneTimeRangeState> = {},
  timePickerProps: Partial<SceneTimePickerState> = {}
) {
  const timeRange = new SceneTimeRange({
    from: timeRangeProps.from,
    to: timeRangeProps.to,
  });
  const timePicker = new SceneTimePicker({
    hidePicker: timePickerProps.hidePicker,
  });

  const scene = new EmbeddedScene({
    $timeRange: timeRange,
    controls: [timePicker],
    body: new SceneFlexLayout({ children: [] }),
  });

  return { scene, timePicker, timeRange };
}

describe('SceneTimePicker', () => {
  it('does not render if hidePicker', () => {
    const { scene } = setupScene(
      {
        from: 'now-12h',
        to: 'now',
      },
      {
        hidePicker: true,
      }
    );

    render(<scene.Component model={scene} />);

    expect(screen.queryByText('Last 12 hours')).not.toBeInTheDocument();
  });

  it('renders', () => {
    const { scene } = setupScene({
      from: 'now-12h',
      to: 'now',
    });

    render(<scene.Component model={scene} />);

    expect(screen.getByText('Last 12 hours')).toBeInTheDocument();
  });

  it('zooms when onZoom is called', () => {
    const { timePicker, timeRange } = setupScene({
      from: 'now-12h',
      to: 'now',
    });
    const t1 = timeRange.state.value;

    timePicker.onZoom();

    const t2 = timeRange.state.value;
    expect(dateTime(t2.from).diff(t1.from, 'h')).toBe(-6);
    expect(dateTime(t2.from).diff(t1.from, 'h')).toBe(-6);
  });
});

it('calculates zoomed time range correctly', () => {
  // 07:48:27 on Dec 17 - 07:48:27 on Dec 18
  const from = dateTime('2023-12-17T07:48:27.433Z');
  const to = dateTime('2023-12-18T07:48:27.433Z');

  const timeRange = {
    from,
    to,
    raw: { from, to },
  };
  // zoom out by 2
  const zoomedTimeRange = getZoomedTimeRange(timeRange, 2);

  // 19:48:27 on Dec 16 - 19:48:27 on Dec 18
  const zoomedFrom = dateTime('2023-12-16T19:48:27.433Z').valueOf();
  const zoomedTo = dateTime('2023-12-18T19:48:27.433Z').valueOf();
  expect(zoomedTimeRange).toEqual({
    from: toUtc(zoomedFrom),
    to: toUtc(zoomedTo),
    raw: {
      from: toUtc(zoomedFrom),
      to: toUtc(zoomedTo),
    },
  });
});

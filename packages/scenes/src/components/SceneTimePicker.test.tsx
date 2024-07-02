import { dateTime, toUtc } from '@grafana/data';
import { screen, render } from '@testing-library/react';
import React from 'react';

import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneTimeRangeState } from '../core/types';
import { EmbeddedScene } from './EmbeddedScene';
import { SceneFlexLayout } from './layout/SceneFlexLayout';
import {
  getShiftedTimeRange,
  getZoomedTimeRange,
  SceneTimePicker,
  SceneTimePickerState,
  TimeRangeDirection,
} from './SceneTimePicker';

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


  it('correctly calculates absolute time range', () => {
    jest.useFakeTimers();
    jest.setSystemTime(1704071943000); //  Monday, January 1, 2024 1:19:03 AM
    const { timePicker, timeRange } = setupScene({
      from: 'now-6h',
      to: 'now',
    });

    timePicker.toAbsolute();
    expect(timeRange.state.from).toBe('2023-12-31T19:19:03.000Z');
    expect(timeRange.state.to).toBe('2024-01-01T01:19:03.000Z');
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

it('calculates backward shift correctly', () => {
  const from = dateTime('2023-12-17T10:00:00.433Z');
  const to = dateTime('2023-12-17T12:00:00.433Z');
  const upperLimit = dateTime('2023-12-17T15:48:27.433Z').valueOf();
  const timeRange = {
    from,
    to,
    raw: { from, to },
  };

  const shiftedRange = getShiftedTimeRange(TimeRangeDirection.Backward, timeRange, upperLimit);
  const expectedFrom = toUtc(dateTime('2023-12-17T09:00:00.433Z').valueOf());
  const expectedTo = toUtc(dateTime('2023-12-17T11:00:00.433Z').valueOf());
  expect(shiftedRange).toEqual({
    from: expectedFrom,
    to: expectedTo,
    raw: { from: expectedFrom, to: expectedTo },
  });
});

it('calculates forward shift correctly', () => {
  const from = dateTime('2023-12-17T10:00:00.433Z');
  const to = dateTime('2023-12-17T12:00:00.433Z');
  const upperLimit = dateTime('2023-12-17T15:48:27.433Z').valueOf();
  const timeRange = {
    from,
    to,
    raw: { from, to },
  };

  const shiftedRange = getShiftedTimeRange(TimeRangeDirection.Forward, timeRange, upperLimit);
  const expectedFrom = toUtc(dateTime('2023-12-17T11:00:00.433Z').valueOf());
  const expectedTo = toUtc(dateTime('2023-12-17T13:00:00.433Z').valueOf());
  expect(shiftedRange).toEqual({
    from: expectedFrom,
    to: expectedTo,
    raw: { from: expectedFrom, to: expectedTo },
  });
});

it('calculates forward shift when moving past upper limit correctly', () => {
  const from = dateTime('2023-12-17T10:00:00.433Z');
  const to = dateTime('2023-12-17T12:00:00.433Z');
  const upperLimit = dateTime('2023-12-17T12:30:00.433Z');
  const timeRange = {
    from,
    to,
    raw: { from, to },
  };

  const shiftedRange = getShiftedTimeRange(TimeRangeDirection.Forward, timeRange, upperLimit.valueOf());
  const expectedFrom = toUtc(from.valueOf());
  const expectedTo = toUtc(upperLimit.valueOf());
  expect(shiftedRange).toEqual({
    from: expectedFrom,
    to: expectedTo,
    raw: { from: expectedFrom, to: expectedTo },
  });
});

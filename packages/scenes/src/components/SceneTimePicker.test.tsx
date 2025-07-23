import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime, toUtc } from '@grafana/data';
import { Components } from '@grafana/e2e-selectors';

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
    quickRanges: timePickerProps.quickRanges,
    defaultQuickRanges: timePickerProps.defaultQuickRanges,
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

  it('should show placeholder if there is no history in local storage', async () => {
    const { scene } = setupScene({
      from: 'now-12h',
      to: 'now',
    });

    render(<scene.Component model={scene} />);
    await userEvent.click(screen.getByTestId(Components.TimePicker.openButton));
    expect(screen.getByText(/it looks like you haven't used this time picker before/i)).toBeInTheDocument();
  });

  it('should add new absolute time range to list', async () => {
    const { scene } = setupScene({
      from: 'now-12h',
      to: 'now',
    });

    render(<scene.Component model={scene} />);
    await userEvent.click(screen.getByTestId(Components.TimePicker.openButton));

    const fromField = screen.getByTestId(Components.TimePicker.fromField);
    await userEvent.clear(fromField);
    await userEvent.type(fromField, '2024-09-04 00:00:00');

    const toField = screen.getByTestId(Components.TimePicker.toField);
    await userEvent.clear(toField);
    await userEvent.type(toField, '2024-09-14 23:59:59');

    const applyButton = screen.getByTestId(Components.TimePicker.applyTimeRange);
    await userEvent.click(applyButton);

    expect(screen.getByText('2024-09-04 00:00:00 to 2024-09-14 23:59:59')).toBeInTheDocument();
  });

  it('renders default quick ranges from server config', async () => {
    const { scene } = setupScene(
      {
        from: 'now-12h',
        to: 'now',
      },
      {
        defaultQuickRanges: [
          {
            display: 'Last 12 minutes',
            from: 'now-12m',
            to: 'now',
          },
        ],
      }
    );

    render(<scene.Component model={scene} />);
    await userEvent.click(screen.getByTestId(Components.TimePicker.openButton));
    expect(screen.getByText('Last 12 minutes')).toBeInTheDocument();
  });

  it('prefers quick ranges from the dashboard json over server quick ranges', async () => {
    const { scene } = setupScene(
      {
        from: 'now-12h',
        to: 'now',
      },
      {
        quickRanges: [
          {
            display: 'Last 13 minutes',
            from: 'now-13m',
            to: 'now',
          },
        ],
        defaultQuickRanges: [
          {
            display: 'Last 12 minutes',
            from: 'now-12m',
            to: 'now',
          },
        ],
      }
    );

    render(<scene.Component model={scene} />);
    await userEvent.click(screen.getByTestId(Components.TimePicker.openButton));
    expect(screen.getByText('Last 13 minutes')).toBeInTheDocument();
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

import { screen } from '@testing-library/dom';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { EmbeddedScene } from './EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from './layout/SceneFlexLayout';
import { NO_COMPARE_OPTION, PREVIOUS_PERIOD_COMPARE_OPTION, SceneTimeRangeCompare } from './SceneTimeRangeCompare';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import React from 'react';
import { lastValueFrom } from 'rxjs';
import { DataQueryRequest, LoadingState, PanelData, dateTime, toDataFrame } from '@grafana/data';

const makeRequest = (range: SceneTimeRange): DataQueryRequest =>
  ({
    range: range.state.value,
    targets: [{ refId: 'A' }],
  } as unknown as DataQueryRequest);

const makePanelData = (from: string, to: string, series: PanelData['series'] = []): PanelData => {
  const fromTime = dateTime(from);
  const toTime = dateTime(to);
  return {
    state: LoadingState.Done,
    series,
    timeRange: { from: fromTime, to: toTime, raw: { from: fromTime, to: toTime } },
  };
};

describe('SceneTimeRangeCompare', () => {
  describe('given a time range', () => {
    describe('< 24h', () => {
      const comparer = new SceneTimeRangeCompare({});

      test('relative', () => {
        const timeRange = new SceneTimeRange({
          from: 'now-1h',
          to: 'now',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(5);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "None",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "Day before",
                  "value": "24h",
                },
                {
                  "label": "Week before",
                  "value": "1w",
                },
                {
                  "label": "Month before",
                  "value": "1M",
                },
              ]
            `);
      });

      test('absolute', () => {
        const timeRange = new SceneTimeRange({
          from: '2023-08-24T05:00:00.000Z',
          to: '2023-08-24T07:00:00.000Z',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(5);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "None",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "Day before",
                  "value": "24h",
                },
                {
                  "label": "Week before",
                  "value": "1w",
                },
                {
                  "label": "Month before",
                  "value": "1M",
                },
              ]
            `);
      });
    });

    describe('>24h, <=7d', () => {
      const comparer = new SceneTimeRangeCompare({});

      test('relative', () => {
        const timeRange = new SceneTimeRange({
          from: 'now-2d',
          to: 'now',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(4);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "None",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "Week before",
                  "value": "1w",
                },
                {
                  "label": "Month before",
                  "value": "1M",
                },
              ]
            `);
      });

      test('absolute', () => {
        const timeRange = new SceneTimeRange({
          from: '2023-08-22T05:00:00.000Z',
          to: '2023-08-24T05:00:00.000Z',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(4);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "None",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "Week before",
                  "value": "1w",
                },
                {
                  "label": "Month before",
                  "value": "1M",
                },
              ]
            `);
      });

      test('does not include 3d option if time range is > 3d', () => {
        const timeRange = new SceneTimeRange({
          from: 'now-4d',
          to: 'now',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(4);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
                [
                  {
                    "label": "None",
                    "value": "__noPeriod",
                  },
                  {
                    "label": "Previous period",
                    "value": "__previousPeriod",
                  },
                  {
                    "label": "Week before",
                    "value": "1w",
                  },
                  {
                    "label": "Month before",
                    "value": "1M",
                  },
                ]
              `);
      });
    });

    describe('>7d', () => {
      const comparer = new SceneTimeRangeCompare({});
      test('relative', () => {
        const timeRange = new SceneTimeRange({
          from: 'now-8d',
          to: 'now',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(3);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
                  [
                    {
                      "label": "None",
                      "value": "__noPeriod",
                    },
                    {
                      "label": "Previous period",
                      "value": "__previousPeriod",
                    },
                    {
                      "label": "Month before",
                      "value": "1M",
                    },
                  ]
                `);
      });

      test('absolute', () => {
        const timeRange = new SceneTimeRange({
          from: '2023-08-16T05:00:00.000Z',
          to: '2023-08-24T05:00:00.000Z',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(3);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
                    [
                      {
                        "label": "None",
                        "value": "__noPeriod",
                      },
                      {
                        "label": "Previous period",
                        "value": "__previousPeriod",
                      },
                      {
                        "label": "Month before",
                        "value": "1M",
                      },
                    ]
                  `);
      });

      test('does not include options that are less that provided range diff', () => {
        const timeRange = new SceneTimeRange({
          from: 'now-32d',
          to: 'now',
        });

        const result = comparer.getCompareOptions(timeRange.state.value);

        expect(result).toHaveLength(3);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "None",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "Month before",
                  "value": "1M",
                },
              ]
            `);
      });
    });
  });

  describe('comparison periods', () => {
    const timeRange = new SceneTimeRange({
      from: '2023-08-31T10:00:00.000Z',
      to: '2023-08-31T11:00:00.000Z',
    });

    it.each`
      value    | expectedFrom                  | expectedTo
      ${'24h'} | ${'2023-08-30T10:00:00.000Z'} | ${'2023-08-30T11:00:00.000Z'}
      ${'3d'}  | ${'2023-08-28T10:00:00.000Z'} | ${'2023-08-28T11:00:00.000Z'}
      ${'1w'}  | ${'2023-08-24T10:00:00.000Z'} | ${'2023-08-24T11:00:00.000Z'}
      ${'2w'}  | ${'2023-08-17T10:00:00.000Z'} | ${'2023-08-17T11:00:00.000Z'}
      ${'1M'}  | ${'2023-08-01T10:00:00.000Z'} | ${'2023-08-01T11:00:00.000Z'}
      ${'3M'}  | ${'2023-06-02T10:00:00.000Z'} | ${'2023-06-02T11:00:00.000Z'}
      ${'6M'}  | ${'2023-03-04T10:00:00.000Z'} | ${'2023-03-04T11:00:00.000Z'}
      ${'1y'}  | ${'2022-08-31T10:00:00.000Z'} | ${'2022-08-31T11:00:00.000Z'}
    `('when comparing with {$value}', ({ value, expectedFrom, expectedTo }) => {
      const comparer = new SceneTimeRangeCompare({
        compareWith: value,
      });

      const result = comparer.getCompareTimeRange(timeRange.state.value);

      expect(result!.from.toISOString()).toBe(expectedFrom);
      expect(result!.to.toISOString()).toBe(expectedTo);
    });
  });

  test('should fallback to previous period if new comparison range is not applicable to current time range', async () => {
    const timeRange = new SceneTimeRange({
      from: 'now-3d',
      to: 'now',
    });

    const comparer = new SceneTimeRangeCompare({
      compareWith: '7d',
    });

    const scene = new EmbeddedScene({
      $timeRange: timeRange,
      body: new SceneFlexLayout({
        children: [new SceneFlexItem({ body: comparer })],
      }),
    });

    scene.activate();
    // activating comparer manually as we do not render scene in this test
    comparer.activate();
    expect(comparer.state.compareWith).toBe('7d');

    timeRange.setState({ from: 'now-8d', to: 'now' });
    expect(comparer.state.compareWith).toBe(PREVIOUS_PERIOD_COMPARE_OPTION.value);
  });

  test('should allow for clearing comparison', () => {
    const timeRange = new SceneTimeRange({
      from: 'now-3d',
      to: 'now',
    });

    const comparer = new SceneTimeRangeCompare({});

    const scene = new EmbeddedScene({
      $timeRange: timeRange,
      body: new SceneFlexLayout({
        children: [new SceneFlexItem({ body: comparer })],
      }),
    });

    scene.activate();
    // activating comparer manually as we do not render scene in this test
    comparer.activate();
    expect(comparer.state.compareWith).toBeUndefined();

    // Check that we can remove previously selected comparison
    comparer.onCompareWithChanged('7d');
    expect(comparer.state.compareWith).toBe('7d');

    comparer.onCompareWithChanged(NO_COMPARE_OPTION.value);
    expect(comparer.state.compareWith).toBeUndefined();
  });

  test('properly saves last selected value', async () => {
    const timeRange = new SceneTimeRange({
      from: 'now-3d',
      to: 'now',
    });

    const comparer = new SceneTimeRangeCompare({});

    const scene = new EmbeddedScene({
      $timeRange: timeRange,
      body: new SceneFlexLayout({
        children: [new SceneFlexItem({ body: comparer })],
      }),
    });

    render(<scene.Component model={scene} />);

    // Is undefined by default
    expect(comparer.state.compareWith).toBeUndefined();

    let checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    // On checkbox click, previous period gets automatically selected
    expect(comparer.state.compareWith).toBe(PREVIOUS_PERIOD_COMPARE_OPTION.value);

    // Choose week before option
    await userEvent.click(screen.getByRole('button', { name: PREVIOUS_PERIOD_COMPARE_OPTION.label }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Week before' }));

    expect(comparer.state.compareWith).toBe('1w');

    // Uncheck checkbox
    await userEvent.click(checkbox);
    expect(comparer.state.compareWith).toBeUndefined();

    // Check it again
    await userEvent.click(checkbox);

    // Default value should be previously compared value
    expect(comparer.state.compareWith).toBe('1w');
  });

  describe('hideCheckbox functionality', () => {
    test('should properly initialize with hideCheckbox true', () => {
      const comparer = new SceneTimeRangeCompare({
        hideCheckbox: true,
      });

      // Should have hideCheckbox set to true
      expect(comparer.state.hideCheckbox).toBe(true);
    });

    test('should properly initialize with hideCheckbox false', () => {
      const comparer = new SceneTimeRangeCompare({
        hideCheckbox: false,
      });

      // Should have hideCheckbox set to false
      expect(comparer.state.hideCheckbox).toBe(false);
    });

    test('should default hideCheckbox to undefined when not specified', () => {
      const comparer = new SceneTimeRangeCompare({});

      // Should have hideCheckbox as undefined (default behavior)
      expect(comparer.state.hideCheckbox).toBeUndefined();
    });

    test('should handle comparison state changes with hideCheckbox enabled', () => {
      const comparer = new SceneTimeRangeCompare({
        hideCheckbox: true,
      });

      // Initially no comparison
      expect(comparer.state.compareWith).toBeUndefined();

      // Should be able to set a comparison
      comparer.onCompareWithChanged('1w');
      expect(comparer.state.compareWith).toBe('1w');

      // Should be able to clear comparison
      comparer.onClearCompare();
      expect(comparer.state.compareWith).toBeUndefined();
    });

    test('should handle NO_PERIOD_VALUE correctly with hideCheckbox', () => {
      const comparer = new SceneTimeRangeCompare({
        hideCheckbox: true,
        compareWith: '1w',
      });

      // Initially has a comparison
      expect(comparer.state.compareWith).toBe('1w');

      // Should clear comparison when NO_PERIOD_VALUE is passed
      comparer.onCompareWithChanged('__noPeriod');
      expect(comparer.state.compareWith).toBeUndefined();
    });
  });

  describe('timeShiftAlignmentProcessor (via getExtraQueries)', () => {
    // The processor isn't exported directly - grab it off the ExtraQueryDescriptor, same as the
    // query runner does.
    function getProcessor(comparer: SceneTimeRangeCompare, timeRange: SceneTimeRange) {
      const [{ processor }] = comparer.getExtraQueries(makeRequest(timeRange));
      if (!processor) {
        throw new Error('expected a processor');
      }
      return processor;
    }

    it('should not mutate the secondary PanelData, its series, or their frame objects', async () => {
      // The frames here may be owned by a datasource's streaming/split-chunk response accumulator and
      // re-processed on every chunk - mutating them in place caused duplicate compare series to
      // accumulate instead of being replaced. The processor must return new objects instead.
      const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
      const comparer = new SceneTimeRangeCompare({ compareWith: '24h' });
      const processor = getProcessor(comparer, timeRange);

      const frame = toDataFrame({ refId: 'A', fields: [] });
      const primary = makePanelData('2024-01-10T00:00:00.000Z', '2024-01-10T01:00:00.000Z');
      const secondary = makePanelData('2024-01-09T00:00:00.000Z', '2024-01-09T01:00:00.000Z', [frame]);

      const result = await lastValueFrom(processor(primary, secondary));

      expect(result).not.toBe(secondary);
      expect(secondary.series).toEqual([frame]);
      expect(frame.refId).toBe('A');
      expect(frame.meta).toBeUndefined();
    });

    it('should not accumulate duplicate compare series when re-processing the same shared input frame', async () => {
      // Simulates the split-query accumulator pattern: the same frame object is passed through the
      // processor repeatedly (e.g. once per streamed chunk). Each pass must produce exactly one
      // compare series, never more.
      const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
      const comparer = new SceneTimeRangeCompare({ compareWith: '24h' });
      const processor = getProcessor(comparer, timeRange);

      const sharedFrame = toDataFrame({ refId: 'A', fields: [] });
      const primary = makePanelData('2024-01-10T00:00:00.000Z', '2024-01-10T01:00:00.000Z');
      const secondary = makePanelData('2024-01-09T00:00:00.000Z', '2024-01-09T01:00:00.000Z', [sharedFrame]);

      await lastValueFrom(processor(primary, secondary));
      await lastValueFrom(processor(primary, secondary));
      const result = await lastValueFrom(processor(primary, secondary));

      expect(sharedFrame.refId).toBe('A');
      expect(result.series).toHaveLength(1);
      expect(result.series[0].refId).toBe('A-compare');
    });
  });
});

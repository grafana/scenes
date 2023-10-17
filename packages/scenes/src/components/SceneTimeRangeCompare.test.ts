import { SceneTimeRange } from '../core/SceneTimeRange';
import { EmbeddedScene } from './EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from './layout/SceneFlexLayout';
import { NO_COMPARE_OPTION, PREVIOUS_PERIOD_COMPARE_OPTION, SceneTimeRangeCompare } from './SceneTimeRangeCompare';

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

        expect(result).toHaveLength(10);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "No comparison",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "1 day before",
                  "value": "24h",
                },
                {
                  "label": "3 days before",
                  "value": "3d",
                },
                {
                  "label": "1 week before",
                  "value": "1w",
                },
                {
                  "label": "2 weeks before",
                  "value": "2w",
                },
                {
                  "label": "1 month before",
                  "value": "1M",
                },
                {
                  "label": "3 months before",
                  "value": "3M",
                },
                {
                  "label": "6 months before",
                  "value": "6M",
                },
                {
                  "label": "1 year before",
                  "value": "1y",
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

        expect(result).toHaveLength(10);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "No comparison",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "1 day before",
                  "value": "24h",
                },
                {
                  "label": "3 days before",
                  "value": "3d",
                },
                {
                  "label": "1 week before",
                  "value": "1w",
                },
                {
                  "label": "2 weeks before",
                  "value": "2w",
                },
                {
                  "label": "1 month before",
                  "value": "1M",
                },
                {
                  "label": "3 months before",
                  "value": "3M",
                },
                {
                  "label": "6 months before",
                  "value": "6M",
                },
                {
                  "label": "1 year before",
                  "value": "1y",
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

        expect(result).toHaveLength(9);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "No comparison",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "3 days before",
                  "value": "3d",
                },
                {
                  "label": "1 week before",
                  "value": "1w",
                },
                {
                  "label": "2 weeks before",
                  "value": "2w",
                },
                {
                  "label": "1 month before",
                  "value": "1M",
                },
                {
                  "label": "3 months before",
                  "value": "3M",
                },
                {
                  "label": "6 months before",
                  "value": "6M",
                },
                {
                  "label": "1 year before",
                  "value": "1y",
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

        expect(result).toHaveLength(9);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "No comparison",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "3 days before",
                  "value": "3d",
                },
                {
                  "label": "1 week before",
                  "value": "1w",
                },
                {
                  "label": "2 weeks before",
                  "value": "2w",
                },
                {
                  "label": "1 month before",
                  "value": "1M",
                },
                {
                  "label": "3 months before",
                  "value": "3M",
                },
                {
                  "label": "6 months before",
                  "value": "6M",
                },
                {
                  "label": "1 year before",
                  "value": "1y",
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

        expect(result).toHaveLength(8);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
                [
                  {
                    "label": "No comparison",
                    "value": "__noPeriod",
                  },
                  {
                    "label": "Previous period",
                    "value": "__previousPeriod",
                  },
                  {
                    "label": "1 week before",
                    "value": "1w",
                  },
                  {
                    "label": "2 weeks before",
                    "value": "2w",
                  },
                  {
                    "label": "1 month before",
                    "value": "1M",
                  },
                  {
                    "label": "3 months before",
                    "value": "3M",
                  },
                  {
                    "label": "6 months before",
                    "value": "6M",
                  },
                  {
                    "label": "1 year before",
                    "value": "1y",
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

        expect(result).toHaveLength(7);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
                  [
                    {
                      "label": "No comparison",
                      "value": "__noPeriod",
                    },
                    {
                      "label": "Previous period",
                      "value": "__previousPeriod",
                    },
                    {
                      "label": "2 weeks before",
                      "value": "2w",
                    },
                    {
                      "label": "1 month before",
                      "value": "1M",
                    },
                    {
                      "label": "3 months before",
                      "value": "3M",
                    },
                    {
                      "label": "6 months before",
                      "value": "6M",
                    },
                    {
                      "label": "1 year before",
                      "value": "1y",
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

        expect(result).toHaveLength(7);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
                    [
                      {
                        "label": "No comparison",
                        "value": "__noPeriod",
                      },
                      {
                        "label": "Previous period",
                        "value": "__previousPeriod",
                      },
                      {
                        "label": "2 weeks before",
                        "value": "2w",
                      },
                      {
                        "label": "1 month before",
                        "value": "1M",
                      },
                      {
                        "label": "3 months before",
                        "value": "3M",
                      },
                      {
                        "label": "6 months before",
                        "value": "6M",
                      },
                      {
                        "label": "1 year before",
                        "value": "1y",
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

        expect(result).toHaveLength(5);
        expect(result[0]).toBe(NO_COMPARE_OPTION);
        expect(result[1]).toBe(PREVIOUS_PERIOD_COMPARE_OPTION);
        expect(result).toMatchInlineSnapshot(`
              [
                {
                  "label": "No comparison",
                  "value": "__noPeriod",
                },
                {
                  "label": "Previous period",
                  "value": "__previousPeriod",
                },
                {
                  "label": "3 months before",
                  "value": "3M",
                },
                {
                  "label": "6 months before",
                  "value": "6M",
                },
                {
                  "label": "1 year before",
                  "value": "1y",
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
});

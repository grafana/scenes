import { arrayToDataFrame } from '@grafana/data';
import { filterAnnotations } from './filterAnnotations';

describe('filterAnnotations', () => {
  test('multiple frames', () => {
    const events1 = [
      {
        source: {
          filter: {
            exclude: true,
            ids: [1, 2],
          },
        },
      },
      {
        source: {
          filter: {
            exclude: true,
            ids: [1, 2],
          },
        },
      },
    ];

    const events2 = [
      {
        source: {
          filter: {
            exclude: false,
            ids: [2],
          },
        },
      },
      {
        source: {
          filter: {
            exclude: false,
            ids: [2],
          },
        },
      },
    ];

    const df1 = arrayToDataFrame(events1);
    const df2 = arrayToDataFrame(events2);

    const result = filterAnnotations([df1, df2], { panelId: 2 });

    expect(result.length).toBe(2);
    expect(result[0].length).toBe(0);
    expect(result[1].length).toBe(2);
  });
});

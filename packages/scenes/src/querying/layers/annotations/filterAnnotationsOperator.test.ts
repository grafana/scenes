import { arrayToDataFrame } from '@grafana/data';
import { of } from 'rxjs';
import { filterAnnotationsOperator } from './filterAnnotationsOperator';

describe('filterAnnotationsOperator', () => {
  test('multiple frames', (done) => {
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

    const filter = filterAnnotationsOperator({ panelId: 2 })({
      interpolate: () => '',
    });

    filter(of([df1, df2])).subscribe((frames) => {
      expect(frames.length).toBe(2);
      expect(frames[0].length).toBe(0);
      expect(frames[1].length).toBe(2);
      done();
    });
  });
});

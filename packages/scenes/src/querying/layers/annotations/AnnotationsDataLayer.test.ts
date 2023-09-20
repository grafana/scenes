import { AnnotationEvent } from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { of } from 'rxjs';
import { AnnotationsDataLayer } from './AnnotationsDataLayer';

let mockedEvents: AnnotationEvent[] = [];
jest.mock('./standardAnnotationQuery', () => ({
  executeAnnotationQuery: () => {
    return of({
      state: LoadingState.Done,
      events: mockedEvents,
    });
  },
}));

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => {
    return {
      get: jest.fn().mockReturnValue({}),
    };
  },

  config: {
    theme2: {
      visualization: {
        getColorByName: jest.fn().mockReturnValue('red'),
      },
    },
  },
}));

describe('AnnotationsDataLayer', () => {
  describe('deduplication', () => {
    it('should remove duplicated annotations', (done) => {
      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { enable: true, iconColor: 'red', name: 'Test' },
      });
      mockedEvents = [
        { id: '1', time: 1 },
        { id: '2', time: 2 },
        { id: '2', time: 2 },
        { id: '5', time: 5 },
        { id: '5', time: 5 },
      ];

      layer.activate();

      layer.getResultsStream().subscribe((res) => {
        expect(res.data.annotations).toBeDefined();
        expect(res.data.annotations?.[0].length).toBe(3);
        done();
      });
    });

    it('should leave non "panel-alert" event if present', (done) => {
      const layer = new AnnotationsDataLayer({
        name: 'Test layer',
        query: { enable: true, iconColor: 'red', name: 'Test' },
      });
      mockedEvents = [
        { id: '1', time: 1 },
        { id: '2', time: 2 },
        // @ts-expect-error
        { id: '2', time: 2, eventType: 'panel-alert' },
        { id: '5', time: 5 },
        { id: '5', time: 5 },
      ];

      layer.activate();

      layer.getResultsStream().subscribe((res) => {
        expect(res.data.annotations).toBeDefined();
        expect(res.data.annotations?.[0].length).toBe(3);
        done();
      });
    });
  });
});

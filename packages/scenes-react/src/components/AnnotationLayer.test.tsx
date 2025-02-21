import React from 'react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { AnnotationLayer } from './AnnotationLayer';
import { SceneDataLayerSet } from '@grafana/scenes';
import { render } from '@testing-library/react';
import { DataQueryRequest, DataQueryResponse, DataSourceApi } from '@grafana/data';
import { Observable, map, of } from 'rxjs';

const getDataSourceMock = jest.fn().mockReturnValue({
  query: () =>
    of({
      data: [],
    }),
});

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: any = {};

  return (ds.query(request) as Observable<DataQueryResponse>).pipe(
    map((packet) => {
      return result;
    })
  );
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    return runRequestMock(ds, request);
  },
}));

describe('AnnotationLayer', () => {
  it('Should create and add an annotation data layer to scene', async () => {
    const scene = new SceneContextObject();

    const query1 = {
      datasource: {
        type: 'testdata',
        uid: 'gdev-testdata',
      },
      enable: true,
      iconColor: 'yellow',
      name: 'New annotation',
      target: {
        // @ts-ignore
        lines: 10,
        refId: 'Anno',
        scenarioId: 'annotations',
      },
    };

    const query2 = {
      datasource: {
        type: 'testdata',
        uid: 'gdev-testdata',
      },
      enable: true,
      iconColor: 'blue',
      name: 'New annotation',
      target: {
        // @ts-ignore
        lines: 15,
        refId: 'Anno',
        scenarioId: 'annotations',
      },
    };

    const { rerender, unmount } = render(
      <TestContextProvider value={scene}>
        <AnnotationLayer name="test_anno" query={query1}>
          <p>child</p>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect((scene.state.$data! as SceneDataLayerSet).state.layers[0].state.name).toBe('test_anno');

    rerender(
      <TestContextProvider value={scene}>
        <AnnotationLayer name="test_anno_1" query={query1}>
          <AnnotationLayer name="test_anno_2" query={query2}>
            <p>child</p>
          </AnnotationLayer>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect((scene.state.$data! as SceneDataLayerSet).state.layers[0].state.name).toBe('test_anno_2');
    expect((scene.state.$data! as SceneDataLayerSet).state.layers[1].state.name).toBe('test_anno_1');

    unmount();

    expect(scene.state.$data?.isActive).toBe(false);
    expect((scene.state.$data! as SceneDataLayerSet).state.layers.length).toBe(0);
  });
});

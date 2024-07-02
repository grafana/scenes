import React from 'react';
import { render, screen } from '@testing-library/react';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { TestContextProvider } from '../utils/testUtils';
import { AnnotationLayer } from './AnnotationLayer';
import { DataLayerControl } from './DataLayerControl';
import { DataQueryRequest, DataQueryResponse, DataSourceApi } from '@grafana/data';
import { Observable, map, of } from 'rxjs';
import { SceneContextProvider } from '../contexts/SceneContextProvider';

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

describe('DataLayerControl', () => {
  it('Should find the correct annotation data layer', async () => {
    const { scene, query } = setup();

    const { rerender, unmount } = render(
      <TestContextProvider value={scene}>
        <AnnotationLayer name="test_anno" query={query}>
          <DataLayerControl name="test_anno" />
          <p>child</p>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect(screen.getByLabelText('test_anno')).toBeTruthy();

    rerender(
      <TestContextProvider value={scene}>
        <AnnotationLayer name="test_anno" query={query}>
          <p>child</p>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect(screen.queryByLabelText('test_anno')).toBeNull();

    unmount();
  });

  it('Should not render if names do not match', () => {
    const { scene, query } = setup();

    const { unmount } = render(
      <TestContextProvider value={scene}>
        <AnnotationLayer name="test_anno" query={query}>
          <DataLayerControl name="test_anno_2" />
          <p>child</p>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect(screen.queryByLabelText('test_anno')).toBeNull();
    expect(screen.queryByLabelText('test_anno_2')).toBeNull();

    unmount();
  });

  it('Should find data layer in parent context and render', () => {
    const { scene, query } = setup();

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
        <AnnotationLayer name="global_test_anno" query={query}>
          <SceneContextProvider>
            <AnnotationLayer name="local_test_anno" query={query2}>
              <DataLayerControl name="global_test_anno" />
              <p>child</p>
            </AnnotationLayer>
          </SceneContextProvider>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect(screen.queryByLabelText('global_test_anno')).toBeTruthy();

    rerender(
      <TestContextProvider value={scene}>
        <AnnotationLayer name="global_test_anno" query={query}>
          <SceneContextProvider>
            <AnnotationLayer name="local_test_anno" query={query2}>
              <DataLayerControl name="global_test_anno" />
              <DataLayerControl name="local_test_anno" />
              <p>child</p>
            </AnnotationLayer>
          </SceneContextProvider>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect(screen.queryByLabelText('local_test_anno')).toBeTruthy();
    expect(screen.queryByLabelText('global_test_anno')).toBeTruthy();

    unmount();
  });

  it('Should not find data layer if it is above it in react hierarchy', () => {
    const { scene, query } = setup();

    const { unmount } = render(
      <TestContextProvider value={scene}>
        <DataLayerControl name="test_anno" />
        <AnnotationLayer name="test_anno" query={query}>
          <p>child</p>
        </AnnotationLayer>
      </TestContextProvider>
    );

    expect(screen.queryByLabelText('test_anno')).toBeNull();

    unmount();
  });

  it('Should not render if annotation is in a sibling context', () => {
    const { scene, query } = setup();

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

    const { unmount } = render(
      <TestContextProvider value={scene}>
        <SceneContextProvider>
          <AnnotationLayer name="local_test_anno_1" query={query}>
            <DataLayerControl name="local_test_anno_2" />
            <p>child</p>
          </AnnotationLayer>
        </SceneContextProvider>
        <SceneContextProvider>
          <AnnotationLayer name="local_test_anno_2" query={query2}>
            <p>child</p>
          </AnnotationLayer>
        </SceneContextProvider>
      </TestContextProvider>
    );

    expect(screen.queryByLabelText('local_test_anno_2')).toBeNull();

    unmount();
  });
});

function setup() {
  const scene = new SceneContextObject();

  const query = {
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

  return { scene, query };
}

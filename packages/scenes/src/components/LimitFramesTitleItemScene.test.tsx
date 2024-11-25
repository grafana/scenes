import { PanelBuilders } from '../core/PanelBuilders';
import { LimitFramesTitleItemScene } from './LimitFramesTitleItemScene';
import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  toDataFrame,
} from '@grafana/data';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { map, Observable, of } from 'rxjs';
import { SceneDataTransformer } from '../querying/SceneDataTransformer';
import { sceneGraph } from '../core/sceneGraph';

const getDataSourceMock = jest.fn().mockReturnValue({
  uid: 'test-uid',
  getRef: () => ({ uid: 'test-uid' }),
  query: () => {
    return of({
      data: getDataFrame()
    });
  },
});
const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: PanelData = getTestData()

  return (ds.query(request) as Observable<DataQueryResponse>).pipe(
    map((packet) => {
      result.state = LoadingState.Done;
      result.series = packet.data;
      return result;
    })
  );
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    return runRequestMock(ds, request);
  },
  getDataSourceSrv: () => {
    return {
      get: getDataSourceMock,
      getInstanceSettings: () => ({ uid: 'test-uid' }),
    };
  },
  getPluginImportUtils: () => ({
    getPanelPluginFromCache: jest.fn(() => undefined),
  }),
}));

describe('LimitFramesTitleItemScene', () => {
  it('Should not limit results with fewer or equal frame count then frameLimit', async() => {
    const scene = PanelBuilders.timeseries()
        .setData(new SceneQueryRunner({
          datasource: { uid: 'uid' },
          queries: [{ refId: 'A' }]
        }))
        .setTitleItems(new LimitFramesTitleItemScene({frameLimit: 10}))
        .build();

    scene.activate();
    await new Promise((r) => setTimeout(r, 1));

    expect(scene.state).toBeDefined();
    expect(scene?.state.$data?.isActive).toEqual(true)

    const $sceneDataTransformer = sceneGraph.getData(scene)
    const $sceneQueryRunner = sceneGraph.findDescendent(scene, SceneQueryRunner)

    expect($sceneDataTransformer).toBeInstanceOf(SceneDataTransformer)
    expect($sceneDataTransformer.state.$data).toBeInstanceOf(SceneQueryRunner)

    expect($sceneQueryRunner).toBe($sceneDataTransformer.state.$data)
    expect($sceneDataTransformer).toBe(scene.state.$data)

    expect($sceneQueryRunner?.state.data?.series).toMatchObject(getDataFrame())
    expect($sceneDataTransformer?.state.data?.series).toMatchObject(getDataFrame())
  })

  it('Should limit results with fewer frames then frameLimit', async() => {
    const scene = PanelBuilders.timeseries()
        .setData(new SceneQueryRunner({
          datasource: { uid: 'uid' },
          queries: [{ refId: 'A' }]
        }))
        .setTitleItems(new LimitFramesTitleItemScene({frameLimit: 5}))
        .build();

    scene.activate();
    await new Promise((r) => setTimeout(r, 1));

    const $sceneDataTransformer = sceneGraph.getData(scene)
    const $sceneQueryRunner = sceneGraph.findDescendent(scene, SceneQueryRunner)

    expect($sceneQueryRunner?.state.data?.series).toMatchObject(getDataFrame())
    expect($sceneDataTransformer?.state.data?.series).toMatchObject(getDataFrame().slice(0, 5))
  })

  it('Should limit results with nested SceneDataTransformer', async() => {
    const scene = PanelBuilders.timeseries()
      .setData(new SceneDataTransformer({
          transformations: [],
          $data: new SceneQueryRunner({
            datasource: { uid: 'uid' },
            queries: [{ refId: 'A' }],
          }),
        },
      ))
      .setTitleItems(new LimitFramesTitleItemScene({frameLimit: 5}))
      .build();

    scene.activate();
    await new Promise((r) => setTimeout(r, 1));

    const $sceneDataTransformer = sceneGraph.getData(scene)
    const $sceneQueryRunner = sceneGraph.findDescendent(scene, SceneQueryRunner)

    expect($sceneQueryRunner?.state.data?.series).toMatchObject(getDataFrame())
    expect($sceneDataTransformer?.state.data?.series).toMatchObject(getDataFrame().slice(0, 5))
  })

  it('toggleShowAllSeries should remove limit', async() => {
    const scene = PanelBuilders.timeseries()
      .setData(new SceneDataTransformer({
          transformations: [],
          $data: new SceneQueryRunner({
            datasource: { uid: 'uid' },
            queries: [{ refId: 'A' }],
          }),
        },
      ))
      .setTitleItems(new LimitFramesTitleItemScene({frameLimit: 5}))
      .build();

    const timeSeriesLimit = scene.state.titleItems as LimitFramesTitleItemScene;

    scene.activate();
    timeSeriesLimit.activate()
    await new Promise((r) => setTimeout(r, 1));

    const $sceneDataTransformer = sceneGraph.getData(scene)
    const $sceneQueryRunner = sceneGraph.findDescendent(scene, SceneQueryRunner)

    expect(timeSeriesLimit).toBeInstanceOf(LimitFramesTitleItemScene)
    expect(timeSeriesLimit.isActive).toEqual(true)

    expect($sceneQueryRunner?.state.data?.series).toMatchObject(getDataFrame())
    expect($sceneDataTransformer?.state.data?.series).toMatchObject(getDataFrame().slice(0, 5))

    timeSeriesLimit.showAllSeries()
    expect($sceneDataTransformer?.state.data?.series).toMatchObject(getDataFrame())
  })
});

function getDataFrame(): DataFrame[] {
  return [
    toDataFrame({refId: 'A', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'B', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'C', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'D', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'E', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'F', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'G', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'H', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'I', datapoints: [[100, 1], [400, 2], [500, 3]]}),
    toDataFrame({refId: 'J', datapoints: [[100, 1], [400, 2], [500, 3]]}),
  ]
}

function getTestData(): PanelData {
  return {
    state: LoadingState.Loading,
    timeRange: getDefaultTimeRange(),
    series: getDataFrame(),
  };
}

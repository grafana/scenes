import { lastValueFrom, of } from 'rxjs';

import {
  DataSourceApi,
  DataSourceRef,
  FieldType,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  PluginType,
  ScopedVars,
  toDataFrame,
  VariableSupportType,
} from '@grafana/data';

import { QueryVariable } from './QueryVariable';
import { setCreateQueryVariableRunnerFactory } from './createQueryVariableRunner';
import { setRunRequest } from '@grafana/runtime';
import { SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { QueryEnhancerVariable } from './QueryEnhancerVariable';
import { SceneObject } from '../../core/types';

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame({
        fields: [{ name: 'text', type: FieldType.string, values: ['val1', 'val2', 'val11'] }],
      }),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

setRunRequest(runRequestMock);

const getDataSourceMock = jest.fn();

const fakeDsMock: DataSourceApi = {
  name: 'fake-std',
  type: 'fake-std',
  getRef: () => ({ type: 'fake-std', uid: 'fake-std' }),
  query: () =>
    Promise.resolve({
      data: [],
    }),
  testDatasource: () => Promise.resolve({ status: 'success', message: 'abc' }),
  meta: {
    id: 'fake-std',
    type: PluginType.datasource,
    module: 'fake-std',
    baseUrl: '',
    name: 'fake-std',
    info: {
      author: { name: '' },
      description: '',
      links: [],
      logos: { large: '', small: '' },
      updated: '',
      version: '',
      screenshots: [],
    },
  },
  // Standard variable support
  variables: {
    getType: () => VariableSupportType.Standard,
    toDataQuery: (q) => ({ ...q, refId: 'FakeDataSource-refId' }),
  },
  id: 1,
  uid: 'fake-std',
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => ({
    get: (ds: DataSourceRef, vars: ScopedVars): Promise<DataSourceApi> => {
      getDataSourceMock(ds, vars);
      return Promise.resolve(fakeDsMock);
    },
  }),
  config: {
    buildInfo: {
      version: '1.0.0',
    },
    theme2: {
      visualization: {
        getColorByName: jest.fn().mockReturnValue('red'),
      },
    },
  },
}));

describe('QueryEnhancerVariable', () => {
  afterEach(() => {
    runRequestMock.mockClear();
    getDataSourceMock.mockClear();
  });

  it('Query runners should wait', async () => {
    const variable = new QueryEnhancerVariable({
      name: 'test',
    });
    const queryRunner = new SceneQueryRunner({
      queries: [{ refId: 'A', query: '$A' }],
      maxDataPointsFromWidth: true,
    });

    const scene = new SceneFlexLayout({
      $variables: new SceneVariableSet({ variables: [variable] }),
      $timeRange: new SceneTimeRange(),
      $data: queryRunner,
      children: [],
    });

    await lastValueFrom(variable.validateAndUpdate());

    expect(variable.state.query).toEqual('');
    expect(variable.state.value).toEqual('');
    expect(variable.state.text).toEqual('');
    expect(variable.state.options).toEqual([]);
  });
});

class MyCustomQueryEnhancerVariable extends QueryEnhancerVariable {
  public constructor() {
    super({});
  }

  public applyTo(sceneObject: SceneObject) {
    return super.applyTo(sceneObject);
  }
}

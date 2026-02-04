import { DataQueryRequest, DataSourceApi, standardTransformersRegistry, toDataFrame } from '@grafana/data';
import { getHookContextWrapper, runRequestMock } from '../utils/testUtils';
import { renderHook } from '@testing-library/react';
import { useQueryRunner } from './useQueryRunner';
import { useDataTransformer } from './useDataTransformer';
import { map, of } from 'rxjs';

export const getDataSourceMock = jest.fn().mockReturnValue({
  uid: 'test-uid',
  getRef: () => ({ uid: 'test-uid' }),
  query: () => {
    return of({
      data: [
        toDataFrame({
          refId: 'A',
          datapoints: [
            [100, 1],
            [200, 2],
            [300, 3],
          ],
        }),
      ],
    });
  },
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
}));

describe('useDataTransformer', () => {
  beforeAll(() => {
    standardTransformersRegistry.register({
      id: 'transformer1',
      name: 'Custom transformer',
      editor: () => null,
      transformation: {
        id: 'transformer1',
        name: 'Custom Transformer',
        operator: (options) => (source) => {
          return source.pipe(
            map((data) => {
              return data.map((frame) => {
                return {
                  ...frame,
                  fields: frame.fields.map((field) => {
                    return {
                      ...field,
                      values: field.values.map((v) => {
                        return v * options.multiplier;
                      }),
                    };
                  }),
                };
              });
            })
          );
        },
      },
      imageDark: '',
      imageLight: '',
    });
  });

  it('Should transform data and react to transformation option changes', async () => {
    const { wrapper } = getHookContextWrapper({});

    const { result: queryRunnerResult } = renderHook(useQueryRunner, {
      wrapper,
      initialProps: {
        queries: [{ uid: 'gdev-testdata', refId: 'first', scenarioId: 'random_walk' }],
        maxDataPoints: 20,
      },
    });

    const queryRunner = queryRunnerResult.current;

    const { rerender, result: dataTransformerResult } = renderHook(useDataTransformer, {
      wrapper,
      initialProps: {
        transformations: [{ id: 'transformer1', options: { multiplier: 1.5 } }],
        data: queryRunner,
      },
    });
    const dataTransformer = dataTransformerResult.current;
    await new Promise((r) => setTimeout(r, 1));

    expect(dataTransformer.state.data?.series[0].fields[1].values).toEqual([150, 300, 450]);
    rerender({
      transformations: [{ id: 'transformer1', options: { multiplier: 2 } }],
      data: queryRunner,
    });

    await new Promise((r) => setTimeout(r, 1));
    expect(dataTransformer.state.data?.series[0].fields[1].values).toEqual([200, 400, 600]);
  });
});

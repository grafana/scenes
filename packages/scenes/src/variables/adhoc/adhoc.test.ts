import { DataQueryRequest, DataSourceApi } from '@grafana/data';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';
import { of } from 'rxjs';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { AdHocVariable } from '../variants/AdHocVariable';

const getDataSourceMock = jest.fn().mockReturnValue({
  getRef: () => ({ uid: 'test' }),
  query: () => of({ data: [] }),
});

let sentRequest: DataQueryRequest | undefined;

jest.mock('@grafana/runtime', () => ({
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    sentRequest = request;
    return of({ data: [] });
  },
  getDataSourceSrv: () => {
    return { get: getDataSourceMock };
  },
  config: {
    theme: {
      palette: {
        gray60: '#666666',
      },
    },
  },
}));

describe('adhoc', () => {
  it('Can get dependencies', async () => {
    const queryRunner = new SceneQueryRunner({
      queries: [
        {
          refId: 'A',
          expr: 'my_metric',
        },
      ],
      adHocFilterNames: ['filters'],
      $timeRange: new SceneTimeRange(),
      $variables: new SceneVariableSet({
        variables: [
          new AdHocVariable({
            name: 'filters',
            filters: [{ key: 'server', operator: '=', value: 'server1', condition: '' }],
          }),
        ],
      }),
    });

    queryRunner.activate();

    await new Promise((r) => setTimeout(r, 1));

    expect(sentRequest).toBeDefined();
    expect(sentRequest.adhocFilters).toEqual([{ key: 'server', operator: '=', value: 'server1', condition: '' }]);
  });
});

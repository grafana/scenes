import { DataSourceRef } from '@grafana/schema';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { escapeURLDelimiters, getFuzzySearcher, getQueriesForVariables } from './utils';
import { SceneVariableSet } from './sets/SceneVariableSet';
import { DataSourceVariable } from './variants/DataSourceVariable';
import { GetDataSourceListFilters } from '@grafana/runtime';
import { searchOptions } from './adhoc/AdHocFiltersCombobox/utils';
import { SelectableValue } from '@grafana/data';

describe('getQueriesForVariables', () => {
  it('should resolve queries', () => {
    const runner1 = new SceneQueryRunner({
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'A' }],
    });

    const runner2 = new SceneQueryRunner({
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'B' }],
    });

    const source = new TestObject({ datasource: { uid: 'test-uid' } });
    new EmbeddedScene({
      $data: runner1,
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            $data: runner2,
            body: source,
          }),
        ],
      }),
    });

    runner1.activate();
    runner2.activate();
    source.activate();
    expect(getQueriesForVariables(source)).toEqual([{ refId: 'A' }, { refId: 'B' }]);
  });

  it('should not ignore queries from inactive runners', () => {
    const runner1 = new SceneQueryRunner({
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'A' }],
    });

    const runner2 = new SceneQueryRunner({
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'B' }],
    });

    const source = new TestObject({ datasource: { uid: 'test-uid' } });

    new EmbeddedScene({
      $data: runner1,
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            $data: runner2,
            body: source,
          }),
        ],
      }),
    });

    runner1.activate();
    source.activate();

    expect(getQueriesForVariables(source)).toEqual([{ refId: 'A' }, { refId: 'B' }]);
  });

  it('should ignore inactive runner if an active one with the same key exist ', () => {
    const runner1 = new SceneQueryRunner({
      key: 'runner-one',
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'A' }],
    });

    const runner1inactive = new SceneQueryRunner({
      key: 'runner-one',
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'A' }],
    });

    const runner2 = new SceneQueryRunner({
      key: 'runner-two',
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'B' }],
    });

    const source = new TestObject({ datasource: { uid: 'test-uid' } });
    new EmbeddedScene({
      $data: runner1,
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            $data: runner1inactive,
            body: source,
          }),
          new SceneFlexItem({
            $data: runner2,
            body: source,
          }),
        ],
      }),
    });

    runner1.activate();
    runner2.activate();

    source.activate();
    expect(getQueriesForVariables(source)).toEqual([{ refId: 'A' }, { refId: 'B' }]);
  });

  it('should not deduplicate queries from active runners with the same key', () => {
    const runner1 = new SceneQueryRunner({
      key: 'runner-one',
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'A' }],
    });

    const runner1copy = new SceneQueryRunner({
      key: 'runner-one',
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'AA' }],
    });

    const runner2 = new SceneQueryRunner({
      key: 'runner-two',
      datasource: {
        uid: 'test-uid',
      },
      queries: [{ refId: 'B' }],
    });

    const source = new TestObject({ datasource: { uid: 'test-uid' } });
    new EmbeddedScene({
      $data: runner1,
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            $data: runner1copy,
            body: source,
          }),
          new SceneFlexItem({
            $data: runner2,
            body: source,
          }),
        ],
      }),
    });

    runner1.activate();
    runner1copy.activate();
    runner2.activate();
    source.activate();

    expect(getQueriesForVariables(source)).toEqual([{ refId: 'A' }, { refId: 'AA' }, { refId: 'B' }]);
  });

  it('should not retrieve queries with a different datasource than the runner', () => {
    const runner1 = new SceneQueryRunner({
      datasource: { uid: 'test-uid' },
      queries: [{ refId: 'A' }, { datasource: { type: '__expr__', uid: 'Expression' }, refId: 'B' }],
    });

    const runner2 = new SceneQueryRunner({
      datasource: { uid: 'test-uid' },
      queries: [{ datasource: { type: '__expr__', uid: 'Expression' }, refId: 'C' }],
    });

    const source = new TestObject({ datasource: { uid: 'test-uid' } });
    new EmbeddedScene({
      $data: runner1,
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            $data: runner2,
            body: source,
          }),
        ],
      }),
    });

    runner1.activate();
    runner2.activate();
    source.activate();
    expect(getQueriesForVariables(source)).toEqual([{ refId: 'A' }]);
  });
});

const getDataSourceListMock = jest.fn().mockImplementation((filters: GetDataSourceListFilters) => {
  if (filters.pluginId === 'prometheus') {
    return [
      {
        id: 1,
        uid: 'interpolatedDs',
        type: 'prometheus',
        name: 'interpolatedDs-name',
        isDefault: true,
      },
    ];
  }

  return [];
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => {
    return {
      getList: getDataSourceListMock,
    };
  },
}));

describe('getQueriesForVariables', () => {
  const original = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = original;
    jest.resetAllMocks();
  });

  it('should get queries for interpolated source object and query datasource uuids', () => {
    const runner1 = new SceneQueryRunner({
      datasource: {
        uid: '${dsVar}',
      },
      queries: [{ refId: 'A' }, { datasource: { type: '__expr__', uid: 'Expression' }, refId: 'C' }],
    });

    const runner2 = new SceneQueryRunner({
      datasource: {
        uid: '${dsVar}',
      },
      queries: [
        { refId: 'B' },
        { datasource: { uid: '${dsVar}' }, refId: 'D' },
        { datasource: { type: 'prometheus' }, refId: 'E' },
      ],
    });

    const source = new TestObject({
      $variables: new SceneVariableSet({
        variables: [
          new DataSourceVariable({
            name: 'dsVar',
            options: [],
            value: 'interpolatedDs',
            text: 'interpolatedDs-name',
            pluginId: 'prometheus',
          }),
        ],
      }),
      datasource: { uid: '${dsVar}', type: 'prometheus' },
    });
    new EmbeddedScene({
      $data: runner1,
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            $data: runner2,
            body: source,
          }),
        ],
      }),
    });

    runner1.activate();
    runner2.activate();
    source.activate();
    expect(getQueriesForVariables(source)).toEqual([
      { refId: 'A' },
      { refId: 'B' },
      { datasource: { uid: '${dsVar}' }, refId: 'D' },
      { datasource: { type: 'prometheus' }, refId: 'E' },
    ]);
  });
});

describe('getFuzzySearcher orders by match quality with case-sensitivity', () => {
  it('Can filter options by search query', async () => {
    const haystack = [
      'client_service_namespace',
      'namespace',
      'alert_namespace',
      'container_namespace',
      'Namespace',
      'client_k8s_namespace_name',
      'foobar',
    ];

    const searcher = getFuzzySearcher(haystack);

    expect(searcher('Names').map((i) => haystack[i])).toEqual([
      'Namespace',
      'namespace',
      'alert_namespace',
      'container_namespace',
      'client_k8s_namespace_name',
      'client_service_namespace',
    ]);
  });
});

describe('searchOptions falls back to substring matching for non-latin needles', () => {
  it('Can filter options by search query', async () => {
    const options: SelectableValue[] = [
      '台灣省',
      '台中市',
      '台北市',
      '台南市',
      '南投縣',
      '高雄市',
      '台中第一高級中學',
    ].map((v) => ({ label: v, value: v }));

    const searcher = searchOptions(options);

    expect(searcher('南', 'key').map((o) => o.label!)).toEqual(['台南市', '南投縣']);
  });
});

describe('escapeURLVariableString', () => {
  it('Should escape pipes and commas in url parameter being passed into scenes from external application', () => {
    expect(escapeURLDelimiters('')).toEqual('');
    expect(escapeURLDelimiters('((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}|(KHTML, like Gecko)')).toEqual(
      '((25[0-5]__gfp__(2[0-4]__gfp__1\\d__gfp__[1-9]__gfp__)\\d)\\.?\\b){4}__gfp__(KHTML__gfc__ like Gecko)'
    );
    expect(escapeURLDelimiters('|=')).toEqual('__gfp__=');
    expect(escapeURLDelimiters('val1,val2a|val2b')).toEqual('val1__gfc__val2a__gfp__val2b');
  });
});

interface TestObjectState extends SceneObjectState {
  datasource: DataSourceRef | null;
}

class TestObject extends SceneObjectBase<TestObjectState> {}

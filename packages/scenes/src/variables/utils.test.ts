import { DataSourceRef } from '@grafana/schema';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { getFuzzySearcher, getQueriesForVariables } from './utils';

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
      'foobar'
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

interface TestObjectState extends SceneObjectState {
  datasource: DataSourceRef | null;
}

class TestObject extends SceneObjectBase<TestObjectState> {}

import { DataSourceRef } from '@grafana/schema';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneFlexItem, SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { getQueriesForVariables } from './utils';

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

  it('should ignore queries from inactive runners', () => {
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

    expect(getQueriesForVariables(source)).toEqual([{ refId: 'A' }]);
  });
});

interface TestObjectState extends SceneObjectState {
  datasource: DataSourceRef | null;
}

class TestObject extends SceneObjectBase<TestObjectState> {}

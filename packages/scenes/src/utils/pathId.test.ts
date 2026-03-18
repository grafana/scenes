import { EmbeddedScene } from '../components/EmbeddedScene';
import { VizPanel } from '../components/VizPanel/VizPanel';
import { SceneGridItem } from '../components/layout/grid/SceneGridItem';
import { SceneGridLayout } from '../components/layout/grid/SceneGridLayout';
import { SceneGridRow } from '../components/layout/grid/SceneGridRow';
import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { LocalValueVariable } from '../variables/variants/LocalValueVariable';
import { buildPathIdFor } from './pathId';

describe('buildPathIdFor', () => {
  it('Non repeated panels inside no repeated context should simply return key', () => {
    const { panel1 } = buildTestScene();
    expect(buildPathIdFor(panel1)).toBe('panel-1');
  });

  it('should include local and parent variable value', () => {
    const { repeatedPanel } = buildTestScene();

    expect(buildPathIdFor(repeatedPanel)).toBe('US$pod1$panel-2');
  });
});

function buildTestScene() {
  const panel1 = new VizPanel({
    title: 'Panel 1',
    pluginId: 'table',
    key: 'panel-1',
  });

  const repeatedPanel = new VizPanel({
    title: 'Panel 2',
    pluginId: 'table',
    key: 'panel-2',
    $variables: new SceneVariableSet({
      variables: [new LocalValueVariable({ name: 'pod', value: 'pod1', text: 'pod1' })],
    }),
  });

  const grid = new SceneGridLayout({
    children: [
      new SceneGridItem({
        key: 'grid-item-1',
        x: 0,
        y: 0,
        width: 24,
        height: 10,
        body: panel1,
      }),
      new SceneGridRow({
        key: 'row-1',
        x: 0,
        y: 10,
        width: 24,
        height: 1,
        $variables: new SceneVariableSet({
          variables: [new LocalValueVariable({ name: 'datacenter', value: 'US', text: 'US' })],
        }),
        children: [
          new SceneGridItem({
            key: 'grid-item-2',
            x: 0,
            y: 11,
            width: 24,
            height: 5,
            body: repeatedPanel,
          }),
        ],
      }),
    ],
  });

  const scene = new EmbeddedScene({
    body: grid,
  });

  return { scene, panel1, repeatedPanel };
}

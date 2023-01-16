import { EmbeddedScene } from './EmbeddedScene';
import { SceneFlexLayout } from './layout/SceneFlexLayout';
import { SceneTimePicker } from './SceneTimePicker';

describe('Scene', () => {
  it('Simple scene', () => {
    const scene = new EmbeddedScene({
      controls: [new SceneTimePicker({})],
      body: new SceneFlexLayout({
        children: [],
      }),
    });

    // TODO make this a proper render rest
    expect(scene.state.body).toBeDefined();
  });
});

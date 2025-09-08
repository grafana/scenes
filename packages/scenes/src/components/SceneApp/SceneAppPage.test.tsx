import { SceneAppPage } from './SceneAppPage';
import { SceneCanvasText } from '../SceneCanvasText';

describe('SceneAppPage', () => {
  it('enrichDataRequest should handle standalone pages', () => {
    const page = new SceneAppPage({ title: 'Page', url: '/page', routePath: '/page' });
    const source = new SceneCanvasText({ text: 'text' });
    const result = page.enrichDataRequest(source);
    expect(result).toBe(null);
  });
});

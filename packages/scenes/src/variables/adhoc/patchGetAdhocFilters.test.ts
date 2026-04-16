import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import {
  findClosestAdHocFilterInHierarchy,
  findGlobalAdHocFilterVariableByUid,
  allActiveFilterSets,
} from './patchGetAdhocFilters';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { activateFullSceneTree } from '../../utils/test/activateFullSceneTree';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneDeactivationHandler } from '../../core/types';

describe('findClosestAdHocFilterInHierarchy', () => {
  it('should find auto-mode AdHocFiltersVariable matching datasource uid', () => {
    const filtersVar = new AdHocFiltersVariable({
      datasource: { uid: 'test-uid' },
      applyMode: 'auto',
      filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
    });

    const scene = new EmbeddedScene({
      $variables: new SceneVariableSet({ variables: [filtersVar] }),
      body: new SceneCanvasText({ text: 'hello' }),
    });

    const deactivate = activateFullSceneTree(scene);

    const body = scene.state.body as SceneCanvasText;
    const result = findClosestAdHocFilterInHierarchy('test-uid', body);

    expect(result).toBe(filtersVar);

    deactivate();
  });

  it('should skip manual-mode AdHocFiltersVariable even when datasource uid matches', () => {
    const filtersVar = new AdHocFiltersVariable({
      datasource: { uid: 'test-uid' },
      applyMode: 'manual',
      filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
    });

    const scene = new EmbeddedScene({
      $variables: new SceneVariableSet({ variables: [filtersVar] }),
      body: new SceneCanvasText({ text: 'hello' }),
    });

    const deactivate = activateFullSceneTree(scene);

    const body = scene.state.body as SceneCanvasText;
    const result = findClosestAdHocFilterInHierarchy('test-uid', body);

    expect(result).toBeUndefined();

    deactivate();
  });

  it('should find auto-mode variable when both manual and auto exist in hierarchy', () => {
    const manualVar = new AdHocFiltersVariable({
      name: 'manual',
      datasource: { uid: 'test-uid' },
      applyMode: 'manual',
      filters: [{ key: 'manual', operator: '=', value: '1', condition: '' }],
    });

    const autoVar = new AdHocFiltersVariable({
      name: 'auto',
      datasource: { uid: 'test-uid' },
      applyMode: 'auto',
      filters: [{ key: 'auto', operator: '=', value: '1', condition: '' }],
    });

    const scene = new EmbeddedScene({
      $variables: new SceneVariableSet({ variables: [manualVar, autoVar] }),
      body: new SceneCanvasText({ text: 'hello' }),
    });

    const deactivate = activateFullSceneTree(scene);

    const body = scene.state.body as SceneCanvasText;
    const result = findClosestAdHocFilterInHierarchy('test-uid', body);

    expect(result).toBe(autoVar);

    deactivate();
  });
});

describe('findGlobalAdHocFilterVariableByUid', () => {
  const deactivationHandlers: SceneDeactivationHandler[] = [];

  afterEach(() => {
    allActiveFilterSets.clear();
    deactivationHandlers.forEach((d) => d());
    deactivationHandlers.length = 0;
  });

  it('should find auto-mode variable in global set', () => {
    const filtersVar = new AdHocFiltersVariable({
      datasource: { uid: 'test-uid' },
      applyMode: 'auto',
      filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
    });

    // patchGetAdhocFilters adds to allActiveFilterSets on activation for auto mode
    allActiveFilterSets.add(filtersVar);

    const result = findGlobalAdHocFilterVariableByUid('test-uid');
    expect(result).toBe(filtersVar);
  });

  it('should skip manual-mode variable in global set', () => {
    const filtersVar = new AdHocFiltersVariable({
      datasource: { uid: 'test-uid' },
      applyMode: 'manual',
      filters: [{ key: 'A', operator: '=', value: 'B', condition: '' }],
    });

    allActiveFilterSets.add(filtersVar);

    const result = findGlobalAdHocFilterVariableByUid('test-uid');
    expect(result).toBeUndefined();
  });
});

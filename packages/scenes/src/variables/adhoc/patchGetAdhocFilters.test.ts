import { getTemplateSrv, setDataSourceSrv, setTemplateSrv } from '@grafana/runtime';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { activateFullSceneTree } from '../../utils/test/activateFullSceneTree';

interface TemplateSrvWithAdhocFilters {
  getAdhocFilters: (dsName: string) => unknown;
}

setTemplateSrv({ getAdhocFilters: jest.fn().mockReturnValue([]) } as any);
setDataSourceSrv({ getInstanceSettings: () => ({ uid: 'prom' }) } as any);

function activateVariable(variable: AdHocFiltersVariable) {
  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({ variables: [variable] }),
    body: new SceneCanvasText({ text: 'hello' }),
  });

  return activateFullSceneTree(scene);
}

function getAdhocFiltersFromTemplateSrv(dsName: string) {
  return (getTemplateSrv() as unknown as TemplateSrvWithAdhocFilters).getAdhocFilters(dsName);
}

describe('patchGetAdhocFilters', () => {
  // The patched templateSrv.getAdhocFilters is a separate application path: datasources call it
  // directly, so it never passes through DrilldownDependenciesManager and is not covered by the
  // applyMode check there. Only the constructor's `applyMode === 'auto'` guard keeps manual-mode
  // variables out of allActiveFilterSets, and therefore out of this path.
  it('does not expose filters from a manual-mode variable', () => {
    const variable = new AdHocFiltersVariable({
      datasource: { uid: 'prom' },
      applyMode: 'manual',
      filters: [{ key: 'alertname', operator: '=', value: 'Boom', condition: '' }],
    });

    const deactivate = activateVariable(variable);

    expect(getAdhocFiltersFromTemplateSrv('prom')).toEqual([]);

    deactivate();
  });

  it('exposes filters from an auto-mode variable', () => {
    const variable = new AdHocFiltersVariable({
      datasource: { uid: 'prom' },
      applyMode: 'auto',
      filters: [{ key: 'alertname', operator: '=', value: 'Boom', condition: '' }],
    });

    const deactivate = activateVariable(variable);

    expect(getAdhocFiltersFromTemplateSrv('prom')).toEqual(variable.state.filters);

    deactivate();
  });
});

import { setTemplateSrv } from '@grafana/runtime';
import { appliesAutomaticallyToDatasource } from './appliesAutomaticallyToDatasource';
import { AdHocFiltersVariable } from './adhoc/AdHocFiltersVariable';
import { GroupByVariable } from './groupby/GroupByVariable';
import { CustomVariable } from './variants/CustomVariable';
import { SceneVariableSet } from './sets/SceneVariableSet';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneCanvasText } from '../components/SceneCanvasText';
import { activateFullSceneTree } from '../utils/test/activateFullSceneTree';

// Auto-mode variables patch templateSrv.getAdhocFilters on construction and log if it is missing
setTemplateSrv({ getAdhocFilters: jest.fn().mockReturnValue([]) } as any);

function activate(...variables: Array<AdHocFiltersVariable | GroupByVariable | CustomVariable>) {
  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({ variables }),
    body: new SceneCanvasText({ text: 'hello' }),
  });

  return activateFullSceneTree(scene);
}

describe('appliesAutomaticallyToDatasource', () => {
  it('applies when the datasource matches and applyMode is auto', () => {
    const variable = new AdHocFiltersVariable({ datasource: { uid: 'prom' }, applyMode: 'auto' });
    const deactivate = activate(variable);

    expect(appliesAutomaticallyToDatasource(variable, 'prom')).toBe(true);
    expect(appliesAutomaticallyToDatasource(variable, 'loki')).toBe(false);

    deactivate();
  });

  it('does not apply when applyMode is manual, even for a matching datasource', () => {
    const filters = new AdHocFiltersVariable({ datasource: { uid: 'prom' }, applyMode: 'manual' });
    const groupBy = new GroupByVariable({ datasource: { uid: 'prom' }, applyMode: 'manual' });
    const deactivate = activate(filters, groupBy);

    expect(appliesAutomaticallyToDatasource(filters, 'prom')).toBe(false);
    expect(appliesAutomaticallyToDatasource(groupBy, 'prom')).toBe(false);

    deactivate();
  });

  it('interpolates the datasource UID so datasource variables resolve', () => {
    const dsVar = new CustomVariable({ name: 'ds', query: 'prom,loki', value: 'prom', text: 'prom' });
    const variable = new AdHocFiltersVariable({ datasource: { uid: '$ds' }, applyMode: 'auto' });
    const deactivate = activate(dsVar, variable);

    expect(appliesAutomaticallyToDatasource(variable, 'prom')).toBe(true);
    expect(appliesAutomaticallyToDatasource(variable, 'loki')).toBe(false);

    deactivate();
  });
});

import { getDataSourceInstanceSettings } from '@grafana/plugin-compat/datasources';
import { getTemplateSrv, setTemplateSrv } from '@grafana/runtime';
import { AdHocFiltersVariable } from './AdHocFiltersVariable';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { EmbeddedScene } from '../../components/EmbeddedScene';
import { SceneCanvasText } from '../../components/SceneCanvasText';
import { activateFullSceneTree } from '../../utils/test/activateFullSceneTree';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  ...jest.requireActual('@grafana/plugin-compat/datasources'),
  getDataSourceInstanceSettings: jest.fn(),
}));

const getDataSourceInstanceSettingsMock = jest.mocked(getDataSourceInstanceSettings);
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

interface TemplateSrvWithAdhocFilters {
  getAdhocFilters: (dsName?: string) => unknown;
}

const originalGetAdhocFilters = jest.fn().mockReturnValue([]);
setTemplateSrv({ getAdhocFilters: originalGetAdhocFilters } as any);

function activateVariable(variable: AdHocFiltersVariable) {
  const scene = new EmbeddedScene({
    $variables: new SceneVariableSet({ variables: [variable] }),
    body: new SceneCanvasText({ text: 'hello' }),
  });

  return activateFullSceneTree(scene);
}

function getAdhocFiltersFromTemplateSrv(dsName?: string) {
  return (getTemplateSrv() as unknown as TemplateSrvWithAdhocFilters).getAdhocFilters(dsName);
}

describe('patchGetAdhocFilters', () => {
  beforeEach(() => {
    originalGetAdhocFilters.mockClear();
    getDataSourceInstanceSettingsMock.mockReset();
    getDataSourceInstanceSettingsMock.mockResolvedValue(undefined);
  });

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

  describe('when called with a data source reference', () => {
    const filters = [{ key: 'alertname', operator: '=', value: 'Boom', condition: '' }];

    function activateAutoVariable(uid: string) {
      return activateVariable(new AdHocFiltersVariable({ datasource: { uid }, applyMode: 'auto', filters }));
    }

    it('matches the uid of the variable data source without resolving anything', () => {
      const deactivate = activateAutoVariable('prom');

      expect(getAdhocFiltersFromTemplateSrv('prom')).toEqual(filters);
      expect(originalGetAdhocFilters).not.toHaveBeenCalled();

      deactivate();
    });

    it('matches the name of the variable data source once it is resolved', async () => {
      getDataSourceInstanceSettingsMock.mockResolvedValue({ uid: 'prom', name: 'Prometheus', isDefault: false } as any);
      const deactivate = activateAutoVariable('prom');
      await flushPromises();

      expect(getAdhocFiltersFromTemplateSrv('Prometheus')).toEqual(filters);
      expect(originalGetAdhocFilters).not.toHaveBeenCalled();

      deactivate();
    });

    it.each([['default'], ['']])('matches "%s" when the variable data source is the default one', async (dsName) => {
      getDataSourceInstanceSettingsMock.mockResolvedValue({ uid: 'prom', name: 'Prometheus', isDefault: true } as any);
      const deactivate = activateAutoVariable('prom');
      await flushPromises();

      expect(getAdhocFiltersFromTemplateSrv(dsName)).toEqual(filters);

      deactivate();
    });

    it('does not match "default" when the variable data source is not the default one', async () => {
      getDataSourceInstanceSettingsMock.mockResolvedValue({ uid: 'prom', name: 'Prometheus', isDefault: false } as any);
      const deactivate = activateAutoVariable('prom');
      await flushPromises();

      expect(getAdhocFiltersFromTemplateSrv('default')).toEqual([]);
      expect(originalGetAdhocFilters).toHaveBeenCalledWith('default');

      deactivate();
    });

    it('falls back to the original getAdhocFilters when no variable matches', async () => {
      const legacyFilters = [{ key: 'legacy', operator: '=', value: '1', condition: '' }];
      originalGetAdhocFilters.mockReturnValueOnce(legacyFilters);
      getDataSourceInstanceSettingsMock.mockResolvedValue({ uid: 'prom', name: 'Prometheus', isDefault: false } as any);
      const deactivate = activateAutoVariable('prom');
      await flushPromises();

      expect(getAdhocFiltersFromTemplateSrv('Loki')).toEqual(legacyFilters);
      expect(originalGetAdhocFilters).toHaveBeenCalledWith('Loki');

      deactivate();
    });

    it('falls back to the original getAdhocFilters for a name until the data source is resolved', async () => {
      getDataSourceInstanceSettingsMock.mockResolvedValue({ uid: 'prom', name: 'Prometheus', isDefault: false } as any);
      const deactivate = activateAutoVariable('prom');

      getAdhocFiltersFromTemplateSrv('Prometheus');
      expect(originalGetAdhocFilters).toHaveBeenCalledWith('Prometheus');

      await flushPromises();
      originalGetAdhocFilters.mockClear();

      expect(getAdhocFiltersFromTemplateSrv('Prometheus')).toEqual(filters);
      expect(originalGetAdhocFilters).not.toHaveBeenCalled();

      deactivate();
    });

    it('does not match an empty name for a variable without a data source', () => {
      const deactivate = activateVariable(new AdHocFiltersVariable({ applyMode: 'auto', filters }));

      expect(getAdhocFiltersFromTemplateSrv()).toEqual([]);
      expect(originalGetAdhocFilters).toHaveBeenCalled();

      deactivate();
    });

    it('matches the new data source by name after the variable data source changed', async () => {
      const settingsByUid: Record<string, unknown> = {
        prom: { uid: 'prom', name: 'Prometheus', isDefault: false },
        loki: { uid: 'loki', name: 'Loki', isDefault: false },
      };
      getDataSourceInstanceSettingsMock.mockImplementation(
        async (ref) => settingsByUid[(ref as { uid: string }).uid] as any
      );
      const variable = new AdHocFiltersVariable({ datasource: { uid: 'prom' }, applyMode: 'auto', filters });
      const deactivate = activateVariable(variable);
      await flushPromises();

      variable.setState({ datasource: { uid: 'loki' } });

      expect(getAdhocFiltersFromTemplateSrv('Prometheus')).toEqual([]);

      await flushPromises();
      originalGetAdhocFilters.mockClear();

      expect(getAdhocFiltersFromTemplateSrv('Loki')).toEqual(filters);
      expect(originalGetAdhocFilters).not.toHaveBeenCalled();

      deactivate();
    });

    it('matches a name when the variable data source uid is a template variable', async () => {
      getDataSourceInstanceSettingsMock.mockResolvedValue({ uid: 'prom', name: 'Prometheus', isDefault: false } as any);
      const deactivate = activateAutoVariable('${ds}');
      await flushPromises();

      expect(getAdhocFiltersFromTemplateSrv('Prometheus')).toEqual(filters);

      deactivate();
    });

    it('keeps matching by uid when resolving the data source fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      getDataSourceInstanceSettingsMock.mockRejectedValue(new Error('boom'));
      const deactivate = activateAutoVariable('prom');
      await flushPromises();

      expect(getAdhocFiltersFromTemplateSrv('prom')).toEqual(filters);

      consoleError.mockRestore();
      deactivate();
    });
  });
});

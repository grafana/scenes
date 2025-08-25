import {
  FieldConfigProperty,
  FieldType,
  LoadingState,
  PanelPlugin,
  getDefaultTimeRange,
  standardEditorsRegistry,
  standardFieldConfigEditorRegistry,
  toDataFrame,
  PanelPluginDataSupport,
  AlertState,
  PanelData,
  PanelProps,
  toUtc,
  DataTransformerConfig,
} from '@grafana/data';
import * as grafanaData from '@grafana/data';
import { getPanelPlugin } from '../../../utils/test/__mocks__/pluginMocks';

import { VizPanel, VizPanelState } from './VizPanel';
import { SceneDataNode } from '../../core/SceneDataNode';
import { SeriesVisibilityChangeMode } from '@grafana/ui';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { act, render, screen } from '@testing-library/react';
import { RefreshEvent } from '@grafana/runtime';
import { VizPanelMenu } from './VizPanelMenu';
import { SceneDataTransformer } from '../../querying/SceneDataTransformer';
import { EmptyDataNode } from '../../variables/interpolation/defaults';
import { mockTransformationsRegistry } from '../../utils/mockTransformationsRegistry';
import { SceneQueryRunner } from '../../querying/SceneQueryRunner';

let pluginToLoad: PanelPlugin | undefined;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getPluginImportUtils: () => ({
    getPanelPluginFromCache: jest.fn(() => pluginToLoad),
  }),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 500, height: 500 }],
}));

interface OptionsPlugin1 {
  showThresholds: boolean;
  option2?: string;
  sortBy?: string[];
}

interface FieldConfigPlugin1 {
  customProp?: boolean;
  customProp2?: boolean;
  customProp3?: string;
  junkProp?: boolean;
}

let panelProps: PanelProps | undefined;
let panelRenderCount = 0;

function getTestPlugin1(dataSupport?: PanelPluginDataSupport) {
  let pluginToLoad = getPanelPlugin(
    {
      id: 'custom-plugin-id',
    },
    (props) => {
      panelProps = props;
      panelRenderCount++;
      return <div>My custom panel</div>;
    }
  );

  pluginToLoad.meta.info.version = '1.0.0';
  pluginToLoad.meta.skipDataQuery = false;

  if (dataSupport) {
    pluginToLoad.setDataSupport(dataSupport);
  }

  pluginToLoad.setPanelOptions((builder) => {
    builder.addBooleanSwitch({
      name: 'Show thresholds',
      path: 'showThresholds',
      defaultValue: true,
    });
    builder.addTextInput({
      name: 'option2',
      path: 'option2',
      defaultValue: undefined,
    });
  });

  pluginToLoad.useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Unit]: {
        defaultValue: 'flop',
      },
      [FieldConfigProperty.Decimals]: {
        defaultValue: 2,
      },
    },
    useCustomConfig: (builder) => {
      builder.addBooleanSwitch({
        name: 'CustomProp',
        path: 'customProp',
        defaultValue: false,
      });
      builder.addBooleanSwitch({
        name: 'customProp2',
        path: 'customProp2',
        defaultValue: false,
      });
      builder.addTextInput({
        name: 'customProp3',
        path: 'customProp3',
      });
      builder.addTextInput({
        name: 'Hide from',
        path: 'hideFrom',
      });
    },
  });

  pluginToLoad.setMigrationHandler((panel) => {
    if (panel.fieldConfig.defaults.custom) {
      panel.fieldConfig.defaults.custom.customProp2 = true;
    }

    return { option2: 'hello' };
  });

  return pluginToLoad;
}

function getTestPlugin2(dataSupport?: PanelPluginDataSupport) {
  let pluginToLoad = getPanelPlugin(
    {
      id: 'custom2-plugin-id',
    },
    (props) => {
      panelProps = props;
      panelRenderCount++;
      return <div>My custom2 panel</div>;
    }
  );

  pluginToLoad.meta.info.version = '2.0.0';
  pluginToLoad.meta.skipDataQuery = false;

  if (dataSupport) {
    pluginToLoad.setDataSupport(dataSupport);
  }

  pluginToLoad.setPanelOptions((builder) => {
    builder.addBooleanSwitch({
      name: 'Show thresholds',
      path: 'showThresholds',
      defaultValue: false,
    });
    builder.addTextInput({
      name: 'option2',
      path: 'option2',
      defaultValue: undefined,
    });
  });

  pluginToLoad.useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Unit]: {
        defaultValue: 'flop',
      },
      [FieldConfigProperty.Decimals]: {
        defaultValue: 2,
      },
    },
    useCustomConfig: (builder) => {
      builder.addBooleanSwitch({
        name: 'CustomPropInOtherPlugin',
        path: 'customPropInOtherPlugin',
        defaultValue: false,
      });
      builder.addBooleanSwitch({
        name: 'customProp2InOtherPlugin',
        path: 'customProp2InOtherPlugin',
        defaultValue: false,
      });
      builder.addTextInput({
        name: 'customProp3',
        path: 'customProp3',
      });
      builder.addTextInput({
        name: 'Hide from',
        path: 'hideFrom',
      });
    },
  });

  return pluginToLoad;
}

function getTestPlugin3(transformations: DataTransformerConfig[] | undefined) {
  let pluginToLoad = getPanelPlugin(
    {
      id: 'custom3-plugin-id',
    },
    (props) => {
      panelProps = props;
      panelRenderCount++;
      return <div>My custom3 panel</div>;
    }
  );

  pluginToLoad.meta.info.version = '3.0.0';
  pluginToLoad.meta.skipDataQuery = false;

  pluginToLoad.setPanelChangeHandler((panel) => {
    if (transformations) {
      panel.transformations = transformations;
    }

    return {};
  });

  return pluginToLoad;
}

describe('VizPanel', () => {
  beforeAll(() => {
    standardEditorsRegistry.setInit(() => {
      return [
        {
          id: 'boolean',
          name: 'Boolean',
          editor: () => <div>Boolean</div>,
        },
        {
          id: 'text',
          name: 'Text',
          editor: () => <div>Text</div>,
        },
      ];
    });

    standardFieldConfigEditorRegistry.setInit(() => {
      return [
        {
          id: 'unit',
          path: 'unit',
          name: 'Unit',
          description: 'Value units',
          editor: () => null,
          override: () => null,
          process: (value) => value,
          shouldApply: () => true,
        },
        {
          id: 'decimals',
          path: 'decimals',
          name: 'Decimals',
          description: 'Number of decimal to be shown for a value',
          editor: () => null,
          override: () => null,
          process: (value) => value,
          shouldApply: () => true,
        },
        {
          id: 'color',
          path: 'color',
          name: 'Color',
          description: 'Color of the series',
          editor: () => null,
          override: () => null,
          process: (value) => value,
          shouldApply: () => true,
        },
      ];
    });
  });

  describe('when activated', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeAll(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        fieldConfig: {
          defaults: { custom: { junkProp: true } },
          overrides: [],
        },
      });

      pluginToLoad = getTestPlugin1();
      panel.activate();
    });

    it('load plugin', () => {
      expect(panel.getPlugin()).toBe(pluginToLoad);
    });

    it('should call panel migration handler', () => {
      expect(panel.state.options.option2).toEqual('hello');
      expect(panel.state.fieldConfig.defaults.custom?.customProp2).toEqual(true);
    });

    it('should apply option defaults', () => {
      expect(panel.state.options.showThresholds).toEqual(true);
    });

    it('should apply fieldConfig defaults', () => {
      expect(panel.state.fieldConfig.defaults.unit).toBe('flop');
      expect(panel.state.fieldConfig.defaults.custom!.customProp).toBe(false);
    });

    it('should should remove props that are not defined for plugin', () => {
      expect(panel.state.fieldConfig.defaults.custom?.junkProp).toEqual(undefined);
    });
  });

  describe('When changing plugin', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeEach(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        fieldConfig: {
          defaults: { custom: { customProp: true } },
          overrides: [],
        },
      });

      pluginToLoad = getTestPlugin1();
      panel.activate();
    });

    it('Should successfully change from one viz type to another', async () => {
      expect(panel.state.pluginId).toBe('custom-plugin-id');
      expect(panel.state.pluginVersion).toBe('1.0.0');
      pluginToLoad = getTestPlugin2();
      await panel.changePluginType('custom2-plugin-id', undefined, panel.state.fieldConfig);

      expect(panel.state.pluginId).toBe('custom2-plugin-id');
      expect(panel.state.pluginVersion).toBe('2.0.0');
    });

    it('Should change to new plugin with default options/fieldconfig', async () => {
      expect(panel.state.fieldConfig.defaults.custom).toHaveProperty('customProp');
      expect(panel.state.fieldConfig.defaults.custom).toHaveProperty('customProp2');
      expect(panel.state.options.showThresholds).toBe(true);

      pluginToLoad = getTestPlugin2();
      await panel.changePluginType('custom2-plugin-id');

      expect(Object.keys(panel.state.fieldConfig.defaults.custom!).length).toBe(2);
      expect(panel.state.fieldConfig.defaults.custom).toHaveProperty('customPropInOtherPlugin');
      expect(panel.state.fieldConfig.defaults.custom).toHaveProperty('customProp2InOtherPlugin');
      expect(panel.state.options.showThresholds).toBe(false);
    });

    it('Should overwrite options/fieldConfig when they exist', async () => {
      const overwriteOptions = {
        showThresholds: true,
      };

      const overwriteFieldConfig = panel.state.fieldConfig;
      overwriteFieldConfig.defaults.unit = 'test';

      pluginToLoad = getTestPlugin2();
      await panel.changePluginType('custom2-plugin-id', overwriteOptions, overwriteFieldConfig);

      expect(panel.state.options.showThresholds).toBe(true);
      expect(panel.state.fieldConfig.defaults.unit).toBe('test');
      expect(panel.state.fieldConfig.defaults.decimals).toBe(2);
      expect(panel.state.fieldConfig.defaults.custom).toHaveProperty('customPropInOtherPlugin');
    });

    it('Should set options from plugins onPanelTypeChanged', async () => {
      const overwriteOptions = {
        showThresholds: true,
      };

      const overwriteFieldConfig = panel.state.fieldConfig;
      overwriteFieldConfig.defaults.unit = 'test';

      pluginToLoad = getTestPlugin2();
      pluginToLoad.onPanelTypeChanged = () => {
        return { showThresholds: true, option2: 'hello' };
      };
      await panel.changePluginType('custom2-plugin-id', overwriteOptions, overwriteFieldConfig);

      expect(panel.state.options.showThresholds).toBe(true);
      expect(panel.state.options.option2).toBe('hello');
    });
  });

  describe('getLegacyPanelId', () => {
    it('should return panel id', () => {
      const panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        key: 'panel-12',
      });

      expect(panel.getLegacyPanelId()).toBe(12);
    });

    it('should return panel id for a panel in a clone chain', () => {
      const panels = [
        new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          key: 'panel-clone-0/panel-12-clone-1',
        }),
        new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          key: 'panel-12-clone-1',
        }),
        new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          key: 'panel-clone-0/grid-item-5/panel-12-clone-1',
        }),
        new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          key: 'panel-12-clone-0',
        }),
        new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          key: 'panel-12-clone-12',
        }),
      ];

      panels.forEach((panel) => {
        expect(panel.getLegacyPanelId()).toBe(12);
      });
    });
  });

  describe('clone', () => {
    it('Clone should ignore instanceState', () => {
      const panel = new VizPanel({ key: 'panel-12' });
      const instanceState = { prop: 'hello' };

      panel.getPanelContext().onInstanceStateChange!(instanceState);

      const clone = panel.clone();
      expect(clone.state._pluginInstanceState).toBeUndefined();
    });
  });

  describe('updating options', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeEach(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        fieldConfig: {
          defaults: { custom: { junkProp: true } },
          overrides: [],
        },
      });

      pluginToLoad = getTestPlugin1();
      panel.activate();
    });

    test('should update partial options by merging with existing', () => {
      panel.onOptionsChange({
        option2: 'updated option',
      });

      expect(panel.state.options.showThresholds).toBe(true);
      expect(panel.state.options.option2).toBe('updated option');
    });

    test('should update partial options values to undefined value', () => {
      panel.onOptionsChange({
        option2: 'updated option',
      });
      panel.onOptionsChange({
        option2: undefined,
      });

      expect(panel.state.options.showThresholds).toBe(true);
      expect(panel.state.options.option2).toBe(undefined);
    });

    test('should always allow overriding array values', () => {
      panel.onOptionsChange({ sortBy: ['asc'] });
      expect(panel.state.options.sortBy).toEqual(['asc']);

      panel.onOptionsChange({ sortBy: ['desc'] });
      expect(panel.state.options.sortBy).toEqual(['desc']);

      panel.onOptionsChange({ sortBy: [] });
      expect(panel.state.options.sortBy).toEqual([]);
    });

    test('should update partial options without merging', () => {
      panel.onOptionsChange({
        option2: 'updated option',
      });

      expect(panel.state.options.showThresholds).toBe(true);
      expect(panel.state.options.option2).toBe('updated option');

      panel.onOptionsChange({
        showThresholds: false,
      });

      expect(panel.state.options.showThresholds).toBe(false);
      expect(panel.state.options.option2).toBe('updated option');

      panel.onOptionsChange(
        {
          showThresholds: false,
        },
        true
      );

      expect(panel.state.options.showThresholds).toBe(false);
      expect(panel.state.options.option2).not.toBeDefined();
    });

    test('should allow to call getPanelOptionsWithDefaults to compute new color options for plugin', () => {
      const spy = jest.spyOn(grafanaData, 'getPanelOptionsWithDefaults');
      pluginToLoad = getTestPlugin1();
      panel.activate();

      panel.onOptionsChange({}, false, true);

      expect(spy).toHaveBeenCalledTimes(1);
      // Marked as after plugin change to readjust to prefered field color setting
      expect(spy.mock.calls[0][0].isAfterPluginChange).toBe(true);
    });
  });

  describe('updating field config', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeEach(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        fieldConfig: {
          defaults: { custom: { junkProp: true } },
          overrides: [],
        },
        $data: getDataNodeWithTestData(),
      });

      pluginToLoad = getTestPlugin1();
      panel.activate();
    });

    test('should update partial field config by merging with existing', () => {
      panel.onFieldConfigChange({
        defaults: {
          unit: 'new unit',
          custom: {
            customProp2: true,
          },
        },
        overrides: [],
      });

      expect(panel.state.fieldConfig.defaults.unit).toBe('new unit');
      expect(panel.state.fieldConfig.defaults.custom?.customProp).toBe(false);
      expect(panel.state.fieldConfig.defaults.custom?.customProp2).toBe(true);
    });

    test('should update partial field config without merging', () => {
      // Updating field config
      panel.onFieldConfigChange({
        defaults: {
          unit: 'new unit',
          custom: {
            customProp2: true,
            customProp3: 'this will be removed after update',
          },
        },
        overrides: [],
      });

      expect(panel.state.fieldConfig.defaults.unit).toBe('new unit');
      expect(panel.state.fieldConfig.defaults.custom?.customProp).toBe(false);
      expect(panel.state.fieldConfig.defaults.custom?.customProp2).toBe(true);
      expect(panel.state.fieldConfig.defaults.custom?.customProp3).toBe('this will be removed after update');

      // Updating field config again but this time requesting replace
      panel.onFieldConfigChange(
        {
          defaults: {
            decimals: 10,
            custom: {
              customProp: false,
            },
          },
          overrides: [],
        },
        true
      );

      expect(panel.state.fieldConfig.defaults.unit).toBe('flop'); // restored to default
      expect(panel.state.fieldConfig.defaults.decimals).toBe(10);
      expect(panel.state.fieldConfig.defaults.custom?.customProp).toBe(false);
      expect(panel.state.fieldConfig.defaults.custom?.customProp2).toBe(false); // restored to default
      expect(panel.state.fieldConfig.defaults.custom?.customProp3).toBe(undefined); // restored to default
    });

    test('Can toggle visibility on an off', () => {
      panel.applyFieldConfig(panel.state.$data?.state.data);
      panel.getPanelContext().onToggleSeriesVisibility!('B', SeriesVisibilityChangeMode.ToggleSelection);
      panel.applyFieldConfig(panel.state.$data?.state.data);
      expect(panel.state.fieldConfig.overrides.length).toBe(1);
      panel.getPanelContext().onToggleSeriesVisibility!('B', SeriesVisibilityChangeMode.ToggleSelection);
      expect(panel.state.fieldConfig.overrides.length).toBe(0);
    });
  });

  describe('When calling on onPanelMigration', () => {
    const onPanelMigration = jest.fn();
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeAll(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1();
      pluginToLoad.onPanelMigration = onPanelMigration;
      panel.activate();
    });

    it('should call onPanelMigration with pluginVersion set to initial state (undefined)', () => {
      expect(onPanelMigration.mock.calls[0][0].pluginVersion).toBe(undefined);
    });
  });

  describe('When onPanelMigration returns a Promise', () => {
    const onPanelMigration = jest.fn().mockResolvedValue({ option2: 'hello from migration' });
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeAll(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1();
      pluginToLoad.onPanelMigration = onPanelMigration;
      panel.activate();
    });

    it('should stil apply migrated options', () => {
      expect(panel.state.options.option2).toBe('hello from migration');
    });
  });

  describe('Migration with shouldMigrate functionality', () => {
    let onPanelMigration: jest.Mock;
    let shouldMigrate: jest.Mock;
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeEach(() => {
      onPanelMigration = jest.fn().mockReturnValue({ option2: 'migration option' });
      shouldMigrate = jest.fn();
    });

    it('should call migration when shouldMigrate returns true even with same plugin version', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        pluginVersion: '1.0.0',
      });

      pluginToLoad = getTestPlugin1();
      pluginToLoad.onPanelMigration = onPanelMigration;
      // @ts-expect-error
      pluginToLoad.shouldMigrate = shouldMigrate.mockReturnValue(true);

      await panel.activate();

      expect(onPanelMigration).toHaveBeenCalled();
      expect(shouldMigrate).toHaveBeenCalled();
      expect(panel.state.options.option2).toBe('migration option');
    });

    it('should run migration due to version change without calling shouldMigrate', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        pluginVersion: '0.9.0',
      });

      pluginToLoad = getTestPlugin1();
      pluginToLoad.onPanelMigration = onPanelMigration;
      // @ts-expect-error
      pluginToLoad.shouldMigrate = shouldMigrate.mockReturnValue(false);

      await panel.activate();

      expect(onPanelMigration).toHaveBeenCalled();
      expect(shouldMigrate).not.toHaveBeenCalled();
      expect(panel.state.options.option2).toBe('migration option');
    });

    it('should not call migration when shouldMigrate returns false with same plugin version', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        pluginVersion: '1.0.0',
      });

      pluginToLoad = getTestPlugin1();
      pluginToLoad.onPanelMigration = onPanelMigration;
      // @ts-expect-error
      pluginToLoad.shouldMigrate = shouldMigrate.mockReturnValue(false);

      await panel.activate();

      expect(shouldMigrate).toHaveBeenCalled();
      expect(onPanelMigration).not.toHaveBeenCalled();
      expect(panel.state.options.option2).toBeUndefined();
    });

    it('should work with existing migration when shouldMigrate is undefined', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        pluginVersion: '0.9.0',
      });

      pluginToLoad = getTestPlugin1();
      pluginToLoad.onPanelMigration = onPanelMigration;

      await panel.activate();

      expect(onPanelMigration).toHaveBeenCalled();
      expect(panel.state.options.option2).toBe('migration option');
    });
  });

  describe('Should provide a panel context', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeAll(async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1();
      panel.activate();
    });

    it('Should have a panel context', () => {
      expect(panel.getPanelContext()).toBeDefined();
    });

    it('Can change series color', () => {
      panel.getPanelContext().onSeriesColorChange?.('A', 'red');
      expect(panel.state.fieldConfig.overrides[0]).toEqual({
        matcher: { id: 'byName', options: 'A' },
        properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }],
      });
    });
  });

  describe('Data support', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    it('apply field config should return same data if called multiple times with same data', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1();
      panel.activate();
      await Promise.resolve();

      const data = getTestData();
      const dataWithFieldConfig1 = panel.applyFieldConfig(data);
      const dataWithFieldConfig2 = panel.applyFieldConfig(data);
      expect(dataWithFieldConfig1).toBe(dataWithFieldConfig2);
    });

    it('apply field config should return data with latest field config', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1();
      panel.activate();
      await Promise.resolve();

      const data = getTestData();
      const dataWithFieldConfig1 = panel.applyFieldConfig(data);
      expect(dataWithFieldConfig1.structureRev).toBe(1);

      panel.onFieldConfigChange({ defaults: { unit: 'ms' }, overrides: [] });

      const dataWithFieldConfig2 = panel.applyFieldConfig(data);
      expect(dataWithFieldConfig2).not.toBe(dataWithFieldConfig1);
      expect(dataWithFieldConfig2.structureRev).toBe(2);
    });

    it('should not provide alert states and annotations by default', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1();
      panel.activate();
      await Promise.resolve();

      const dataToRender = panel.applyFieldConfig(getTestData());
      expect(dataToRender.alertState).toBe(undefined);
      expect(dataToRender.annotations).toBe(undefined);
    });

    it('should provide alert states if plugin supports alert states topic', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1({ alertStates: true, annotations: false });
      panel.activate();
      await Promise.resolve();

      const testData = getTestData();
      const dataToRender = panel.applyFieldConfig(testData);
      expect(dataToRender.alertState).toBe(testData.alertState);
      expect(dataToRender.annotations).toBe(undefined);
    });

    it('should provide annotations if plugin supports annotations topic', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1({ alertStates: false, annotations: true });
      panel.activate();
      await Promise.resolve();

      const testData = getTestData();
      const dataToRender = panel.applyFieldConfig(testData);
      expect(dataToRender.alertState).toBe(undefined);
      expect(dataToRender.annotations).toBeDefined();
    });

    it('should provide alert states and annotations if plugin supports these topics', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({ pluginId: 'custom-plugin-id' });
      pluginToLoad = getTestPlugin1({ alertStates: true, annotations: true });
      panel.activate();
      await Promise.resolve();

      const testData = getTestData();
      const dataToRender = panel.applyFieldConfig(testData);
      expect(dataToRender.alertState).toBe(testData.alertState);
      expect(dataToRender.annotations).toBeDefined();
    });

    it('should not add fieldConfig to annotations, and keep annotations config', async () => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom-plugin-id',
        fieldConfig: {
          defaults: {
            links: [
              {
                title: 'some link',
                url: 'some-valid-url',
              },
            ],
          },
          overrides: [],
        },
      });
      pluginToLoad = getTestPlugin1({ alertStates: true, annotations: true });
      panel.activate();
      await Promise.resolve();

      const testData = getTestData();
      const dataToRender = panel.applyFieldConfig(testData);
      expect(
        dataToRender.annotations?.every((annotation) =>
          annotation.fields.every(
            (field) => field.config.links === undefined || field.config.links.at(0)?.title === 'some annotation link'
          )
        )
      ).toBe(true);
    });
  });

  describe('VizPanel panel rendering ', () => {
    beforeEach(() => {
      panelRenderCount = 0;
      panelProps = undefined;

      global.ResizeObserver = class {
        // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
        observe() {}
        // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
        unobserve() {}
        // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
        disconnect() {}
      };
    });

    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    describe('data plugin', () => {
      it('Should re-render when there is new data', async () => {
        const data = getDataNodeWithTestData();
        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          pluginId: 'custom-plugin-id',
          $timeRange: new SceneTimeRange(),
          $data: data,
        });

        pluginToLoad = getTestPlugin1();

        render(<panel.Component model={panel} />);

        expect(await screen.findByText('My custom panel')).toBeInTheDocument();

        expect(panelRenderCount).toBe(1);

        act(() => {
          data.setState({
            data: {
              ...data.state.data,
              state: LoadingState.Loading,
              timeRange: {
                from: toUtc('2022-01-01'),
                to: toUtc('2022-01-02'),
                raw: { from: toUtc('2022-01-01'), to: toUtc('2022-01-02') },
              },
            },
          });
        });

        expect(panelRenderCount).toBe(2);
        expect(panelProps?.data.state).toBe(LoadingState.Loading);
        // Verify panel props time range comes from data time range
        expect(panelProps?.timeRange.from.toISOString()).toEqual('2022-01-01T00:00:00.000Z');
        expect(panelProps?.data.timeRange.from.toISOString()).toEqual('2022-01-01T00:00:00.000Z');
      });
    });

    describe('Non data plugin', () => {
      it('When time range change should re-render with new time range', async () => {
        const timeRange = new SceneTimeRange();
        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          pluginId: 'custom-plugin-id',
          $timeRange: timeRange,
        });

        pluginToLoad = getTestPlugin1();
        pluginToLoad.meta.skipDataQuery = true;

        render(<panel.Component model={panel} />);

        expect(await screen.findByText('My custom panel')).toBeInTheDocument();

        expect(panelRenderCount).toBe(1);
        expect(panelProps?.timeRange.raw.from).toBe('now-6h');

        act(() => {
          timeRange.onTimeRangeChange({
            from: toUtc('2020-01-01'),
            to: toUtc('2020-01-02'),
            raw: { from: toUtc('2020-01-01'), to: toUtc('2020-01-02') },
          });
        });

        expect(panelRenderCount).toBe(2);
        expect(panelProps?.timeRange.from.toISOString()).toEqual('2020-01-01T00:00:00.000Z');
      });

      it('When refreshing should re-render and receive RefreshEvent', async () => {
        const refreshEventHandler = jest.fn();
        const timeRange = new SceneTimeRange();

        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          pluginId: 'custom-plugin-id',
          $timeRange: timeRange,
        });

        pluginToLoad = getTestPlugin1();
        pluginToLoad.meta.skipDataQuery = true;

        panelProps?.eventBus.subscribe(RefreshEvent, refreshEventHandler);

        render(<panel.Component model={panel} />);

        expect(await screen.findByText('My custom panel')).toBeInTheDocument();

        expect(panelRenderCount).toBe(1);
        expect(panelProps?.timeRange.raw.from).toBe('now-6h');

        act(() => {
          timeRange.onRefresh();
        });

        expect(panelRenderCount).toBe(2);
      });
    });
  });

  describe('Menu visibility functionality', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    describe('collapsible false and showMenuAlways true', () => {
      beforeEach(async () => {
        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          title: 'Menu Panel',
          pluginId: 'custom-plugin-id',
          collapsible: false,
          showMenuAlways: true,
          menu: new VizPanelMenu({}),
          $data: getDataNodeWithTestData(),
        });

        pluginToLoad = getTestPlugin1();
        panel.activate();
      });

      it('should showMenuAlways when panel is not collapsible', async () => {
        expect(panel.state.showMenuAlways).toBe(true);
        render(<panel.Component model={panel} />);

        // The menu should be visible despite collapsible being false
        const menuButton = screen.queryByRole('button', { name: /menu/i });
        expect(menuButton).toBeInTheDocument();
      });
    });

    describe('collapsible true and showMenuAlways true', () => {
      beforeEach(async () => {
        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          title: 'Menu Panel',
          pluginId: 'custom-plugin-id',
          collapsible: true,
          showMenuAlways: true,
          menu: new VizPanelMenu({}),
          $data: getDataNodeWithTestData(),
        });

        pluginToLoad = getTestPlugin1();
        panel.activate();
      });

      it('should show showMenuAlways when panel is collapsible', async () => {
        expect(panel.state.showMenuAlways).toBe(true);
        render(<panel.Component model={panel} />);
        // The menu should be visible because both collapsible and showMenuAlways are true
        // Query for all menu buttons and select the first one
        const menuButtons = screen.queryAllByRole('button', { name: /menu/i });
        const firstMenuButton = menuButtons[0]; // Get the first element
        // Check if the first menu button is in the document
        expect(firstMenuButton).toBeInTheDocument();
      });
    });

    describe('showMenuAlways true', () => {
      beforeEach(async () => {
        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          title: 'Menu Panel',
          pluginId: 'custom-plugin-id',
          showMenuAlways: true,
          menu: new VizPanelMenu({}),
          $data: getDataNodeWithTestData(),
        });

        pluginToLoad = getTestPlugin1();
        panel.activate();
      });

      it('should showMenuAlways when panel is not collapsible', async () => {
        expect(panel.state.showMenuAlways).toBe(true);
        render(<panel.Component model={panel} />);

        // The menu should be visible despite collapsible being false
        const menuButton = screen.queryByRole('button', { name: /menu/i });
        expect(menuButton).toBeInTheDocument();
      });
    });

    describe('showMenuAlways false', () => {
      beforeEach(async () => {
        panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
          title: 'Menu Panel',
          pluginId: 'custom-plugin-id',
          showMenuAlways: false,
          menu: new VizPanelMenu({}),
          $data: getDataNodeWithTestData(),
        });

        pluginToLoad = getTestPlugin1();
        panel.activate();
      });

      it('should not showMenuAlways', async () => {
        expect(panel.state.showMenuAlways).toBe(false);
        render(<panel.Component model={panel} />);

        const menuButton = screen.queryByRole('button', { name: /menu/i });
        expect(menuButton).toHaveClass('show-on-hover');
      });
    });
  });

  describe('_UNSAFE_customMigrationHandler', () => {
    let panel: VizPanel<OptionsPlugin1, FieldConfigPlugin1>;

    beforeAll(() => {
      mockTransformationsRegistry([
        {
          id: 'transformation1',
          name: 'transformation1',
          operator: () => (source) => source,
        },
        {
          id: 'transformation2',
          name: 'transformation2',
          operator: () => (source) => source,
        },
        {
          id: 'transformation3',
          name: 'transformation3',
          operator: () => (source) => source,
        },
      ]);
    });

    const preparePanel = async (
      $data: VizPanelState['$data'],
      transformations: DataTransformerConfig[] | undefined
    ) => {
      panel = new VizPanel<OptionsPlugin1, FieldConfigPlugin1>({
        pluginId: 'custom3-plugin-id',
        $data,
        _UNSAFE_customMigrationHandler: (panel, plugin) => {
          if (plugin.onPanelTypeChanged) {
            Object.assign(
              panel.options,
              plugin.onPanelTypeChanged(panel, 'custom3-plugin-id-old', panel.options, panel.fieldConfig)
            );
          }
        },
      });

      pluginToLoad = getTestPlugin3(transformations);
      panel.activate();
      await Promise.resolve();
    };

    it('should provide default transformations if none other were added', async () => {
      const defaultTransformations = [{ id: 'transformation1', options: {} }];

      await preparePanel(
        new SceneDataTransformer({
          transformations: defaultTransformations,
          $data: EmptyDataNode.clone(),
        }),
        undefined
      );

      expect(panel.state.$data).toBeInstanceOf(SceneDataTransformer);
      expect((panel.state.$data as SceneDataTransformer).state.transformations).toEqual(defaultTransformations);
    });

    it('should add new transformations', async () => {
      const defaultTransformations = [{ id: 'transformation1', options: {} }];
      const newTransformations = [
        { id: 'transformation1', options: {} },
        { id: 'transformation2', options: {} },
      ];

      await preparePanel(
        new SceneDataTransformer({
          transformations: defaultTransformations,
          $data: EmptyDataNode.clone(),
        }),
        newTransformations
      );

      expect(panel.state.$data).toBeInstanceOf(SceneDataTransformer);
      expect((panel.state.$data as SceneDataTransformer).state.transformations).toEqual(newTransformations);
    });

    it('should not affect undefined $data', async () => {
      const newTransformations = [
        { id: 'transformation1', options: {} },
        { id: 'transformation2', options: {} },
      ];

      await preparePanel(undefined, newTransformations);

      expect(panel.state.$data).toBeUndefined();
    });

    it('should wrap a SceneQueryRunner in SceneDataTransformer', async () => {
      const sceneQueryRunner = new SceneQueryRunner({ queries: [] });
      const newTransformations = [
        { id: 'transformation1', options: {} },
        { id: 'transformation2', options: {} },
      ];

      await preparePanel(sceneQueryRunner, newTransformations);

      expect(panel.state.$data).toBeInstanceOf(SceneDataTransformer);
      expect((panel.state.$data as SceneDataTransformer).state.transformations).toEqual(newTransformations);
      expect((panel.state.$data as SceneDataTransformer).state.$data).toBe(sceneQueryRunner);
    });
  });
});

function getDataNodeWithTestData() {
  return new SceneDataNode({
    data: getTestData(),
  });
}

function getTestData(): PanelData {
  return {
    state: LoadingState.Loading,
    timeRange: getDefaultTimeRange(),
    annotations: [
      toDataFrame({
        fields: [
          { name: 'time', values: [1, 2, 2, 5, 5] },
          { name: 'id', values: ['1', '2', '2', '5', '5'] },
          {
            name: 'text',
            values: ['t1', 't2', 't3', 't4', 't5'],
            config: {
              links: [
                {
                  title: 'some annotation link',
                  url: 'some-valid-annotation-url',
                },
              ],
            },
          },
        ],
      }),
    ],
    alertState: {
      dashboardId: 1,
      panelId: 18,
      state: AlertState.Pending,
      id: 123,
    },
    series: [
      toDataFrame({
        fields: [
          { name: 'A', type: FieldType.string, values: ['A', 'B', 'C'] },
          { name: 'B', type: FieldType.string, values: ['A', 'B', 'C'] },
        ],
      }),
    ],
  };
}

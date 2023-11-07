import React from 'react';

import {
  FieldConfigProperty,
  FieldType,
  LoadingState,
  PanelPlugin,
  getDefaultTimeRange,
  standardEditorsRegistry,
  standardFieldConfigEditorRegistry,
  toDataFrame,
} from '@grafana/data';
import { getPanelPlugin } from '../../../utils/test/__mocks__/pluginMocks';

import { VizPanel } from './VizPanel';
import { SceneDataNode } from '../../core/SceneDataNode';
import { SeriesVisibilityChangeMode } from '@grafana/ui';

let pluginToLoad: PanelPlugin | undefined;

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getPluginImportUtils: () => ({
    getPanelPluginFromCache: jest.fn(() => pluginToLoad),
  }),
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

function getTestPlugin1() {
  const pluginToLoad = getPanelPlugin(
    {
      id: 'custom-plugin-id',
    },
    () => <div>My custom panel</div>
  );

  pluginToLoad.meta.info.version = '1.0.0';
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
});

function getDataNodeWithTestData() {
  return new SceneDataNode({
    data: {
      state: LoadingState.Loading,
      timeRange: getDefaultTimeRange(),
      series: [
        toDataFrame({
          fields: [
            { name: 'A', type: FieldType.string, values: ['A', 'B', 'C'] },
            { name: 'B', type: FieldType.string, values: ['A', 'B', 'C'] },
          ],
        }),
      ],
    },
  });
}

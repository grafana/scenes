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
  PanelPluginDataSupport,
  AlertState,
  PanelData,
  PanelProps,
  toUtc,
} from '@grafana/data';
import { getPanelPlugin } from '../../../utils/test/__mocks__/pluginMocks';

import { VizPanel } from './VizPanel';
import { SceneDataNode } from '../../core/SceneDataNode';
import { SeriesVisibilityChangeMode } from '@grafana/ui';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { act, render, screen } from '@testing-library/react';

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
  const pluginToLoad = getPanelPlugin(
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

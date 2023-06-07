import { VizPanelBuilder } from './VizPanelBuilder';

interface OptionsTest {
  numeric: number;
  text: string;
  complex: {
    a: number;
    b: string;
  };
}

interface FieldConfigTest {
  numeric: number;
  text: string;
  complex: {
    a: number;
    b: string;
  };
}

const createDefaultOptions = (): OptionsTest => ({
  numeric: 1,
  text: 'text',
  complex: {
    a: 1,
    b: 'text',
  },
});

const createDefaultFieldConfig = (): FieldConfigTest => ({
  numeric: 1,
  text: 'text',
  complex: {
    a: 1,
    b: 'text',
  },
});

const getTestBuilder = () =>
  new VizPanelBuilder<OptionsTest, FieldConfigTest>(
    'testplugin',
    '1.0.0',
    createDefaultOptions,
    createDefaultFieldConfig
  );

const configurablePropertiesTest: Array<[string, string | boolean]> = [
  ['title', 'My panel title'],
  ['description', 'My panel description'],
  ['displayMode', 'transparent'],
  ['hoverHeader', true],
  ['isDraggable', true],
  ['isResizable', true],
];
describe('VizPanelBuilder', () => {
  it.each(configurablePropertiesTest)('should configure %s', (property, expected) => {
    const methodName = `set${property.charAt(0).toUpperCase()}${property.slice(1)}`;
    const builder = getTestBuilder();

    // @ts-ignore
    builder[methodName](expected);

    // @ts-ignore
    expect(builder.build().state[property]).toEqual(expected);
    expect(builder.build().state.pluginId).toEqual('testplugin');
    expect(builder.build().state.pluginVersion).toEqual('1.0.0');
  });

  describe('options and field config', () => {
    it('provides default options', () => {
      const builder = getTestBuilder();
      expect(builder.build().state.options).toEqual(createDefaultOptions());
    });

    it('provides default field config', () => {
      const builder = getTestBuilder();
      expect(builder.build().state.fieldConfig).toEqual({
        defaults: {
          custom: createDefaultFieldConfig(),
        },
        overrides: [],
      });
    });

    it('allows options configuration', () => {
      const builder = getTestBuilder();
      builder.setOptions({
        complex: {
          a: 2,
        },
        numeric: 2,
      });

      expect(builder.build().state.options.complex!.a).toEqual(2);
      expect(builder.build().state.options.complex!.b).toEqual('text');
      expect(builder.build().state.options.numeric).toEqual(2);
      expect(builder.build().state.options.text).toEqual('text');
    });

    it('allows standard field config configuration', () => {
      const builder = getTestBuilder();
      builder.setStandardConfig({
        decimals: 2,
        unit: 'ms',
        displayName: 'testDisplayName',
      });

      expect(builder.build().state.fieldConfig!.defaults.decimals).toEqual(2);
      expect(builder.build().state.fieldConfig.defaults.unit).toEqual('ms');
      expect(builder.build().state.fieldConfig.defaults.displayName).toEqual('testDisplayName');
    });

    it('allows field config configuration', () => {
      const builder = getTestBuilder();
      builder.setFieldConfig({
        complex: {
          a: 2,
        },
        numeric: 2,
      });

      expect(builder.build().state.fieldConfig!.defaults.custom!.complex.a).toEqual(2);
      expect(builder.build().state.fieldConfig.defaults.custom!.complex.b).toEqual('text');
      expect(builder.build().state.fieldConfig.defaults.custom?.numeric).toEqual(2);
      expect(builder.build().state.fieldConfig.defaults.custom?.text).toEqual('text');
    });
  });

  describe('overrides', () => {
    it('allows overrides configuration', () => {
      const builder = getTestBuilder();
      builder.setFieldConfigOverrides((b) =>
        b
          .matchFieldsWithName('fieldName')
          .override('complex', { a: 2, b: 'text' })
          .matchFieldsByQuery('A')
          .override('numeric', 2)
          .override('decimals', 2)
      );

      expect(builder.build().state.fieldConfig.overrides).toHaveLength(2);
      expect(builder.build().state.fieldConfig.overrides).toMatchInlineSnapshot(`
        [
          {
            "matcher": {
              "id": "byName",
              "options": "fieldName",
            },
            "properties": [
              {
                "id": "custom.complex",
                "value": {
                  "a": 2,
                  "b": "text",
                },
              },
            ],
          },
          {
            "matcher": {
              "id": "byFrameRefID",
              "options": "A",
            },
            "properties": [
              {
                "id": "custom.numeric",
                "value": 2,
              },
              {
                "id": "decimals",
                "value": 2,
              },
            ],
          },
        ]
      `);
    });
  });
});

import { MappingType, ThresholdsMode } from '@grafana/schema';
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

      builder
        .setDecimals(2)
        .setUnit('ms')
        .setDisplayName('testDisplayName')
        .setColor({ mode: 'thresholds' })
        .setMin(1)
        .setMax(100)
        .setMappings([
          {
            type: MappingType.ValueToText,
            options: {
              '1': {
                text: 'one',
              },
            },
          },
        ])
        .setThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            { color: 'green', value: 0 },
            { color: 'red', value: 80 },
          ],
        })
        .setNoValue('no value')
        .setFilterable(true)
        .setLinks([
          {
            url: 'https://grafana.com',
            title: 'Grafana',
            targetBlank: true,
          },
        ]);

      expect(builder.build().state.fieldConfig!.defaults).toMatchInlineSnapshot(`
        {
          "color": {
            "mode": "thresholds",
          },
          "custom": {
            "complex": {
              "a": 1,
              "b": "text",
            },
            "numeric": 1,
            "text": "text",
          },
          "decimals": 2,
          "displayName": "testDisplayName",
          "filterable": true,
          "links": [
            {
              "targetBlank": true,
              "title": "Grafana",
              "url": "https://grafana.com",
            },
          ],
          "mappings": [
            {
              "options": {
                "1": {
                  "text": "one",
                },
              },
              "type": "value",
            },
          ],
          "max": 100,
          "min": 1,
          "noValue": "no value",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0,
              },
              {
                "color": "red",
                "value": 80,
              },
            ],
          },
          "unit": "ms",
        }
      `);
    });

    it('allows field config configuration', () => {
      const builder = getTestBuilder();

      builder.setConfigProperty('complex', { a: 2 });
      builder.setConfigProperty('numeric', 2);

      expect(builder.build().state.fieldConfig!.defaults.custom).toMatchInlineSnapshot(`
        {
          "complex": {
            "a": 2,
            "b": "text",
          },
          "numeric": 2,
          "text": "text",
        }
      `);
    });
  });

  describe('overrides', () => {
    it('allows standard overrides configuration', () => {
      const builder = getTestBuilder();
      builder.setOverrides((b) =>
        b
          .matchFieldsWithName('fieldName')
          .overrideColor({ mode: 'thresholds' })
          .overrideDecimals(2)
          .overrideDisplayName('testDisplayName')
          .overrideFilterable(true)
          .overrideMax(100)
          .overrideMin(1)
          .overrideNoValue('no value')
          .overrideUnit('ms')
          .overrideLinks([
            {
              url: 'https://grafana.com',
              title: 'Grafana',
              targetBlank: true,
            },
          ])
          .overrideMappings([
            {
              type: MappingType.ValueToText,
              options: {
                '1': {
                  text: 'one',
                },
              },
            },
          ])
          .overrideThresholds({
            mode: ThresholdsMode.Absolute,
            steps: [
              { color: 'green', value: 0 },
              { color: 'red', value: 80 },
            ],
          })
      );

      expect(builder.build().state.fieldConfig.overrides).toHaveLength(1);
      expect(builder.build().state.fieldConfig.overrides).toMatchInlineSnapshot(`
        [
          {
            "matcher": {
              "id": "byName",
              "options": "fieldName",
            },
            "properties": [
              {
                "id": "color",
                "value": {
                  "mode": "thresholds",
                },
              },
              {
                "id": "decimals",
                "value": 2,
              },
              {
                "id": "displayName",
                "value": "testDisplayName",
              },
              {
                "id": "filterable",
                "value": true,
              },
              {
                "id": "max",
                "value": 100,
              },
              {
                "id": "min",
                "value": 1,
              },
              {
                "id": "noValue",
                "value": "no value",
              },
              {
                "id": "unit",
                "value": "ms",
              },
              {
                "id": "links",
                "value": [
                  {
                    "targetBlank": true,
                    "title": "Grafana",
                    "url": "https://grafana.com",
                  },
                ],
              },
              {
                "id": "mappings",
                "value": [
                  {
                    "options": {
                      "1": {
                        "text": "one",
                      },
                    },
                    "type": "value",
                  },
                ],
              },
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "green",
                      "value": 0,
                    },
                    {
                      "color": "red",
                      "value": 80,
                    },
                  ],
                },
              },
            ],
          },
        ]
      `);
    });
    it('allows overrides configuration', () => {
      const builder = getTestBuilder();
      builder.setOverrides((b) =>
        b
          .matchFieldsWithName('fieldName')
          .overrideConfigProperty('complex', { a: 2, b: 'text' })
          .matchFieldsByQuery('A')
          .overrideConfigProperty('numeric', 2)
          .overrideDecimals(2)
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

import { DataFrame, FieldConfigSource, FieldMatcherID, FieldType } from '@grafana/data';
import { SeriesVisibilityChangeMode } from '@grafana/ui';

import { seriesVisibilityConfigFactory } from './seriesVisibilityConfigFactory';

describe('seriesVisibilityConfigFactory', () => {
  const frame1: DataFrame = {
    fields: [
      { name: 'field1', values: [], config: {}, type: FieldType.string },
      { name: 'field2', values: [], config: {}, type: FieldType.string },
      { name: 'field3', values: [], config: {}, type: FieldType.string },
    ],
    length: 0,
  };

  it('should create config override to hide others', () => {
    const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };

    const config = seriesVisibilityConfigFactory('field1', SeriesVisibilityChangeMode.ToggleSelection, fieldConfig, [
      frame1,
    ]);

    expect(config.overrides).toEqual([
      {
        __systemRef: 'hideSeriesFrom',
        matcher: {
          id: FieldMatcherID.byNames,
          options: { mode: 'exclude', names: ['field1'], prefix: 'All except:', readOnly: true },
        },
        properties: [
          {
            id: 'custom.hideFrom',
            value: { viz: true, legend: false, tooltip: true },
          },
        ],
      },
    ]);

    // toggling again should remove it
    const config2 = seriesVisibilityConfigFactory('field1', SeriesVisibilityChangeMode.ToggleSelection, config, [
      frame1,
    ]);

    expect(config2.overrides).toEqual([]);
  });

  it('should add correctly', () => {
    const fieldConfig = {
      defaults: {},
      overrides: [
        {
          __systemRef: 'hideSeriesFrom',
          matcher: {
            id: FieldMatcherID.byNames,
            options: { mode: 'exclude', names: ['field1'], prefix: 'All except:', readOnly: true },
          },
          properties: [
            {
              id: 'custom.hideFrom',
              value: { viz: true, legend: false, tooltip: true },
            },
          ],
        },
      ],
    };

    const config = seriesVisibilityConfigFactory('field2', SeriesVisibilityChangeMode.AppendToSelection, fieldConfig, [
      frame1,
    ]);

    expect(config.overrides[0].matcher.options).toEqual({
      mode: 'exclude',
      names: ['field1', 'field2'],
      prefix: 'All except:',
      readOnly: true,
    });
  });

  describe('SetExactly mode', () => {
    const setExactly = 'setExactly' as SeriesVisibilityChangeMode;

    it('should create override showing only the given series', () => {
      const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };

      const config = seriesVisibilityConfigFactory(['field1', 'field2'], setExactly, fieldConfig, [frame1]);

      expect(config.overrides).toEqual([
        {
          __systemRef: 'hideSeriesFrom',
          matcher: {
            id: FieldMatcherID.byNames,
            options: { mode: 'exclude', names: ['field1', 'field2'], prefix: 'All except:', readOnly: true },
          },
          properties: [
            {
              id: 'custom.hideFrom',
              value: { viz: true, legend: false, tooltip: true },
            },
          ],
        },
      ]);
    });

    it('should clear overrides when null is passed', () => {
      const fieldConfig: FieldConfigSource = {
        defaults: {},
        overrides: [
          {
            __systemRef: 'hideSeriesFrom',
            matcher: {
              id: FieldMatcherID.byNames,
              options: { mode: 'exclude', names: ['field1'], prefix: 'All except:', readOnly: true },
            },
            properties: [{ id: 'custom.hideFrom', value: { viz: true, legend: false, tooltip: true } }],
          },
        ],
      };

      const config = seriesVisibilityConfigFactory(null, setExactly, fieldConfig, [frame1]);

      expect(config.overrides).toEqual([]);
    });

    it('should clear overrides when all series are selected', () => {
      const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };

      const config = seriesVisibilityConfigFactory(['field1', 'field2', 'field3'], setExactly, fieldConfig, [frame1]);

      expect(config.overrides).toEqual([]);
    });

    it('should preserve non-hideSeriesFrom overrides', () => {
      const customOverride = {
        matcher: { id: FieldMatcherID.byName, options: 'field1' },
        properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }],
      };
      const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [customOverride] };

      const config = seriesVisibilityConfigFactory(['field1'], setExactly, fieldConfig, [frame1]);

      expect(config.overrides).toHaveLength(2);
      expect(config.overrides[0]).toEqual(customOverride);
      expect(config.overrides[1].__systemRef).toBe('hideSeriesFrom');
    });
  });
});

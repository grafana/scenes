import { DataFrame, DataTopic, FieldConfigSource, FieldMatcherID, FieldType } from '@grafana/data';
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

  const annotationRegionFrame: DataFrame = {
    fields: [
      {
        name: 'type',
        config: {
          custom: {},
        },
        values: ['Milestones'],
        type: FieldType.string,
        state: {
          displayName: null,
          seriesIndex: 0,
        },
      },
      {
        name: 'color',
        config: {
          custom: {},
        },
        values: ['#F2495C'],
        type: FieldType.string,
        state: {
          displayName: null,
          seriesIndex: 1,
        },
      },
      {
        name: 'time',
        config: {
          custom: {},
        },
        values: [1720697881000],
        type: FieldType.time,
        state: {
          displayName: null,
          seriesIndex: 2,
        },
      },
      {
        name: 'timeEnd',
        config: {
          custom: {},
        },
        values: [1729081505000],
        type: FieldType.number,
        state: {
          displayName: null,
          seriesIndex: 2,
          range: {
            min: 1729081505000,
            max: 1759857566000,
            delta: 30776061000,
          },
        },
      },
      {
        name: 'title',
        config: {
          custom: {},
        },
        values: ['0.1.0'],
        type: FieldType.string,
        state: {
          displayName: null,
          seriesIndex: 3,
        },
      },
      {
        name: 'text',
        config: {
          custom: {},
        },
        values: [true],
        type: FieldType.boolean,
        state: {
          displayName: null,
          seriesIndex: 4,
        },
      },
      {
        name: 'isRegion',
        config: {
          custom: {},
        },
        values: [true],
        type: FieldType.boolean,
        state: {
          displayName: null,
          seriesIndex: 6,
        },
      },
    ],
    length: 1,
    name: 'annotationFrame',
    meta: {
      dataTopic: DataTopic.Annotations,
    },
  };

  it('should create annotation override', () => {
    const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };

    const config = seriesVisibilityConfigFactory('color', SeriesVisibilityChangeMode.ToggleSelection, fieldConfig, [
      frame1,
      annotationRegionFrame
    ], DataTopic.Annotations);

    expect(config.overrides).toEqual([
      {
        dataTopic: DataTopic.Annotations,
        __systemRef: 'hideSeriesFrom',
        matcher: {
          id: FieldMatcherID.byNames,
          options: { mode: 'exclude', names: ['color'], prefix: 'All except:', readOnly: true },
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
    const config2 = seriesVisibilityConfigFactory('color', SeriesVisibilityChangeMode.ToggleSelection, config, [
      frame1,
      annotationRegionFrame
    ], DataTopic.Annotations);

    expect(config2.overrides).toEqual([]);
  });

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
});

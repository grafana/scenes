import { FieldType, toDataFrame } from '@grafana/data';
import { of } from 'rxjs';
import { toMetricFindValues } from './toMetricFindValues';

describe('toMetricFindValues', () => {
  describe('series without properties', () => {
    const frameWithTextField = toDataFrame({
      fields: [{ name: 'text', type: FieldType.string, values: ['A', 'B', 'C'] }],
    });
    const frameWithValueField = toDataFrame({
      fields: [{ name: 'value', type: FieldType.string, values: ['A', 'B', 'C'] }],
    });
    const frameWithTextAndValueField = toDataFrame({
      fields: [
        { name: 'text', type: FieldType.string, values: ['TA', 'TB', 'TC'] },
        { name: 'value', type: FieldType.string, values: ['VA', 'VB', 'VC'] },
      ],
    });
    const frameWithAStringField = toDataFrame({
      fields: [{ name: 'label', type: FieldType.string, values: ['A', 'B', 'C'] }],
    });
    const frameWithExpandableField = toDataFrame({
      fields: [
        { name: 'label', type: FieldType.string, values: ['A', 'B', 'C'] },
        { name: 'expandable', type: FieldType.boolean, values: [true, false, true] },
      ],
    });

    // it.each wouldn't work here as we need the done callback
    [
      { series: null, expected: [] },
      { series: undefined, expected: [] },
      { series: [], expected: [] },
      { series: [{ text: '' }], expected: [{ text: '' }] },
      { series: [{ value: '' }], expected: [{ value: '' }] },
      {
        series: [frameWithTextField],
        expected: [
          { text: 'A', value: 'A' },
          { text: 'B', value: 'B' },
          { text: 'C', value: 'C' },
        ],
      },
      {
        series: [frameWithValueField],
        expected: [
          { text: 'A', value: 'A' },
          { text: 'B', value: 'B' },
          { text: 'C', value: 'C' },
        ],
      },
      {
        series: [frameWithTextAndValueField],
        expected: [
          { text: 'TA', value: 'VA' },
          { text: 'TB', value: 'VB' },
          { text: 'TC', value: 'VC' },
        ],
      },
      {
        series: [frameWithAStringField],
        expected: [
          { text: 'A', value: 'A' },
          { text: 'B', value: 'B' },
          { text: 'C', value: 'C' },
        ],
      },
      {
        series: [frameWithExpandableField],
        expected: [
          { text: 'A', value: 'A', expandable: true },
          { text: 'B', value: 'B', expandable: false },
          { text: 'C', value: 'C', expandable: true },
        ],
      },
    ].forEach((scenario) => {
      it(`when called with series:${JSON.stringify(scenario.series, null, 0)}`, async () => {
        const { series, expected } = scenario;
        const panelData: any = { series };
        const observable = of(panelData).pipe(toMetricFindValues());

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(expected);
        });
      });
    });

    describe('when called with no string fields', () => {
      it('then the observable throws', async () => {
        const frameWithTimeField = toDataFrame({
          fields: [{ name: 'time', type: FieldType.time, values: [1, 2, 3] }],
        });

        const panelData: any = { series: [frameWithTimeField] };
        const observable = of(panelData).pipe(toMetricFindValues());

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(new Error("Couldn't find any field of type string in the results"));
        });
      });
    });
  });

  describe('series with properties', () => {
    const frameWithPropertiesField = toDataFrame({
      fields: [
        {
          name: 'id',
          type: FieldType.string,
          values: ['dev', 'staging', 'prod'],
        },
        {
          name: 'display_name',
          type: FieldType.string,
          values: ['Development', 'Staging', 'Production'],
        },
        {
          name: 'location',
          type: FieldType.string,
          values: ['US', 'SG', 'EU'],
        },
      ],
    });
    const frameWithValueAndPropertiesField = toDataFrame({
      fields: [...frameWithPropertiesField.fields, { name: 'value', type: FieldType.string, values: ['1', '2', '3'] }],
    });
    const frameWithValueTextAndPropertiesField = toDataFrame({
      fields: [
        ...frameWithValueAndPropertiesField.fields,
        { name: 'text', type: FieldType.string, values: ['Dev', 'Stag', 'Prod'] },
      ],
    });
    const frameWithPropertiesAndExpandableField = toDataFrame({
      fields: [
        ...frameWithPropertiesField.fields,
        { name: 'expandable', type: FieldType.boolean, values: [true, false, true] },
      ],
    });

    [
      {
        series: [frameWithPropertiesField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          { text: 'Development', value: 'dev', properties: { id: 'dev', display_name: 'Development', location: 'US' } },
          { text: 'Staging', value: 'staging', properties: { id: 'staging', display_name: 'Staging', location: 'SG' } },
          { text: 'Production', value: 'prod', properties: { id: 'prod', display_name: 'Production', location: 'EU' } },
        ],
      },
      {
        series: [frameWithPropertiesField],
        valueProp: 'id',
        expected: [
          { text: 'dev', value: 'dev', properties: { id: 'dev', display_name: 'Development', location: 'US' } },
          { text: 'staging', value: 'staging', properties: { id: 'staging', display_name: 'Staging', location: 'SG' } },
          { text: 'prod', value: 'prod', properties: { id: 'prod', display_name: 'Production', location: 'EU' } },
        ],
      },
      {
        series: [frameWithPropertiesField],
        textProp: 'display_name',
        expected: [
          {
            text: 'Development',
            value: 'Development',
            properties: { id: 'dev', display_name: 'Development', location: 'US' },
          },
          { text: 'Staging', value: 'Staging', properties: { id: 'staging', display_name: 'Staging', location: 'SG' } },
          {
            text: 'Production',
            value: 'Production',
            properties: { id: 'prod', display_name: 'Production', location: 'EU' },
          },
        ],
      },
      {
        series: [frameWithPropertiesAndExpandableField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          {
            text: 'Development',
            value: 'dev',
            properties: { id: 'dev', display_name: 'Development', location: 'US' },
            expandable: true,
          },
          {
            text: 'Staging',
            value: 'staging',
            properties: { id: 'staging', display_name: 'Staging', location: 'SG' },
            expandable: false,
          },
          {
            text: 'Production',
            value: 'prod',
            properties: { id: 'prod', display_name: 'Production', location: 'EU' },
            expandable: true,
          },
        ],
      },
      {
        series: [frameWithValueAndPropertiesField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          { text: 'Development', value: '1', properties: { id: 'dev', display_name: 'Development', location: 'US' } },
          { text: 'Staging', value: '2', properties: { id: 'staging', display_name: 'Staging', location: 'SG' } },
          { text: 'Production', value: '3', properties: { id: 'prod', display_name: 'Production', location: 'EU' } },
        ],
      },
      {
        series: [frameWithValueTextAndPropertiesField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          { text: 'Dev', value: '1', properties: { id: 'dev', display_name: 'Development', location: 'US' } },
          { text: 'Stag', value: '2', properties: { id: 'staging', display_name: 'Staging', location: 'SG' } },
          { text: 'Prod', value: '3', properties: { id: 'prod', display_name: 'Production', location: 'EU' } },
        ],
      },
    ].forEach((scenario) => {
      it(`when called with series:${JSON.stringify(scenario.series, null, 0)}`, async () => {
        const { series, valueProp, textProp, expected } = scenario;
        const panelData: any = { series };
        const observable = of(panelData).pipe(toMetricFindValues(valueProp, textProp));

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(expected);
        });
      });
    });

    describe('when called with no string fields', () => {
      it('then the observable throws', async () => {
        const panelData: any = { series: [frameWithPropertiesField] };
        const observable = of(panelData).pipe(toMetricFindValues(undefined, undefined));

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(new Error('Properties found in series but missing valueProp and textProp'));
        });
      });
    });
  });
});

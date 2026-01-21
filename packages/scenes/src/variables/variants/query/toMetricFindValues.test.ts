import { FieldType, toDataFrame } from '@grafana/data';
import { of } from 'rxjs';
import { toMetricFindValues } from './toMetricFindValues';

describe('toMetricFindValues(valueProp,textProp)', () => {
  describe('when valueProp/textProp are not passed', () => {
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
    const frameWithTextAndNumericValueField = toDataFrame({
      fields: [
        { name: 'text', type: FieldType.string, values: ['TA', 'TB', 'TC'] },
        { name: 'value', type: FieldType.number, values: [1, 2, 3] },
      ],
    });
    const frameWithArbitraryStringField = toDataFrame({
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
      { name: 'null series', series: null, expected: [] },
      { name: 'undefined series', series: undefined, expected: [] },
      { name: 'empty series', series: [], expected: [] },
      { name: 'MetricFindValue array: text only', series: [{ text: '' }], expected: [{ text: '' }] },
      { name: 'MetricFindValue array: value only', series: [{ value: '' }], expected: [{ value: '' }] },
      {
        name: "single frame: 'text' field only",
        series: [frameWithTextField],
        expected: [
          { text: 'A', value: 'A', properties: { text: 'A' } },
          { text: 'B', value: 'B', properties: { text: 'B' } },
          { text: 'C', value: 'C', properties: { text: 'C' } },
        ],
      },
      {
        name: "single frame: 'value' field only",
        series: [frameWithValueField],
        expected: [
          { text: 'A', value: 'A', properties: { value: 'A' } },
          { text: 'B', value: 'B', properties: { value: 'B' } },
          { text: 'C', value: 'C', properties: { value: 'C' } },
        ],
      },
      {
        name: "single frame: 'text' + 'value' fields",
        series: [frameWithTextAndValueField],
        expected: [
          { text: 'TA', value: 'VA', properties: { text: 'TA', value: 'VA' } },
          { text: 'TB', value: 'VB', properties: { text: 'TB', value: 'VB' } },
          { text: 'TC', value: 'VC', properties: { text: 'TC', value: 'VC' } },
        ],
      },
      {
        name: "single frame: 'text' + numeric 'value' field",
        series: [frameWithTextAndNumericValueField],
        expected: [
          { text: 'TA', value: 1, properties: { text: 'TA', value: 1 } },
          { text: 'TB', value: 2, properties: { text: 'TB', value: 2 } },
          { text: 'TC', value: 3, properties: { text: 'TC', value: 3 } },
        ],
      },
      {
        name: 'single frame: arbitrary string field',
        series: [frameWithArbitraryStringField],
        expected: [
          { text: 'A', value: 'A', properties: { label: 'A' } },
          { text: 'B', value: 'B', properties: { label: 'B' } },
          { text: 'C', value: 'C', properties: { label: 'C' } },
        ],
      },
      {
        name: "single frame: string field with 'expandable' flag",
        series: [frameWithExpandableField],
        expected: [
          { text: 'A', value: 'A', expandable: true, properties: { label: 'A' } },
          { text: 'B', value: 'B', expandable: false, properties: { label: 'B' } },
          { text: 'C', value: 'C', expandable: true, properties: { label: 'C' } },
        ],
      },
    ].forEach((scenario) => {
      it(scenario.name, async () => {
        const { series, expected } = scenario;
        const panelData: any = { series };
        const observable = of(panelData).pipe(toMetricFindValues());

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(expected);
        });
      });
    });

    describe('when called with no string or number fields', () => {
      it('then the observable throws', async () => {
        const frameWithTimeField = toDataFrame({
          fields: [{ name: 'time', type: FieldType.time, values: [1, 2, 3] }],
        });

        const panelData: any = { series: [frameWithTimeField] };
        const observable = of(panelData).pipe(toMetricFindValues());

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(new Error("Couldn't find any field of type string or number in the results"));
        });
      });
    });
  });

  describe('when valueProp/textProp are passed', () => {
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
        name: "valueProp='id' and textProp='display_name'",
        series: [frameWithPropertiesField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          {
            text: 'Development',
            value: 'dev',
            properties: { id: 'dev', display_name: 'Development', location: 'US' },
          },
          {
            text: 'Staging',
            value: 'staging',
            properties: { id: 'staging', display_name: 'Staging', location: 'SG' },
          },
          {
            text: 'Production',
            value: 'prod',
            properties: { id: 'prod', display_name: 'Production', location: 'EU' },
          },
        ],
      },
      {
        name: "valueProp='id' only",
        series: [frameWithPropertiesField],
        valueProp: 'id',
        expected: [
          {
            text: 'dev',
            value: 'dev',
            properties: { id: 'dev', display_name: 'Development', location: 'US' },
          },
          {
            text: 'staging',
            value: 'staging',
            properties: { id: 'staging', display_name: 'Staging', location: 'SG' },
          },
          {
            text: 'prod',
            value: 'prod',
            properties: { id: 'prod', display_name: 'Production', location: 'EU' },
          },
        ],
      },
      {
        name: "textProp='display_name' only",
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
        name: "valueProp='id' and textProp='display_name' with 'expandable' flag",
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
        name: "valueProp='id' and textProp='display_name' with 'value' field",
        series: [frameWithValueAndPropertiesField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          {
            text: 'Development',
            value: 'dev',
            properties: { id: 'dev', display_name: 'Development', location: 'US', value: '1' },
          },
          {
            text: 'Staging',
            value: 'staging',
            properties: { id: 'staging', display_name: 'Staging', location: 'SG', value: '2' },
          },
          {
            text: 'Production',
            value: 'prod',
            properties: { id: 'prod', display_name: 'Production', location: 'EU', value: '3' },
          },
        ],
      },
      {
        name: "valueProp='id' and textProp='display_name' with 'value' and 'text' fields",
        series: [frameWithValueTextAndPropertiesField],
        valueProp: 'id',
        textProp: 'display_name',
        expected: [
          {
            text: 'Development',
            value: 'dev',
            properties: { id: 'dev', display_name: 'Development', location: 'US', text: 'Dev', value: '1' },
          },
          {
            text: 'Staging',
            value: 'staging',
            properties: { id: 'staging', display_name: 'Staging', location: 'SG', text: 'Stag', value: '2' },
          },
          {
            text: 'Production',
            value: 'prod',
            properties: { id: 'prod', display_name: 'Production', location: 'EU', text: 'Prod', value: '3' },
          },
        ],
      },
    ].forEach((scenario) => {
      it(scenario.name, async () => {
        const { series, valueProp, textProp, expected } = scenario;
        const panelData: any = { series };
        const observable = of(panelData).pipe(toMetricFindValues(valueProp, textProp));

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(expected);
        });
      });
    });

    describe('when called with no string nor number fields', () => {
      it('then the observable throws', async () => {
        const frameWithPropertiesField = toDataFrame({
          fields: [{ name: 'id', type: FieldType.other, values: [null, null, null] }],
        });

        const panelData: any = { series: [frameWithPropertiesField] };
        const observable = of(panelData).pipe(toMetricFindValues(undefined, undefined));

        await expect(observable).toEmitValuesWith((received) => {
          const value = received[0];
          expect(value).toEqual(new Error("Couldn't find any field of type string or number in the results"));
        });
      });
    });
  });
});

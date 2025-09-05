import { FieldType, toDataFrame } from '@grafana/data';
import { of } from 'rxjs';
import { toMetricFindValues } from './toMetricFindValues';

describe('toMetricFindValues', () => {
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
  const frameWithPropertiesField = toDataFrame({
    fields: [
      {
        name: 'properties',
        type: FieldType.other,
        values: [
          { value: 'A', displayValue: 'Alpha' },
          { value: 'B', displayValue: 'Beta' },
          { value: 'C', displayValue: 'Gamma' },
        ],
      },
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
    {
      series: [frameWithPropertiesField],
      expected: [
        { text: 'Alpha', value: 'A', properties: { displayValue: 'Alpha', value: 'A' } },
        { text: 'Beta', value: 'B', properties: { displayValue: 'Beta', value: 'B' } },
        { text: 'Gamma', value: 'C', properties: { displayValue: 'Gamma', value: 'C' } },
      ],
    },
  ].forEach((scenario) => {
    it(`when called with series:${JSON.stringify(scenario.series, null, 0)}`, async () => {
      const { series, expected } = scenario;
      const panelData: any = { series };
      const observable = of(panelData).pipe(toMetricFindValues('value', 'displayValue'));

      await expect(observable).toEmitValuesWith((received) => {
        const value = received[0];
        expect(value).toEqual(expected);
      });
    });
  });

  describe('when called without metric find values and string/other fields', () => {
    it('then the observable throws', async () => {
      const frameWithTimeField = toDataFrame({
        fields: [{ name: 'time', type: FieldType.time, values: [1, 2, 3] }],
      });

      const panelData: any = { series: [frameWithTimeField] };
      const observable = of(panelData).pipe(toMetricFindValues());

      await expect(observable).toEmitValuesWith((received) => {
        const value = received[0];
        expect(value).toEqual(new Error("Couldn't find any field of type string or other in the results."));
      });
    });
  });

  describe('when called with other fields and no valueProp is passed', () => {
    it('then the observable throws', async () => {
      const frameWithOtherField = toDataFrame({
        fields: [{ name: 'properties', type: FieldType.other, values: [{ n: 1 }, { n: 2 }, { n: 3 }] }],
      });

      const panelData: any = { series: [frameWithOtherField] };
      const observable = of(panelData).pipe(toMetricFindValues());

      await expect(observable).toEmitValuesWith((received) => {
        const value = received[0];
        expect(value).toEqual(new Error('Field of type other require valueProp to be set.'));
      });
    });
  });
});

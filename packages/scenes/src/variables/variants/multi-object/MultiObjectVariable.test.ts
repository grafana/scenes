import { lastValueFrom } from 'rxjs';

import { MultiObjectVariable } from './MultiObjectVariable';
import { MultiObjectOptionsProviders } from './MultiObjectOptionsProviders';

const buildVariable = (value: string | string[] = '') =>
  new MultiObjectVariable({
    name: 'test',
    value,
    isMulti: Array.isArray(value),
    options: [],
    provider: MultiObjectOptionsProviders.fromJson({
      valueProp: 'id',
      textProp: 'name',
      json: `
[
  { "id": 1, "name": "Development", "aws_environment": "development", "azure_environment": "dev" },
  { "id": 2, "name": "Staging", "aws_environment": "staging", "azure_environment": "stg" },
  { "id": 3, "name": "Production", "aws_environment": "prod", "azure_environment": "prd" }
]
      `,
    }),
  });

describe('MultiObjectVariable', () => {
  describe('When the JSON is a valid array of objects', () => {
    it('should generate correctly the options', async () => {
      const variable = buildVariable();

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('1');
      expect(variable.state.text).toBe('Development');
      expect(variable.state.options).toStrictEqual([
        {
          value: '1',
          label: 'Development',
          obj: {
            id: 1,
            name: 'Development',
            aws_environment: 'development',
            azure_environment: 'dev',
          },
        },
        {
          value: '2',
          label: 'Staging',
          obj: {
            id: 2,
            name: 'Staging',
            aws_environment: 'staging',
            azure_environment: 'stg',
          },
        },
        {
          value: '3',
          label: 'Production',
          obj: {
            id: 3,
            name: 'Production',
            aws_environment: 'prod',
            azure_environment: 'prd',
          },
        },
      ]);
    });

    describe('When some values are missing in the objects received', () => {
      it('should skip them when generating the options', async () => {
        const variable = new MultiObjectVariable({
          name: 'test',
          options: [],
          provider: MultiObjectOptionsProviders.fromJson({
            valueProp: 'id',
            textProp: 'name',
            json: `[
{ "name": "Pre-prod" },
{ "id": 1, "name": "Production" }
]`,
          }),
        });

        await lastValueFrom(variable.validateAndUpdate());

        expect(variable.state.value).toBe('1');
        expect(variable.state.text).toBe('Production');
        expect(variable.state.options).toStrictEqual([
          {
            value: '1',
            label: 'Production',
            obj: { id: 1, name: 'Production' },
          },
        ]);
      });
    });
  });

  describe('When the JSON is invalid', () => {
    it('should throw when it is a syntax error', async () => {
      const variable = new MultiObjectVariable({
        name: 'test',
        value: '',
        options: [],
        provider: MultiObjectOptionsProviders.fromJson({
          valueProp: 'id',
          textProp: 'name',
          json: '{id:1}',
        }),
      });

      await expect(lastValueFrom(variable.validateAndUpdate())).rejects.toThrow(
        "Expected property name or '}' in JSON at position 1 (line 1 column 2)"
      );

      expect(variable.state.value).toBe('');
      expect(variable.state.text).toBe('');
      expect(variable.state.options).toStrictEqual([]);
    });

    it('should throw when the parsed value is not an array', async () => {
      const variable = new MultiObjectVariable({
        name: 'test',
        value: '',
        options: [],
        provider: MultiObjectOptionsProviders.fromJson({
          valueProp: 'id',
          textProp: 'name',
          json: '{"id":"1"}',
        }),
      });

      await expect(lastValueFrom(variable.validateAndUpdate())).rejects.toThrow('The JSON provided must be an array');

      expect(variable.state.value).toBe('');
      expect(variable.state.text).toBe('');
      expect(variable.state.options).toStrictEqual([]);
    });

    it('should throw when the parsed value is not an array of objects', async () => {
      const variable = new MultiObjectVariable({
        name: 'test',
        value: '',
        options: [],
        provider: MultiObjectOptionsProviders.fromJson({
          valueProp: 'id',
          textProp: 'name',
          json: '[1,2,3]',
        }),
      });

      await expect(lastValueFrom(variable.validateAndUpdate())).rejects.toThrow(
        'The JSON provided must be an array of objects'
      );

      expect(variable.state.value).toBe('');
      expect(variable.state.text).toBe('');
      expect(variable.state.options).toStrictEqual([]);
    });
  });

  describe('getValue', () => {
    it('it should return the value according to fieldPath', async () => {
      const variable = buildVariable();

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue()).toBe('1');
      expect(variable.getValue('aws_environment')).toBe('development');
      expect(variable.getValue('azure_environment')).toBe('dev');
    });
  });
});

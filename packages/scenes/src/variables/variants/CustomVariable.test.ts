import { lastValueFrom } from 'rxjs';

import { TestScene } from '../TestScene';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { CustomVariable } from './CustomVariable';

describe('CustomVariable', () => {
  describe('When empty query is provided', () => {
    it('Should default to empty options', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: '',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('');
      expect(variable.state.text).toEqual('');
      expect(variable.state.options).toEqual([]);
    });
  });

  describe('When query is provided', () => {
    it('Should generate correctly the options for only value queries', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'A,B,C',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('A');
      expect(variable.state.text).toEqual('A');
      expect(variable.state.options).toEqual([
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
      ]);
    });

    it('Should generate correctly the options for key:value pairs', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'label-1 : value-1,label-2 : value-2, label-3 : value-3',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('value-1');
      expect(variable.state.text).toEqual('label-1');
      expect(variable.state.options).toEqual([
        { label: 'label-1', value: 'value-1' },
        { label: 'label-2', value: 'value-2' },
        { label: 'label-3', value: 'value-3' },
      ]);
    });

    it('Should generate correctly the options for key:value pairs with newline', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: `label-1 : value-1,
label-2 : value-2,
label-3 : value-3,`,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('value-1');
      expect(variable.state.text).toEqual('label-1');
      expect(variable.state.options).toEqual([
        { label: 'label-1', value: 'value-1' },
        { label: 'label-2', value: 'value-2' },
        { label: 'label-3', value: 'value-3' },
      ]);
    });

    it('Should generate correctly the options for key:value pairs with special characters', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'label\\,1 :  value\\,1',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('value,1');
      expect(variable.state.text).toEqual('label,1');
      expect(variable.state.options).toEqual([{ label: 'label,1', value: 'value,1' }]);
    });

    it('Should generate correctly the options for key:value and only values combined', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'label-1 : value-1, value-2, label\\,3 : value-3,value\\,4',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('value-1');
      expect(variable.state.text).toEqual('label-1');
      expect(variable.state.options).toEqual([
        { label: 'label-1', value: 'value-1' },
        { label: 'value-2', value: 'value-2' },
        { label: 'label,3', value: 'value-3' },
        { label: 'value,4', value: 'value,4' },
      ]);
    });

    it('Should generate correctly the options for key:value pairs with extra spaces', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'a,  b,   c, d :    e',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('a');
      expect(variable.state.text).toEqual('a');
      expect(variable.state.options).toEqual([
        {
          label: 'a',
          value: 'a',
        },
        {
          label: 'b',
          value: 'b',
        },
        {
          label: 'c',
          value: 'c',
        },
        {
          label: 'd',
          value: 'e',
        },
      ]);
    });

    it('Should generate correctly the options for only values as URLs', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'http://www.google.com/, http://www.amazon.com/',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('http://www.google.com/');
      expect(variable.state.text).toEqual('http://www.google.com/');
      expect(variable.state.options).toEqual([
        {
          label: 'http://www.google.com/',
          value: 'http://www.google.com/',
        },
        {
          label: 'http://www.amazon.com/',
          value: 'http://www.amazon.com/',
        },
      ]);
    });

    it('Should generate correctly the options for key/values as URLs', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'google : http://www.google.com/, amazon : http://www.amazon.com/',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('http://www.google.com/');
      expect(variable.state.text).toEqual('google');
      expect(variable.state.options).toEqual([
        {
          label: 'google',
          value: 'http://www.google.com/',
        },
        {
          label: 'amazon',
          value: 'http://www.amazon.com/',
        },
      ]);
    });
  });

  describe('When value is provided', () => {
    it('Should keep current value if current value is valid', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        query: 'A,B',
        value: 'B',
        text: 'B',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('B');
      expect(variable.state.text).toBe('B');
    });

    it('Should maintain the valid values when multiple selected', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        isMulti: true,
        query: 'A,C',
        value: ['A', 'B', 'C'],
        text: ['A', 'B', 'C'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['A', 'C']);
      expect(variable.state.text).toEqual(['A', 'C']);
    });

    it('Should pick first option if none of the current values are valid', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        isMulti: true,
        query: 'A,C',
        value: ['D', 'E'],
        text: ['E', 'E'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['A']);
      expect(variable.state.text).toEqual(['A']);
    });
  });

  describe('When query contains other variables', () => {
    it('Should interpolate query', async () => {
      const A = new CustomVariable({
        name: 'A',
        options: [],
        query: 'value1,value2',
        value: '',
        text: '',
      });
      const B = new CustomVariable({
        name: 'B',
        options: [],
        query: '1,2,$A',
        value: '',
        text: '',
      });

      const scene = new TestScene({ $variables: new SceneVariableSet({ variables: [A, B] }) });
      scene.activate();

      expect(A.state.value).toBe('value1');
      expect(B.state.options[2].value).toBe('value1');
    });
  });

  describe('multi prop / object support', () => {
    it('Can have object values (JSON array of objects)', async () => {
      const variable = new CustomVariable({
        name: 'test',
        isMulti: false,
        optionsProviderType: 'json',
        query: `
[
  { "id": "test", "display": "Test", "location": "US" },
  { "id": "prod", "display": "Prod", "location": "EU" }
]
        `,
        valueProp: 'id',
        textProp: 'display',
        value: 'prod',
        text: 'Prod',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue()).toEqual('prod');
      expect(variable.getValue('location')).toEqual('EU');
    });

    it('Can have object values (JSON array of strings)', async () => {
      const variable = new CustomVariable({
        name: 'test',
        isMulti: false,
        optionsProviderType: 'json',
        query: `["test", "prod"]`,
        value: 'prod',
        text: 'prod',
        options: [],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('prod');
      expect(variable.state.text).toBe('prod');
    });
  });
});

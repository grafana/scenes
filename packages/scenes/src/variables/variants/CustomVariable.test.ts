import { lastValueFrom } from 'rxjs';
import { VariableHide } from '@grafana/schema';
import { locationService } from '@grafana/runtime';

import { updateUrlStateAndSyncState } from '../../../utils/test/updateUrlStateAndSyncState';
import { UrlSyncManager } from '../../services/UrlSyncManager';
import { TestScene } from '../TestScene';
import { SceneVariableSet } from '../sets/SceneVariableSet';
import { CustomVariable } from './CustomVariable';
import { TextBoxVariable } from './TextBoxVariable';

describe('CustomVariable', () => {
  describe.each([false, true])('Dependent variable URL updates (hidden=%s)', (hidden) => {
    function setup() {
      const search = new TextBoxVariable({ name: 'search', value: '' });
      const offset = new CustomVariable({
        name: 'offset',
        query: 'Page ${search:percentencode} : 0',
        value: '0',
        text: 'Page',
        hide: hidden ? VariableHide.hideVariable : VariableHide.dontHide,
        allowCustomValue: false,
      });
      const variables = new SceneVariableSet({ variables: [search, offset] });
      const scene = new TestScene({ $variables: variables });
      return { scene, variables, search, offset };
    }

    it('validates on dependency changes after runtime URL updates', () => {
      const { scene, variables, search, offset } = setup();
      const deactivate = scene.activate();
      const deactivateOffset = hidden ? () => {} : offset.activate();

      try {
        expect(variables.isActive).toBe(true);
        expect(offset.isActive).toBe(!hidden);

        for (const searchValue of ['timeout', '']) {
          offset.urlSync!.updateFromUrl({ 'var-offset': '100' });
          expect(offset.state.value).toBe('100');

          search.setValue(searchValue);
          expect(offset.state.value).toBe('0');
          expect(offset.state.options).toEqual([{ label: `Page ${searchValue}`.trim(), value: '0' }]);
        }
      } finally {
        deactivateOffset();
        deactivate();
      }
    });

    it('preserves the initial URL value until a dependency changes', () => {
      const { scene, search, offset } = setup();
      offset.urlSync!.updateFromUrl({ 'var-offset': '500' });
      const deactivate = scene.activate();
      const deactivateOffset = hidden ? () => {} : offset.activate();

      try {
        expect(offset.state.value).toBe('500');
        search.setValue('timeout');
        expect(offset.state.value).toBe('0');
      } finally {
        deactivateOffset();
        deactivate();
      }
    });

    it('resets a runtime URL offset through the URL sync manager when the parent changes', () => {
      const { scene, search, offset } = setup();
      const urlManager = new UrlSyncManager();
      locationService.push('/?var-offset=500');
      urlManager.initSync(scene);
      const deactivate = scene.activate();
      const deactivateOffset = hidden ? () => {} : offset.activate();

      try {
        expect(offset.state.value).toBe('500');
        updateUrlStateAndSyncState({ 'var-offset': '100' }, urlManager);
        expect(offset.state.value).toBe('100');
        search.setValue('timeout');
        expect(offset.state.value).toBe('0');
        expect(locationService.getSearchObject()['var-offset']).toBe('0');
      } finally {
        deactivateOffset();
        deactivate();
        urlManager.cleanUp(scene);
        locationService.push('/');
      }
    });

    it('preserves runtime URL values when the scene is reactivated without changed dependencies', () => {
      const { scene, offset } = setup();
      const deactivate = scene.activate();
      const deactivateOffset = hidden ? () => {} : offset.activate();
      offset.urlSync!.updateFromUrl({ 'var-offset': '100' });
      deactivateOffset();
      deactivate();

      const deactivateAgain = scene.activate();
      const deactivateOffsetAgain = hidden ? () => {} : offset.activate();
      try {
        expect(offset.state.value).toBe('100');
      } finally {
        deactivateOffsetAgain();
        deactivateAgain();
      }
    });
  });

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

    it('Should expose the interpolated options when flag is true', () => {
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

      expect(B.transformCsvStringToOptions(B.state.query)).toEqual([
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: 'value1', value: 'value1' },
      ]);
    });

    it('Should not expose the interpolated options when flag is false', () => {
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

      expect(B.transformCsvStringToOptions(B.state.query, false)).toEqual([
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '$A', value: '$A' },
      ]);
    });
  });

  describe('JSON values format', () => {
    describe('When empty query is provided', () => {
      it('Should default to empty options', async () => {
        const variable = new CustomVariable({
          name: 'test',
          options: [],
          value: '',
          text: '',
          valuesFormat: 'json',
          query: '',
        });

        await lastValueFrom(variable.validateAndUpdate());

        expect(variable.state.value).toEqual('');
        expect(variable.state.text).toEqual('');
        expect(variable.state.options).toEqual([]);
      });
    });

    it('Should generate correctly the options for an array of objects', async () => {
      const variable = new CustomVariable({
        name: 'test',
        isMulti: false,
        valuesFormat: 'json',
        query: `
[
  { "value": "test", "text": "Test", "location": "US" },
  { "value": "prod", "text": "Prod", "location": "EU" }
]
        `,
        value: 'prod',
        text: 'Prod',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.options).toEqual([
        { value: 'test', label: 'Test', properties: { value: 'test', text: 'Test', location: 'US' } },
        { value: 'prod', label: 'Prod', properties: { value: 'prod', text: 'Prod', location: 'EU' } },
      ]);
      expect(variable.getValue()).toEqual('prod');
      expect(variable.getValue('location')).toEqual('EU');
    });

    it('Should throw when query is not valid JSON', async () => {
      const variable = new CustomVariable({
        name: 'test',
        valuesFormat: 'json',
        query: `]]]]{ "value": "test", "location": "US" }]`,
      });

      expect(() => variable.validateAndUpdate()).toThrow("Unexpected token ']'");
    });

    it('Should throw when query is not an array', async () => {
      const variable = new CustomVariable({
        name: 'test',
        valuesFormat: 'json',
        query: `{ "value": "test", "location": "US" }`,
      });

      expect(() => variable.validateAndUpdate()).toThrow('Query must be a JSON array of objects');
    });

    it('Should throw if query is not an array of objects', async () => {
      const variable = new CustomVariable({
        name: 'test',
        valuesFormat: 'json',
        query: `[{ "value": "test", "location": "US" }, 2, { "value": "prod", "location": "EU" }]`,
      });

      expect(() => variable.validateAndUpdate()).toThrow('Query must be a JSON array of objects');
    });
  });
});

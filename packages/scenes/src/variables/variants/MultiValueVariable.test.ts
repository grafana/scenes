import { lastValueFrom } from 'rxjs';

import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { VariableFormatID } from '@grafana/schema';

import { SceneVariableValueChangedEvent } from '../types';
import { CustomAllValue } from '../variants/MultiValueVariable';
import { TestVariable } from './TestVariable';
import { subscribeToStateUpdates } from '../../../utils/test/utils';
import { CustomVariable } from './CustomVariable';

describe('MultiValueVariable', () => {
  describe('When validateAndUpdate is called', () => {
    it('Should pick first value if current value is not valid', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        value: 'A',
        text: 'A',
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('B');
      expect(variable.state.text).toBe('B');
    });

    it('Should pick All value when defaultToAll is true', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        defaultToAll: true,
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
    });

    it('Should pick first option when current value is All value but all value is not enabled', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
        optionsToReturn: [
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('B');
    });

    it('Should keep current value if current value is valid', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [{ label: 'A', value: 'A' }],
        value: 'A',
        text: 'A',
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('A');
      expect(variable.state.text).toBe('A');
    });

    it('Should set to empty when no options are returned', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: 'A',
        text: 'A',
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('');
      expect(variable.state.text).toBe('');
    });

    it('Should set to empty array when no options are returned and variable isMulti', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ['A'],
        text: ['A'],
        delayMs: 0,
        isMulti: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual([]);
      expect(variable.state.text).toEqual([]);
    });

    it('When saved value is same as text representation', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'label-A', value: 'value-A' },
          { label: 'label-B', value: 'value-B' },
        ],
        value: 'label-B',
        text: 'label-B',
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('value-B');
      expect(variable.state.text).toBe('label-B');
    });

    it('Should update text representation if current matched option has different text value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [{ label: 'displayName for A', value: 'A' }],
        value: 'A',
        text: 'A',
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('A');
      expect(variable.state.text).toBe('displayName for A');
    });

    it('Should maintain the valid values when multiple selected', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        isMulti: true,
        optionsToReturn: [
          { label: 'A', value: 'A' },
          { label: 'C', value: 'C' },
        ],
        value: ['A', 'B', 'C'],
        text: ['A', 'B', 'C'],
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['A', 'C']);
      expect(variable.state.text).toEqual(['A', 'C']);
    });

    it('Should update text representation if current matched text array values are not valid', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        // since we only sync value to URL after URL sync both value and text will have the "value" representation
        value: ['1', '2'],
        text: ['1', '2'],
        delayMs: 0,
        isMulti: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['1', '2']);
      expect(variable.state.text).toEqual(['A', 'B']);
    });

    it('Should pick first option if none of the current values are valid', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        isMulti: true,
        optionsToReturn: [
          { label: 'A', value: 'A' },
          { label: 'C', value: 'C' },
        ],
        value: ['D', 'E'],
        text: ['E', 'E'],
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['A']);
      expect(variable.state.text).toEqual(['A']);
    });

    it('Should select All option if none of the current values are valid', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [
          { label: 'A', value: 'A' },
          { label: 'C', value: 'C' },
        ],
        value: ['D', 'E'],
        text: ['E', 'E'],
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual([ALL_VARIABLE_VALUE]);
      expect(variable.state.text).toEqual([ALL_VARIABLE_TEXT]);
    });

    it('Should handle $__all value and send change event when value is still $__all, but options change', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        includeAll: true,
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
        delayMs: 0,
        updateOptions: false, // don't update options in TestVar, MultiVar will update it anyway
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
      expect(variable.state.text).toBe(ALL_VARIABLE_TEXT);
      expect(variable.state.options).toEqual(variable.state.optionsToReturn);
      expect(changeEvent).toBeDefined();
    });

    it('Should handle $__all value and not send change event when value is still $__all, but options are the same', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        includeAll: true,
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
        delayMs: 0,
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
      expect(variable.state.text).toBe(ALL_VARIABLE_TEXT);
      expect(variable.state.options).toEqual(variable.state.optionsToReturn);
      expect(changeEvent).not.toBeDefined();
    });

    it('Should default to $__all even when no options are returned', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        defaultToAll: true,
        value: [],
        text: [],
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
      expect(variable.state.text).toBe(ALL_VARIABLE_TEXT);
    });

    it('Should correct $__all text value if not correct', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [{ label: 'A', value: '1' }],
        defaultToAll: true,
        includeAll: true,
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_VALUE,
        delayMs: 0,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
      expect(variable.state.text).toBe(ALL_VARIABLE_TEXT);
    });
  });

  describe('changeValueTo', () => {
    it('Should set default empty state to all value if defaultToAll multi', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
        value: ['1'],
        text: ['A'],
        delayMs: 0,
      });

      variable.changeValueTo([]);

      expect(variable.state.value).toEqual([ALL_VARIABLE_VALUE]);
    });

    it('When changing to all value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
        value: ['1'],
        text: ['A'],
        delayMs: 0,
      });

      variable.changeValueTo(['1', ALL_VARIABLE_VALUE]);
      // Should clear the value so only all value is set
      expect(variable.state.value).toEqual([ALL_VARIABLE_VALUE]);
    });

    it('When changing from all value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
        delayMs: 0,
      });

      variable.changeValueTo([ALL_VARIABLE_VALUE, '1']);
      // Should remove the all value so only the new value is present
      expect(variable.state.value).toEqual(['1']);
    });

    it('When value is the same', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
        delayMs: 0,
        value: ['1', '2'],
        text: ['A', 'B'],
      });

      variable.activate();

      const stateUpdates = subscribeToStateUpdates(variable);

      variable.changeValueTo(['1', '2']);

      expect(stateUpdates).toHaveLength(0);
    });

    it('changes when performing browser history action on user action', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        optionsToReturn: [],
        delayMs: 0,
      });

      variable.changeValueTo(['1'], undefined, true);
      expect(variable.state.value).toEqual(['1']);
    });
  });

  describe('getValue and getValueText', () => {
    it('GetValueText should return text', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      expect(variable.getValue()).toBe('1');
      expect(variable.getValueText()).toBe('A');
    });

    it('GetValueText should return All text when value is $__all', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ALL_VARIABLE_VALUE,
        text: 'A',
        delayMs: 0,
      });

      expect(variable.getValueText()).toBe(ALL_VARIABLE_TEXT);
    });

    it('GetValue should return all options as an array when value is $__all', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        optionsToReturn: [],
        value: ALL_VARIABLE_VALUE,
        text: 'A',
        delayMs: 0,
      });

      expect(variable.getValue()).toEqual(['1', '2']);
    });

    it('GetValue should return allValue when value is $__all', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ALL_VARIABLE_VALUE,
        allValue: '.*',
        text: 'A',
        delayMs: 0,
      });

      const value = variable.getValue() as CustomAllValue;
      expect(value.formatter()).toBe('.*');
      // Should have special handling for text format
      expect(value.formatter(VariableFormatID.Text)).toBe(ALL_VARIABLE_TEXT);
      // Should ignore most formats
      expect(value.formatter(VariableFormatID.Regex)).toBe('.*');
      // Should not ignore url encoding
      expect(value.formatter(VariableFormatID.PercentEncode)).toBe('.%2A');
    });

    it('GetValue should support index fieldPath', async () => {
      const variable = new TestVariable({
        name: 'test',
        value: ['1', '2'],
        isMulti: true,
        optionsToReturn: [],
        delayMs: 0,
      });

      expect(variable.getValue('1')).toBe('2');
    });
  });

  describe('getOptionsForSelect', () => {
    it('Should return options', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [{ label: 'A', value: '1' }],
        optionsToReturn: [],
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      expect(variable.getOptionsForSelect()).toEqual([{ label: 'A', value: '1' }]);
    });

    it('Should return include All option when includeAll is true', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [{ label: 'A', value: '1' }],
        optionsToReturn: [],
        includeAll: true,
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE },
        { label: 'A', value: '1' },
      ]);
    });

    it('Should add current value if not found', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      expect(variable.getOptionsForSelect()).toEqual([{ label: 'A', value: '1' }]);
    });
  });

  describe('Url syncing', () => {
    it('getUrlState should return single value state if value is single value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      expect(variable.urlSync?.getUrlState()).toEqual({ ['var-test']: '1' });
    });

    it('getUrlState should return string array if value is string array', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ['1', '2'],
        text: ['A', 'B'],
        delayMs: 0,
      });

      expect(variable.urlSync?.getUrlState()).toEqual({ ['var-test']: ['1', '2'] });
    });

    it('getUrlState should always return array if isMulti is true', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        value: 'A',
        optionsToReturn: [],
        isMulti: true,
        delayMs: 0,
      });

      expect(variable.urlSync?.getUrlState()).toEqual({ ['var-test']: ['A'] });
    });

    it('getUrlState should not return array if var is not multi and value is single element array', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        value: ['A'],
        optionsToReturn: [],
        delayMs: 0,
      });

      expect(variable.urlSync?.getUrlState()).toEqual({ ['var-test']: 'A' });
    });

    it('updateFromUrl should update value for single value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        optionsToReturn: [],
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: '2' });
      expect(variable.state.value).toEqual('2');
      expect(variable.state.text).toEqual('B');
    });

    it('updateFromUrl should update value for array value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        optionsToReturn: [],
        value: '1',
        text: 'A',
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: ['2', '1'] });
      expect(variable.state.value).toEqual(['2', '1']);
      expect(variable.state.text).toEqual(['B', 'A']);
    });

    it('updateFromUrl with custom value should survive validation', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: 'Custom value' });
      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue()).toEqual('Custom value');

      // but a second call to valdiate and update should set default value
      await lastValueFrom(variable.validateAndUpdate());
      expect(variable.getValue()).toEqual('1');
    });

    it('updateFromUrl with old arch All value', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        includeAll: true,
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: ALL_VARIABLE_TEXT });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue()).toEqual(['1', '2']);
    });

    it('updateFromUrl with old arch All value and isMulti: true', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        includeAll: true,
        isMulti: true,
        value: '',
        text: '',
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: [ALL_VARIABLE_TEXT] });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue()).toEqual(['1', '2']);
    });

    it('updateFromUrl with the custom all value should set value to ALL_VARIABLE_VALUE', async () => {
      const variable = new TestVariable({
        name: 'test',
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        includeAll: true,
        isMulti: true,
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
        allValue: '.*',
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: '.*' });
      expect(variable.state.value).toEqual(ALL_VARIABLE_VALUE);
      expect(variable.state.text).toEqual(ALL_VARIABLE_TEXT);
    });

    it('updateFromUrl with key value pair should lookup text representation ', async () => {
      const variable = new TestVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        value: ['1'],
        text: ['A'],
        delayMs: 0,
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: ['1', '2'] });
      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValueText()).toEqual('A + B');
    });

    it('updateFromUrl should update value from label in the case of key/value custom variable', async () => {
      const variable = new CustomVariable({
        name: 'test',
        options: [],
        value: '',
        text: '',
        query: 'A : 1,B : 2',
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: 'B' });
      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual('2');
      expect(variable.state.text).toEqual('B');
    });

    it('Can disable url sync', async () => {
      const variable = new TestVariable({
        name: 'test',
        value: '1',
        text: 'A',
        delayMs: 0,
        skipUrlSync: true,
      });

      expect(variable.urlSync?.getUrlState()).toEqual({});
      expect(variable.urlSync?.getKeys()).toEqual([]);
    });
  });

  describe('multi prop / object support', () => {
    it('Can have object values', async () => {
      const variable = new TestVariable({
        name: 'test',
        value: 'A',
        text: 'A',
        delayMs: 0,
        skipUrlSync: true,
        optionsToReturn: [
          { label: 'Test', value: 'test', properties: { id: 'test', display: 'Test', location: 'US' } },
          { label: 'Prod', value: 'pod', properties: { id: 'prod', display: 'Prod', location: 'EU' } },
        ],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.getValue('location')).toEqual('US');
    });
  });
});

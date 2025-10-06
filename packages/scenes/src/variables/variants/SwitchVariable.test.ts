import { lastValueFrom } from 'rxjs';

import { SceneVariableValueChangedEvent } from '../types';
import { SwitchVariable } from './SwitchVariable';

describe('SwitchVariable', () => {
  it('Should initialize with default values', () => {
    const variable = new SwitchVariable({
      name: 'test',
    });

    expect(variable.state.name).toBe('test');
    expect(variable.state.type).toBe('switch');
    expect(variable.state.value).toBe('false');
    expect(variable.state.enabledValue).toBe('true');
    expect(variable.state.disabledValue).toBe('false');
  });

  it('Should initialize with provided value', () => {
    const variable = new SwitchVariable({
      name: 'test',
      value: 'true',
    });

    expect(variable.state.value).toBe('true');
  });

  it('Should initialize with other state properties', () => {
    const variable = new SwitchVariable({
      name: 'test',
      value: 'true',
      label: 'Test Switch',
      description: 'A test switch variable',
    });

    expect(variable.state.name).toBe('test');
    expect(variable.state.value).toBe('true');
    expect(variable.state.label).toBe('Test Switch');
    expect(variable.state.description).toBe('A test switch variable');
  });

  it('Should initialize with custom enabled and disabled values', () => {
    const variable = new SwitchVariable({
      name: 'test',
      value: 'on',
      enabledValue: 'on',
      disabledValue: 'off',
    });

    expect(variable.state.value).toBe('on');
    expect(variable.state.enabledValue).toBe('on');
    expect(variable.state.disabledValue).toBe('off');
  });

  describe('getValue()', () => {
    it('Should return string value when value is enabled', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'true',
      });

      expect(variable.getValue()).toBe('true');
    });

    it('Should return string value when value is disabled', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      expect(variable.getValue()).toBe('false');
    });

    it('Should return custom enabled value', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'on',
        enabledValue: 'on',
        disabledValue: 'off',
      });

      expect(variable.getValue()).toBe('on');
    });

    it('Should return custom disabled value', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'off',
        enabledValue: 'on',
        disabledValue: 'off',
      });

      expect(variable.getValue()).toBe('off');
    });
  });

  describe('isEnabled() and isDisabled()', () => {
    it('Should return true for isEnabled when value equals enabledValue', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'true',
      });

      expect(variable.isEnabled()).toBe(true);
      expect(variable.isDisabled()).toBe(false);
    });

    it('Should return true for isDisabled when value equals disabledValue', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      expect(variable.isEnabled()).toBe(false);
      expect(variable.isDisabled()).toBe(true);
    });

    it('Should work with custom enabled and disabled values', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'on',
        enabledValue: 'on',
        disabledValue: 'off',
      });

      expect(variable.isEnabled()).toBe(true);
      expect(variable.isDisabled()).toBe(false);

      variable.setValue('off');
      expect(variable.isEnabled()).toBe(false);
      expect(variable.isDisabled()).toBe(true);
    });
  });

  describe('setValue()', () => {
    it('Should update value and publish change event', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      variable.setValue('true');

      expect(variable.state.value).toBe('true');
      expect(changeEvent).toBeDefined();
      expect(changeEvent!.payload).toBe(variable);
    });

    it('Should not publish change event when value is the same', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'true',
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      variable.setValue('true');

      expect(variable.state.value).toBe('true');
      expect(changeEvent).toBeUndefined();
    });

    it('Should accept valid enabled and disabled values', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      variable.setValue('true');
      expect(variable.state.value).toBe('true');

      variable.setValue('false');
      expect(variable.state.value).toBe('false');
    });

    it('Should accept custom enabled and disabled values', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'off',
        enabledValue: 'on',
        disabledValue: 'off',
      });

      variable.setValue('on');
      expect(variable.state.value).toBe('on');

      variable.setValue('off');
      expect(variable.state.value).toBe('off');
    });

    it('Should throw error for invalid values', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      expect(() => variable.setValue('invalid')).toThrow(
        'Invalid value for switch variable: "invalid". Valid values are: "true" and "false".'
      );
    });

    it('Should throw error for invalid custom values', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'off',
        enabledValue: 'on',
        disabledValue: 'off',
      });

      expect(() => variable.setValue('invalid')).toThrow(
        'Invalid value for switch variable: "invalid". Valid values are: "on" and "off".'
      );
    });
  });

  describe('validateAndUpdate', () => {
    it('Should publish change event when value has changed since last validation', async () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      // First validation should trigger event
      await lastValueFrom(variable.validateAndUpdate());
      expect(changeEvent).toBeDefined();

      // Reset event
      changeEvent = undefined;

      // Second validation without value change should not trigger event
      await lastValueFrom(variable.validateAndUpdate());
      expect(changeEvent).toBeUndefined();

      // Change value and validate again should trigger event
      variable.setState({ value: 'true' });
      await lastValueFrom(variable.validateAndUpdate());
      expect(changeEvent).toBeDefined();
    });

    it('Should return empty result object', async () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      const result = await lastValueFrom(variable.validateAndUpdate());
      expect(result).toEqual({});
    });
  });

  describe('URL syncing', () => {
    it('Should have URL syncing capabilities', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'true',
      });

      // SwitchVariable now implements URL syncing
      expect(variable.urlSync).toBeDefined();
      expect(variable.getUrlState).toBeDefined();
      expect(variable.updateFromUrl).toBeDefined();
      expect(variable.getKeys).toBeDefined();
    });

    it('Should return correct URL state', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'true',
      });

      const urlState = variable.getUrlState();
      expect(urlState).toEqual({ 'var-testSwitch': 'true' });

      variable.setValue('false');
      const urlStateFalse = variable.getUrlState();
      expect(urlStateFalse).toEqual({ 'var-testSwitch': 'false' });
    });

    it('Should update from URL state', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'false',
      });

      variable.updateFromUrl({ 'var-testSwitch': 'true' });
      expect(variable.getValue()).toBe('true');

      variable.updateFromUrl({ 'var-testSwitch': 'false' });
      expect(variable.getValue()).toBe('false');
    });

    it('Should handle invalid URL values by throwing error', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'false',
      });

      expect(() => variable.updateFromUrl({ 'var-testSwitch': 'invalid' })).toThrow(
        'Invalid value for switch variable: "invalid". Valid values are: "true" and "false".'
      );
    });

    it('Should work with custom enabled/disabled values in URL sync', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'off',
        enabledValue: 'on',
        disabledValue: 'off',
      });

      variable.updateFromUrl({ 'var-testSwitch': 'on' });
      expect(variable.getValue()).toBe('on');

      variable.updateFromUrl({ 'var-testSwitch': 'off' });
      expect(variable.getValue()).toBe('off');

      expect(() => variable.updateFromUrl({ 'var-testSwitch': 'invalid' })).toThrow(
        'Invalid value for switch variable: "invalid". Valid values are: "on" and "off".'
      );
    });

    it('Should return correct keys for URL sync', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'true',
      });

      expect(variable.getKeys()).toEqual(['var-testSwitch']);
    });

    it('Should skip URL sync when skipUrlSync is true', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: 'true',
        skipUrlSync: true,
      });

      expect(variable.getKeys()).toEqual([]);
      expect(variable.getUrlState()).toEqual({});
    });
  });

  describe('Event publishing behavior', () => {
    it('Should publish events with bubbling enabled', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: 'false',
      });

      let eventBubbled = false;
      const mockPublishEvent = jest.spyOn(variable, 'publishEvent').mockImplementation((event, bubble) => {
        eventBubbled = bubble || false;
        return variable;
      });

      variable.setValue('true');

      expect(mockPublishEvent).toHaveBeenCalledWith(expect.any(SceneVariableValueChangedEvent), true);
      expect(eventBubbled).toBe(true);

      mockPublishEvent.mockRestore();
    });
  });
});

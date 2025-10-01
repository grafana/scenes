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
    expect(variable.state.value).toBe(false);
  });

  it('Should initialize with provided value', () => {
    const variable = new SwitchVariable({
      name: 'test',
      value: true,
    });

    expect(variable.state.value).toBe(true);
  });

  it('Should initialize with other state properties', () => {
    const variable = new SwitchVariable({
      name: 'test',
      value: true,
      label: 'Test Switch',
      description: 'A test switch variable',
    });

    expect(variable.state.name).toBe('test');
    expect(variable.state.value).toBe(true);
    expect(variable.state.label).toBe('Test Switch');
    expect(variable.state.description).toBe('A test switch variable');
  });

  describe('getValue()', () => {
    it('Should return boolean value when value is true', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: true,
      });

      expect(variable.getValue()).toBe(true);
    });

    it('Should return boolean value when value is false', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: false,
      });

      expect(variable.getValue()).toBe(false);
    });

    it('Should coerce truthy values to true', () => {
      const variable = new SwitchVariable({
        name: 'test',
        // @ts-expect-error - value is string
        value: 'truthy',
      });

      expect(variable.getValue()).toBe(true);
    });

    it('Should coerce falsy values to false', () => {
      const variable = new SwitchVariable({
        name: 'test',
        // @ts-expect-error - value is string
        value: '',
      });

      expect(variable.getValue()).toBe(false);
    });
  });

  describe('setValue()', () => {
    it('Should update value and publish change event', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: false,
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      variable.setValue(true);

      expect(variable.state.value).toBe(true);
      expect(changeEvent).toBeDefined();
      expect(changeEvent!.payload).toBe(variable);
    });

    it('Should not publish change event when value is the same', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: true,
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      variable.setValue(true);

      expect(variable.state.value).toBe(true);
      expect(changeEvent).toBeUndefined();
    });

    it('Should coerce non-boolean values to boolean', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: false,
      });

      // @ts-expect-error - value is string
      variable.setValue('truthy');
      expect(variable.state.value).toBe(true);

      // @ts-expect-error - value is number
      variable.setValue(0);
      expect(variable.state.value).toBe(false);

      // @ts-expect-error - value is number
      variable.setValue(1);
      expect(variable.state.value).toBe(true);

      // @ts-expect-error - value is null
      variable.setValue(null);
      expect(variable.state.value).toBe(false);

      // @ts-expect-error - value is undefined
      variable.setValue(undefined);
      expect(variable.state.value).toBe(false);
    });
  });

  describe('validateAndUpdate', () => {
    it('Should publish change event when value has changed since last validation', async () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: false,
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
      variable.setState({ value: true });
      await lastValueFrom(variable.validateAndUpdate());
      expect(changeEvent).toBeDefined();
    });

    it('Should return empty result object', async () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: false,
      });

      const result = await lastValueFrom(variable.validateAndUpdate());
      expect(result).toEqual({});
    });
  });

  describe('URL syncing', () => {
    it('Should not have URL syncing capabilities by default', () => {
      const variable = new SwitchVariable({
        name: 'testSwitch',
        value: true,
      });

      // SwitchVariable doesn't implement URL syncing like TextBoxVariable does
      expect(variable.urlSync).toBeUndefined();
      expect((variable as any).getUrlState).toBeUndefined();
      expect((variable as any).updateFromUrl).toBeUndefined();
    });
  });

  describe('Event publishing behavior', () => {
    it('Should publish events with bubbling enabled', () => {
      const variable = new SwitchVariable({
        name: 'test',
        value: false,
      });

      let eventBubbled = false;
      const mockPublishEvent = jest.spyOn(variable, 'publishEvent').mockImplementation((event, bubble) => {
        eventBubbled = bubble || false;
        return variable;
      });

      variable.setValue(true);

      expect(mockPublishEvent).toHaveBeenCalledWith(expect.any(SceneVariableValueChangedEvent), true);
      expect(eventBubbled).toBe(true);

      mockPublishEvent.mockRestore();
    });
  });
});

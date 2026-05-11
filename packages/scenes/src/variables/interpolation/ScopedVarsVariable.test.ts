import { ScopedVar } from '@grafana/data';

import { ScopedVarsVariable } from './ScopedVarsVariable';

function makeScopedVar(value: unknown, text?: string): ScopedVar {
  return { value, text };
}

describe('ScopedVarsVariable', () => {
  describe('getValue', () => {
    it('returns a string value as-is', () => {
      const wrapper = new ScopedVarsVariable('server', makeScopedVar('server1'));

      expect(wrapper.getValue('')).toBe('server1');
    });

    it('returns a number value as-is', () => {
      const wrapper = new ScopedVarsVariable('count', makeScopedVar(42));

      expect(wrapper.getValue('')).toBe(42);
    });

    it('returns a boolean value as-is', () => {
      const wrapper = new ScopedVarsVariable('enabled', makeScopedVar(true));

      expect(wrapper.getValue('')).toBe(true);
    });

    it('returns an array value as-is', () => {
      const value = ['server1', 'server2'];
      const wrapper = new ScopedVarsVariable('servers', makeScopedVar(value));

      expect(wrapper.getValue('')).toEqual(['server1', 'server2']);
      expect(Array.isArray(wrapper.getValue(''))).toBe(true);
    });

    it('returns a nested field when fieldPath is provided', () => {
      const wrapper = new ScopedVarsVariable('host', makeScopedVar({ name: 'server1', port: 3000 }));

      expect(wrapper.getValue('name')).toBe('server1');
    });

    it('returns a deeply nested field via dot-path', () => {
      const wrapper = new ScopedVarsVariable('config', makeScopedVar({ host: { name: 'srv' } }));

      expect(wrapper.getValue('host.name')).toBe('srv');
    });

    it('returns undefined for a non-existent fieldPath', () => {
      const wrapper = new ScopedVarsVariable('host', makeScopedVar({ a: 1 }));

      expect(wrapper.getValue('b')).toBeUndefined();
    });
  });
});

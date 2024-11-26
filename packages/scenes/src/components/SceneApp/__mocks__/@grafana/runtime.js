const React = require('react');
const runtime = jest.requireActual('@grafana/runtime');

runtime.PluginPage = jest.fn().mockImplementation((props) => {
  return React.createElement('div', null, props.children);
});

runtime.getPluginImportUtils = () => ({
  getPanelPluginFromCache: jest.fn(() => pluginToLoad),
});

module.exports = runtime;

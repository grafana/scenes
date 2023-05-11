/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  sidebar: [
    {
      type: 'category',
      label: 'Getting started',
      collapsible: true,
      collapsed: false,
      items: [{ id: 'getting-started', label: 'Setup', type: 'doc' }, 'core-concepts'],
    },
    {
      type: 'category',
      label: 'Scene apps',
      collapsible: true,
      collapsed: false,
      items: [
        'scene-app',
        { id: 'scene-app-tabs', label: 'Tabs', type: 'doc' },
        { id: 'scene-app-drilldown', label: 'Drill-down pages', type: 'doc' },
      ],
    },
    {
      type: 'category',
      label: 'Advanced usage',
      collapsible: true,
      collapsed: false,
      items: ['advanced-custom-scene-objects', 'advanced-activation-handlers', 'advanced-data', 'advanced-variables'],
    },
  ],
};
module.exports = sidebars;

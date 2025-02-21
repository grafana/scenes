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
      label: 'Scene objects',
      collapsible: true,
      collapsed: false,
      items: [
        { id: 'scene-layout', label: 'Layouts', type: 'doc' },
        'visualizations',
        'variables',
        'transformations',
        {
          type: 'category',
          label: 'Scenes apps',
          collapsible: true,
          collapsed: false,
          items: [
            'scene-app',
            { id: 'scene-app-tabs', label: 'Tabs', type: 'doc' },
            { id: 'scene-app-drilldown', label: 'Drill-down pages', type: 'doc' },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Advanced usage',
      collapsible: true,
      collapsed: false,
      items: [
        'advanced-custom-scene-objects',
        'advanced-activation-handlers',
        'advanced-data',
        'advanced-variables',
        'advanced-adhoc-filters',
        'advanced-behaviors',
        'advanced-custom-datasource',
        'advanced-time-range-comparison',
        'url-sync',
      ],
    },
    {
      type: 'category',
      label: '@grafana/scenes-ml',
      collapsible: true,
      collapsed: false,
      items: ['getting-started', 'baselines-and-forecasts', 'outlier-detection', 'changepoint-detection'].map(
        (id) => `scenes-ml/${id}`
      ),
    },
  ],
};
module.exports = sidebars;

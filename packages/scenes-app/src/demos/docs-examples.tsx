import { EmbeddedScene, SceneAppPage, SceneAppPageState } from '@grafana/scenes';
import { demoUrl } from '../utils/utils.routing';
import { getAdvancedActivationHandlers } from '../../../../docusaurus/docs/advanced-activation-handlers';
import { getAdvancedCustomObjectScene } from '../../../../docusaurus/docs/advanced-custom-scene-objects';
import { getCustomObjectScene, getDataAndTimeRangeScene } from '../../../../docusaurus/docs/core-concepts';
import { getHelloWorldScene } from '../../../../docusaurus/docs/getting-started';
import {
  getCSSGridLayoutScene,
  getFlexBoxLayoutScene,
  getGridLayoutScene,
  getSplitLayoutScene,
} from '../../../../docusaurus/docs/scene-layout';
import { getVariablesScene } from '../../../../docusaurus/docs/variables';
import { getTransformationsScene } from '../../../../docusaurus/docs/transformations';
import { getCustomVisualization, getStandardVisualizations } from '../../../../docusaurus/docs/visualizations';
import { getAdvancedVariablesScene } from '../../../../docusaurus/docs/advanced-variables';
import { getAdvancedDataScene } from '../../../../docusaurus/docs/advanced-data';
import { getAdvancedTimeRangeComparisonScene } from '../../../../docusaurus/docs/advanced-time-range-comparison';
import { getAdvancedBehaviors } from '../../../../docusaurus/docs/advanced-behaviors';

const docs = [
  {
    title: 'Hello world',
    url: 'hello-world',
    getScene: getHelloWorldScene,
  },
  {
    title: 'Custom object',
    url: 'custom-object',
    getScene: getCustomObjectScene,
  },
  {
    title: 'Data and time range',
    url: 'data-and-time-range',
    getScene: getDataAndTimeRangeScene,
  },
  {
    title: 'Flexbox layout',
    url: 'scene-layout-flexbox',
    getScene: getFlexBoxLayoutScene,
  },
  {
    title: 'CSS grid layout',
    url: 'scene-layout-css-grid',
    getScene: getCSSGridLayoutScene,
  },
  {
    title: 'Grid layout',
    url: 'scene-layout-grid',
    getScene: getGridLayoutScene,
  },
  {
    title: 'Split layout',
    url: 'scene-layout-split',
    getScene: getSplitLayoutScene,
  },
  {
    title: 'Standard visualizations',
    url: 'visualizations-standard',
    getScene: getStandardVisualizations,
  },
  {
    title: 'Custom visualization',
    url: 'visualizations-custom',
    getScene: getCustomVisualization,
  },
  {
    title: 'Variables',
    url: 'variables',
    getScene: getVariablesScene,
  },
  {
    title: 'Transformations',
    url: 'transformations',
    getScene: getTransformationsScene,
  },
  {
    title: 'Advanced - custom objects',
    url: 'advanced-custom-scene-objects',
    getScene: getAdvancedCustomObjectScene,
  },
  {
    title: 'Advanced - activation handlers',
    url: 'advanced-activation-handlers',
    getScene: getAdvancedActivationHandlers,
  },
  {
    title: 'Advanced - data',
    url: 'advanced-data',
    getScene: getAdvancedDataScene,
  },
  {
    title: 'Advanced - variables',
    url: 'advanced-variables',
    getScene: getAdvancedVariablesScene,
  },
  {
    title: 'Advanced - time range comparison',
    url: 'advanced-time-range-comparison',
    getScene: getAdvancedTimeRangeComparisonScene,
  },
  {
    title: 'Advanced - Behaviors',
    url: 'advanced-behaviors',
    getScene: getAdvancedBehaviors,
  },
];

export function getDocsExamples(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    url: demoUrl('docs-examples'),
    tabs: docs.map((doc) => getDocsExample(doc.getScene, doc.url, doc.title)),
  });
}

function getDocsExample(getScene: () => EmbeddedScene, url: string, title: string) {
  return new SceneAppPage({
    title,
    routePath: url,
    url: demoUrl(`docs-examples/${url}`),
    getScene,
  });
}

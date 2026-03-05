import React, { useEffect, useId } from 'react';
import {
  VizPanelMenu,
  SceneDataProvider,
  VizPanel as VizPanelObject,
  VizPanelState,
  VizConfig,
  DataProviderProxy,
  SceneDataNode,
} from '@grafana/scenes';
import { usePrevious } from 'react-use';
import { getPanelOptionsWithDefaults } from '@grafana/data';
import { PanelContext } from '@grafana/ui';
import { writeSceneLog } from '../utils';
import { useSceneContext } from '../hooks/hooks';
import { useAddToScene } from '../contexts/SceneContextObject';

export interface VizPanelProps {
  title: string;
  description?: string;
  dataProvider?: SceneDataProvider;
  viz: VizConfig;
  displayMode?: 'default' | 'transparent';
  hoverHeader?: boolean;
  hoverHeaderOffset?: number;
  menu?: VizPanelMenu;
  titleItems?: React.ReactNode;
  seriesLimit?: number;
  seriesLimitShowAll?: boolean;
  headerActions?: React.ReactNode;
  extendPanelContext?: (vizPanel: VizPanelObject, context: PanelContext) => void;
  collapsible?: boolean;
  collapsed?: boolean;
}

export function VizPanel(props: VizPanelProps) {
  const {
    title,
    description,
    viz,
    dataProvider,
    displayMode,
    hoverHeader,
    hoverHeaderOffset,
    headerActions,
    menu,
    titleItems,
    extendPanelContext,
    seriesLimit,
    seriesLimitShowAll,
    collapsible,
    collapsed,
  } = props;

  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);

  let panel = scene.findByKey<VizPanelObject>(key);

  if (!panel) {
    panel = new VizPanelObject({
      key: key,
      pluginId: viz.pluginId,
      title: title,
      titleItems: titleItems,
      description: description,
      options: viz.options,
      fieldConfig: viz.fieldConfig,
      pluginVersion: viz.pluginVersion,
      $data: getDataProviderForVizPanel(dataProvider),
      displayMode: displayMode,
      hoverHeader: hoverHeader,
      hoverHeaderOffset: hoverHeaderOffset,
      headerActions: headerActions,
      menu: menu,
      extendPanelContext: extendPanelContext,
      collapsible: collapsible,
      collapsed: collapsed,
      seriesLimit: seriesLimit,
      seriesLimitShowAll: seriesLimitShowAll,
    });
  }

  useAddToScene(panel, scene);

  // Update options
  useEffect(() => {
    const stateUpdate: Partial<VizPanelState> = {};

    if (!prevProps) {
      return;
    }

    if (title !== prevProps.title) {
      stateUpdate.title = title;
    }

    if (description !== prevProps.description) {
      stateUpdate.description = description;
    }

    if (displayMode !== prevProps.displayMode) {
      stateUpdate.displayMode = displayMode;
    }

    if (hoverHeader !== prevProps.hoverHeader) {
      stateUpdate.hoverHeader = hoverHeader;
    }

    if (hoverHeaderOffset !== prevProps.hoverHeaderOffset) {
      stateUpdate.hoverHeaderOffset = hoverHeaderOffset;
    }

    if (menu !== prevProps.menu) {
      stateUpdate.menu = menu;
    }

    if (titleItems !== prevProps.titleItems) {
      stateUpdate.titleItems = titleItems;
    }

    if (headerActions !== prevProps.headerActions) {
      stateUpdate.headerActions = headerActions;
    }

    if (dataProvider !== prevProps.dataProvider) {
      stateUpdate.$data = getDataProviderForVizPanel(dataProvider);
    }

    if (seriesLimit !== prevProps.seriesLimit) {
      stateUpdate.seriesLimit = seriesLimit;
    }

    if (seriesLimitShowAll !== prevProps.seriesLimitShowAll) {
      stateUpdate.seriesLimitShowAll = seriesLimitShowAll;
    }

    if (collapsible !== prevProps.collapsible) {
      stateUpdate.collapsible = collapsible;
    }

    if (collapsed !== prevProps.collapsed) {
      stateUpdate.collapsed = collapsed;
    }

    if (viz !== prevProps.viz) {
      if (viz.pluginId === prevProps.viz.pluginId) {
        const plugin = panel.getPlugin();
        if (plugin) {
          const optionsWithDefaults = getPanelOptionsWithDefaults({
            plugin,
            currentOptions: viz.options,
            currentFieldConfig: viz.fieldConfig,
            isAfterPluginChange: false,
          });
          stateUpdate.options = optionsWithDefaults.options;
          stateUpdate.fieldConfig = optionsWithDefaults.fieldConfig;

          panel.clearFieldConfigCache();
        }
      }
    }

    if (Object.keys(stateUpdate).length > 0) {
      panel.setState(stateUpdate);
      writeSceneLog('VizPanel', 'Updating VizPanel state', stateUpdate);
    }
  }, [
    panel,
    title,
    description,
    displayMode,
    hoverHeader,
    hoverHeaderOffset,
    headerActions,
    menu,
    titleItems,
    viz,
    dataProvider,
    seriesLimit,
    seriesLimitShowAll,
    collapsible,
    collapsed,
    prevProps,
  ]);

  return <panel.Component model={panel} />;
}

/**
 * Since the useQueryRunner attaches query runners to the scene context their parent is already set
 * This proxy is to work around that.
 * TODO: Figure out a better way to handle this'
 */
function getDataProviderForVizPanel(data: SceneDataProvider | undefined): SceneDataProvider | undefined {
  if (data && !(data instanceof SceneDataNode)) {
    return new DataProviderProxy({ source: data.getRef() });
  }
  return data;
}

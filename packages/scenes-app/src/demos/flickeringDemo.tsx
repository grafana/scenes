import React from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneCSSGridLayout,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getQueryRunnerWithRandomWalkQuery } from './utils';
import { Button, InlineSwitch } from '@grafana/ui';
import { useLocation } from 'react-router-dom';
import { locationUtil } from '@grafana/data';

export function getFlickeringDemo(defaults: SceneAppPageState) {
  const layout = new SceneCSSGridLayout({
    autoRows: 'auto',
    children: [],
    isLazy: true,
  });

  layout.setState({
    children: [
      PanelBuilders.timeseries()
        .setTitle('Panel with explore button')
        .setData(getQueryRunnerWithRandomWalkQuery())
        .setHeaderActions(<SwitchPanelButton layout={layout} />)
        .build(),
      PanelBuilders.timeseries().setTitle('Panel below').setData(getQueryRunnerWithRandomWalkQuery()).build(),
    ],
  });

  return new SceneAppPage({
    ...defaults,
    $timeRange: new SceneTimeRange(),
    controls: [new RenderBeforeActivationSwitch({}), new SceneTimePicker({}), new SceneRefreshPicker({})],
    tabs: [
      new SceneAppPage({
        title: 'Overview',
        url: `${defaults.url}/overview`,
        routePath: 'overview',
        getScene: () => {
          return new EmbeddedScene({
            controls: [new VariableValueSelectors({})],
            $variables: new SceneVariableSet({
              variables: [],
            }),
            body: layout,
          });
        },
      }),
      new SceneAppPage({
        title: 'Details',
        url: `${defaults.url}/details`,
        routePath: 'details',
        getScene: () => {
          return new EmbeddedScene({
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  body: PanelBuilders.timeseries()
                    .setTitle('Panel with explore button')
                    .setData(getQueryRunnerWithRandomWalkQuery())
                    .build(),
                }),
              ],
            }),
          });
        },
      }),
    ],
  });
}

interface VizPanelExploreButtonProps {
  layout: SceneCSSGridLayout;
}

let counter = 0;

function getNewPanel(layout: SceneCSSGridLayout) {
  counter++;

  if (counter % 2 === 0) {
    return PanelBuilders.timeseries()
      .setTitle(`Another panel ${counter}`)
      .setData(getQueryRunnerWithRandomWalkQuery())
      .setHeaderActions(<SwitchPanelButton layout={layout} />)
      .build();
  }

  return PanelBuilders.gauge()
    .setTitle(`Another panel ${counter}`)
    .setData(getQueryRunnerWithRandomWalkQuery())
    .setHeaderActions(<SwitchPanelButton layout={layout} />)
    .build();
}

function SwitchPanelButton({ layout }: VizPanelExploreButtonProps) {
  const onClick = () => {
    layout.setState({ children: [getNewPanel(layout), ...layout.state.children.slice(1)] });
  };

  return (
    <Button size="sm" variant="secondary" onClick={onClick}>
      Switch
    </Button>
  );
}

export class RenderBeforeActivationSwitch extends SceneObjectBase {
  public static Component = RenderBeforeActivationSwitchRenderer;
}

function RenderBeforeActivationSwitchRenderer() {
  const location = useLocation();

  const onToggle = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const url = locationUtil.getUrlForPartial(location, {
      renderBeforeActivation: evt.currentTarget.checked ? 'true' : null,
    });
    window.location.href = locationUtil.assureBaseUrl(url);
  };

  return (
    <InlineSwitch
      label="Render before activation"
      showLabel={true}
      value={SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT}
      onChange={onToggle}
    />
  );
}

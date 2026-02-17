import React from 'react';

import {
  SceneFlexLayout,
  SceneTimePicker,
  EmbeddedScene,
  SceneTimeRange,
  VariableValueSelectors,
  SceneControlsSpacer,
  SceneRefreshPicker,
  SceneFlexItem,
  SceneObjectState,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  PanelBuilders,
} from '@grafana/scenes';
import { Button } from '@grafana/ui';

import { getVariablesDefinitions } from './utils';
import { getPromQueryInstant, getPromQueryTimeSeries } from '../demos/utils';
import { prefixRoute } from '../utils/utils.routing';

export function getTrafficScene(): EmbeddedScene {
  const httpHandlersTable = PanelBuilders.table()
    .setData(
      getPromQueryInstant({
        expr: 'sort_desc(avg without(job, instance) (rate(grafana_http_request_duration_seconds_sum[$__rate_interval]) * 1e3)) ',
      })
    )
    .setTitle('Handlers')
    .setOverrides((b) =>
      b
        .matchFieldsWithNameByRegex('.*')
        .overrideFilterable(false)
        .matchFieldsWithName('Value')
        .overrideDisplayName('Duration (Avg)')
        .matchFieldsWithName('handler')
        .overrideLinks([
          {
            title: 'Go to handler drilldown view',
            url: prefixRoute('grafana-monitoring/traffic?handler=${__value.text:percentencode}'),
          },
        ])
    )
    .build();

  const scene = new EmbeddedScene({
    $variables: getVariablesDefinitions(),
    $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({ isOnCanvas: true }),
    ],
    body: new SceneFlexLayout({
      $behaviors: [new HandlerDrilldownViewBehavior()],
      children: [new SceneFlexItem({ body: httpHandlersTable })],
    }),
  });

  return scene;
}

export interface HandlerDrilldownViewBehaviorState extends SceneObjectState {
  handler?: string;
}

export class HandlerDrilldownViewBehavior extends SceneObjectBase<HandlerDrilldownViewBehaviorState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['handler'] });

  constructor() {
    super({});

    this.addActivationHandler(() => {
      this._subs.add(this.subscribeToState((state) => this.onHandlerChanged(state.handler)));
      this.onHandlerChanged(this.state.handler);
    });
  }

  private onHandlerChanged(handler: string | undefined) {
    const layout = this.getLayout();

    if (handler == null) {
      layout.setState({ children: layout.state.children.slice(0, 1) });
    } else {
      layout.setState({ children: [layout.state.children[0], this.getDrilldownView(handler)] });
    }
  }

  private getDrilldownView(handler: string): SceneFlexItem {
    return new SceneFlexItem({
      key: 'drilldown-flex',
      body: PanelBuilders.timeseries()
        .setData(
          getPromQueryTimeSeries({
            expr: `rate(grafana_http_request_duration_seconds_sum{handler="${handler}"}[$__rate_interval]) * 1e3`,
          })
        )
        .setTitle(`Handler: ${handler} details`)
        .setHeaderActions(
          <Button
            size="sm"
            variant="secondary"
            icon="times"
            aria-label="Close"
            onClick={() => this.setState({ handler: undefined })}
          />
        )
        .build(),
    });
  }

  getUrlState() {
    return { handler: this.state.handler };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    if (typeof values.handler === 'string' || values.handler === undefined) {
      this.setState({ handler: values.handler });
    }
  }

  private getLayout() {
    if (this.parent instanceof SceneFlexLayout) {
      return this.parent;
    }

    throw new Error('Invalid parent');
  }
}

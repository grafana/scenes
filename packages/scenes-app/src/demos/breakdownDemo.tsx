import {
  SceneFlexLayout,
  SceneTimeRange,
  EmbeddedScene,
  SceneFlexItem,
  SceneAppPage,
  SceneAppPageState,
  PanelBuilders,
  SceneQueryRunner,
  SceneVariableSet,
  QueryVariable,
  SceneObjectState,
  SceneObjectBase,
  SceneComponentProps,
  SceneObject,
  sceneGraph,
  SceneByFrameRepeater,
  SceneDataNode,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';
import { Button, Tab, TabsBar, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, getFrameDisplayName } from '@grafana/data';

export function getBreakdownDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Example of how a dynamic breakdown scene could work',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              minHeight: 300,
              maxHeight: 500,
              body: PanelBuilders.timeseries()
                .setTitle('HTTP Requests')
                .setOption('legend', { showLegend: false })
                .setCustomFieldConfig('fillOpacity', 9)
                .setData(
                  new SceneQueryRunner({
                    queries: [
                      {
                        refId: 'A',
                        datasource: { uid: 'gdev-prometheus' },
                        expr: 'sum(rate(grafana_http_request_duration_seconds_bucket[$__rate_interval]))',
                      },
                    ],
                  })
                )
                .setHeaderActions(
                  new BreakdownActionButton({
                    isEnabled: false,
                    childIndex: 1,
                    getBreakdownScene: getBreakdownScene,
                  })
                )
                .build(),
            }),
          ],
        }),
        $timeRange: new SceneTimeRange(),
      });
    },
  });
}

export interface BreakdownActionButtonState extends SceneObjectState {
  isEnabled: boolean;
  childIndex: number;
  getBreakdownScene: () => SceneObject;
}

/**
 * Just a proof of concept example of a behavior
 */
export class BreakdownActionButton extends SceneObjectBase<BreakdownActionButtonState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['breakdown'] });
  private _breakdownScene?: SceneObject;

  constructor(state: BreakdownActionButtonState) {
    super(state);

    this.addActivationHandler(() => {
      // Enable breakdown on activation if set by url sync
      if (this.state.isEnabled && !this._breakdownScene) {
        this.addBreakdownScene();
      }
    });
  }

  public getUrlState() {
    return { breakdown: this.state.isEnabled ? '1' : '0' };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (values.breakdown && !this.state.isEnabled) {
      this.setState({ isEnabled: true });
    } else if (this.state.isEnabled) {
      this.setState({ isEnabled: false });
    }
  }

  public onToggle = () => {
    const { isEnabled } = this.state;
    const layout = sceneGraph.getLayout(this)!;

    if (isEnabled) {
      layout.setState({ children: layout.state.children.filter((c) => c !== this._breakdownScene) });
      this.setState({ isEnabled: false });
    } else {
      this.addBreakdownScene();
      this.setState({ isEnabled: true });
    }
  };

  private addBreakdownScene() {
    const { childIndex, getBreakdownScene } = this.state;
    const layout = sceneGraph.getLayout(this)!;

    this._breakdownScene = getBreakdownScene();

    const newChildren = [
      ...layout.state.children.slice(0, childIndex),
      this._breakdownScene,
      ...layout.state.children.slice(childIndex),
    ];

    layout.setState({ children: newChildren });
  }

  public static Component = ({ model }: SceneComponentProps<BreakdownActionButton>) => {
    const { isEnabled } = model.useState();
    return (
      <Button onClick={model.onToggle} variant={isEnabled ? 'primary' : 'secondary'} size="sm">
        Breakdown
      </Button>
    );
  };
}

export interface VariableTabLayoutState extends SceneObjectState {
  variableName: string;
  body: SceneObject;
}

/**
 * Just a proof of concept example of a behavior
 */
export class VariableTabLayout extends SceneObjectBase<VariableTabLayoutState> {
  public onSplitChange = (split: boolean) => {
    if (this.state.body instanceof SplittableLayoutItem) {
      this.state.body.setState({ isSplit: split });
    }
  };

  public getSplitState(): { splittable: boolean; isSplit: boolean } {
    if (this.state.body instanceof SplittableLayoutItem) {
      return { splittable: true, isSplit: this.state.body.state.isSplit };
    }

    return { isSplit: false, splittable: false };
  }

  public static Component = ({ model }: SceneComponentProps<VariableTabLayout>) => {
    const { variableName, body } = model.useState();
    const bodyState = body.useState();
    const styles = useStyles2(getStyles);
    const variable = sceneGraph.lookupVariable(variableName, model);

    if (!variable) {
      return <div>Variable {variableName} not found</div>;
    }

    if (!(variable instanceof QueryVariable)) {
      return <div>Variable not QueryVariable</div>;
    }

    const { loading, options } = variable.useState();
    const radioOptions = [
      { value: false, label: 'Single graph' },
      { value: true, label: 'Split' },
    ];

    let { splittable, isSplit } = model.getSplitState();

    return (
      <div className={styles.container}>
        {loading && <div>Loading...</div>}
        <TabsBar>
          <div className={styles.tabHeading}>Breakdown by label</div>
          {options.map((option, index) => (
            <Tab
              key={index}
              label={option.label}
              active={option.value === variable.state.value}
              onChangeTab={() => variable.changeValueTo(option.value, option.label)}
            />
          ))}
          {splittable && (
            <div className={styles.tabControls}>
              <RadioButtonGroup options={radioOptions} value={isSplit} onChange={model.onSplitChange} />
            </div>
          )}
        </TabsBar>
        <div className={styles.content}>
          <body.Component model={body} />
        </div>
      </div>
    );
  };
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      marginLeft: theme.spacing(2),
      flexGrow: 1,
      display: 'flex',
      minHeight: '100%',
      flexDirection: 'column',
    }),
    content: css({
      flexGrow: 1,
      display: 'flex',
      paddingTop: theme.spacing(2),
    }),
    tabHeading: css({
      paddingRight: theme.spacing(2),
      fontWeight: theme.typography.fontWeightMedium,
    }),
    tabControls: css({
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    }),
  };
}

function getBreakdownScene() {
  return new SceneFlexItem({
    body: new VariableTabLayout({
      $variables: new SceneVariableSet({
        variables: [
          new QueryVariable({
            name: 'groupby',
            label: 'Group by',
            datasource: { uid: 'gdev-prometheus' },
            query: 'label_names(grafana_http_request_duration_seconds_bucket)',
            value: '',
            text: '',
          }),
        ],
      }),
      variableName: 'groupby',
      $data: new SceneQueryRunner({
        queries: [
          {
            refId: 'A',
            datasource: { uid: 'gdev-prometheus' },
            expr: 'sum(rate(grafana_http_request_duration_seconds_bucket[$__rate_interval])) by($groupby)',
          },
        ],
      }),
      body: new SplittableLayoutItem({
        isSplit: false,
        single: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              minHeight: 300,
              body: PanelBuilders.timeseries().setTitle('HTTP Requests').build(),
            }),
          ],
        }),
        split: new SceneByFrameRepeater({
          body: new SceneFlexLayout({
            direction: 'column',
            children: [],
          }),
          getLayoutChild: (data, frame, frameIndex) => {
            return new SceneFlexItem({
              minHeight: 200,
              body: PanelBuilders.timeseries()
                .setTitle(getFrameDisplayName(frame, frameIndex))
                .setData(new SceneDataNode({ data: { ...data, series: [frame] } }))
                .setOption('legend', { showLegend: false })
                .setCustomFieldConfig('fillOpacity', 9)
                .setHeaderActions(
                  new BreakdownActionButton({
                    isEnabled: false,
                    childIndex: frameIndex + 1,
                    getBreakdownScene: () => getSecondLevelBreakdown(getFrameDisplayName(frame, frameIndex)),
                  })
                )
                .build(),
            });
          },
        }),
      }),
    }),
  });
}

function getSecondLevelBreakdown(labelFilter: string) {
  return new SceneFlexItem({
    body: new VariableTabLayout({
      $variables: new SceneVariableSet({
        variables: [
          new QueryVariable({
            name: 'groupby_lvl2',
            label: 'Group by',
            datasource: { uid: 'gdev-prometheus' },
            query: 'label_names(grafana_http_request_duration_seconds_bucket)',
            value: '',
            text: '',
          }),
        ],
      }),
      variableName: 'groupby_lvl2',
      $data: new SceneQueryRunner({
        queries: [
          {
            refId: 'A',
            datasource: { uid: 'gdev-prometheus' },
            expr: `sum(rate(grafana_http_request_duration_seconds_bucket${labelFilter}[$__rate_interval])) by($groupby, $groupby_lvl2)`,
          },
        ],
      }),
      body: new SplittableLayoutItem({
        isSplit: false,
        single: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              minHeight: 300,
              body: PanelBuilders.timeseries().setTitle('HTTP Requests').build(),
            }),
          ],
        }),
        split: new SceneByFrameRepeater({
          body: new SceneFlexLayout({
            direction: 'column',
            children: [],
          }),
          getLayoutChild: (data, frame, frameIndex) => {
            return new SceneFlexItem({
              minHeight: 200,
              body: PanelBuilders.timeseries()
                .setTitle(getFrameDisplayName(frame, frameIndex))
                .setCustomFieldConfig('fillOpacity', 9)
                .setData(new SceneDataNode({ data: { ...data, series: [frame] } }))
                .build(),
            });
          },
        }),
      }),
    }),
  });
}

export interface SplittableLayoutItemState extends SceneObjectState {
  isSplit: boolean;
  single: SceneObject;
  split: SceneObject;
}

export class SplittableLayoutItem extends SceneObjectBase<SplittableLayoutItemState> {
  public static Component = ({ model }: SceneComponentProps<SplittableLayoutItem>) => {
    const { isSplit, split, single } = model.useState();

    return isSplit ? <split.Component model={split} /> : <single.Component model={single} />;
  };
}

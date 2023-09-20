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
} from '@grafana/scenes';
import { getEmbeddedSceneDefaults } from './utils';
import { Button, Tab, TabsBar, TabContent, useStyles2 } from '@grafana/ui';
import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export function getGoupByActionDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Breakdown POC',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              maxHeight: 500,
              body: PanelBuilders.timeseries()
                .setTitle('HTTP Requests')
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
                  new BreakdownBehavior({
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

export interface BreakdownBehaviorState extends SceneObjectState {
  isEnabled: boolean;
  childIndex: number;
  getBreakdownScene: () => SceneObject;
}

/**
 * Just a proof of concept example of a behavior
 */
export class BreakdownBehavior extends SceneObjectBase<BreakdownBehaviorState> {
  private _breakdownScene?: SceneObject;

  public constructor(state: BreakdownBehaviorState) {
    super(state);
  }

  public onToggle = () => {
    const { isEnabled, childIndex, getBreakdownScene } = this.state;
    const layout = sceneGraph.getLayout(this)!;

    if (isEnabled) {
      layout.setState({ children: layout.state.children.filter((c) => c !== this._breakdownScene) });
      this.setState({ isEnabled: false });
      return;
    }

    this._breakdownScene = getBreakdownScene();

    const newChildren = [
      ...layout.state.children.slice(0, childIndex),
      this._breakdownScene,
      ...layout.state.children.slice(childIndex),
    ];

    layout.setState({ children: newChildren });
    this.setState({ isEnabled: true });
  };

  public static Component = ({ model }: SceneComponentProps<BreakdownBehavior>) => {
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
  public constructor(state: VariableTabLayoutState) {
    super(state);
  }

  public static Component = ({ model }: SceneComponentProps<VariableTabLayout>) => {
    const { variableName, body } = model.useState();
    const styles = useStyles2(getStyles);
    const variable = sceneGraph.lookupVariable(variableName, model);

    if (!variable) {
      return <div>Variable {variableName} not found</div>;
    }

    if (!(variable instanceof QueryVariable)) {
      return <div>Variable not QueryVariable</div>;
    }

    const { loading, options } = variable.useState();

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
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({
            body: PanelBuilders.timeseries()
              .setTitle('HTTP Requests')
              .setData(
                new SceneQueryRunner({
                  queries: [
                    {
                      refId: 'A',
                      datasource: { uid: 'gdev-prometheus' },
                      expr: 'sum(rate(grafana_http_request_duration_seconds_bucket[$__rate_interval])) by($groupby)',
                    },
                  ],
                })
              )
              .build(),
          }),
        ],
      }),
    }),
  });
}

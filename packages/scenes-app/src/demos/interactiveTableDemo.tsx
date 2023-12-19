import {
  SceneFlexLayout,
  SceneFlexItem,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  SceneObjectState,
  SceneObjectBase,
  SceneComponentProps,
  sceneGraph,
  SceneObject,
  PanelBuilders,
} from '@grafana/scenes';
import {
  getQueryRunnerWithRandomWalkQuery,
  getEmbeddedSceneDefaults,
  getPromQueryInstant,
  getPromQueryTimeSeries,
} from './utils';
import { InteractiveTable } from '@grafana/ui';
import React, { useMemo, useEffect } from 'react';
import { DataFrameView } from '@grafana/data';

export function getInteractiveTableDemo(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'Interactive table',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery(),
        body: new SceneFlexLayout({
          children: [
            new SceneFlexItem({
              $data: getPromQueryInstant({
                expr: 'sort_desc(avg without(job, instance) (rate(grafana_http_request_duration_seconds_sum[$__rate_interval]) * 1e3))',
              }),
              body: new TableViz({}),
            }),
          ],
        }),
      });
    },
  });
}

interface TableVizState extends SceneObjectState {
  expandedRows?: SceneObject[];
}

class TableViz extends SceneObjectBase<TableVizState> {
  public addExpandedRow(row: SceneObject) {
    this.setState({ expandedRows: [...(this.state.expandedRows ?? []), row] });
  }

  static Component = ({ model }: SceneComponentProps<TableViz>) => {
    const { data } = sceneGraph.getData(model).useState();

    const columns = useMemo(
      () => [
        { id: 'handler', header: 'Handler' },
        { id: 'method', header: 'Method' },
        { id: 'status_code', header: 'Status code' },
        { id: 'Value', header: 'Value' },
      ],
      []
    );

    const tableData = useMemo(() => {
      if (!data || data.series.length === 0) {
        return [];
      }

      const frame = data.series[0];
      const view = new DataFrameView<TableRow>(frame);
      return view.toArray();
    }, [data]);

    return (
      <InteractiveTable
        columns={columns}
        getRowId={(row: any) => row.handler}
        data={tableData}
        renderExpandedRow={(row) => <TableVizExpandedRow tableViz={model} row={row} />}
      />
    );
  };
}

interface TableRow {
  handler: string;
  method: string;
  status_code: string;
  Value: string;
}

interface ExpandedRowProps {
  tableViz: TableViz;
  row: TableRow;
}

function TableVizExpandedRow({ tableViz, row }: ExpandedRowProps) {
  const { expandedRows } = tableViz.useState();

  useEffect(() => {
    const expandedRow = buildExpandedRowScene(row.handler);
    tableViz.addExpandedRow(expandedRow);
  }, [row, tableViz]);

  const rowScene = expandedRows?.find((scene) => scene.state.key === row.handler);

  return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

function buildExpandedRowScene(handler: string) {
  return new SceneFlexLayout({
    key: handler,
    height: 300,
    children: [
      new SceneFlexItem({
        body: PanelBuilders.timeseries()
          .setTitle('Requests / s')
          .setCustomFieldConfig('fillOpacity', 6)
          .setData(
            getPromQueryTimeSeries({
              expr: `sum without(job, instance) (rate(grafana_http_request_duration_seconds_count{handler="${handler}"}[$__rate_interval]))`,
              legendFormat: '{{method}} (status = {{status_code}})',
            })
          )
          .build(),
      }),
    ],
  });
}

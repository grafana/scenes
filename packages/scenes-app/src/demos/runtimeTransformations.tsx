import React, { useSyncExternalStore } from 'react';
import { DataTopic, FieldType, getFieldDisplayName, SelectableValue } from '@grafana/data';
import {
  dataLayers,
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneDataLayerSet,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneQueryRunner,
  SceneReactObject,
  VizPanel,
} from '@grafana/scenes';
import { ControlledCollapse, Grid, MultiSelect, RadioButtonGroup } from '@grafana/ui';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery, getRowWithText } from './utils';

const COLUMN_PICKER_OWNER = 'demo:column-picker';
const SERIES_PICKER_OWNER = 'demo:series-picker';
const ANNOTATION_LIMIT_OWNER = 'demo:annotation-limit';
const ANNOTATION_LIMIT = 3;

const CSV_CONTENT = `service,region,requests,errors,latency_p95
checkout,us-east,1200,12,230
checkout,eu-west,950,4,180
search,us-east,5400,31,95
search,eu-west,4100,18,110
payments,us-east,800,2,410`;

export function getRuntimeTransformationsDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      // Each panel needs its own SceneDataTransformer, since runtime transformations run in the panel's transformer
      const withColumnPicker = getTablePanel('Panel with column picker');
      const withoutColumnPicker = getTablePanel('Panel without runtime transformations');

      const withSeriesPicker = getTimeSeriesPanel();
      const withAnnotations = getAnnotationsPanel();

      withColumnPicker.setState({
        headerActions: <FieldPicker panel={withColumnPicker} owner={COLUMN_PICKER_OWNER} placeholder="Hide columns" />,
      });
      withSeriesPicker.setState({
        headerActions: <FieldPicker panel={withSeriesPicker} owner={SERIES_PICKER_OWNER} placeholder="Hide series" />,
      });
      withAnnotations.setState({ headerActions: <AnnotationLimitToggle panel={withAnnotations} /> });

      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        // Both panels read this single query
        $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'csv_content', csvContent: CSV_CONTENT }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            getRowWithText(
              'Both panels share one query and the same saved sortBy transformation. The column picker sets runtime transformations on the left panel only. They do not re-run the query, do not affect the right panel, and are not part of the panel state.'
            ),
            new SceneFlexItem({
              minHeight: 300,
              body: new SceneFlexLayout({
                direction: 'row',
                children: [
                  new SceneFlexItem({ body: withColumnPicker }),
                  new SceneFlexItem({ body: withoutColumnPicker }),
                ],
              }),
            }),
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneReactObject({
                component: () => (
                  <AppliedTransformations
                    owner={COLUMN_PICKER_OWNER}
                    panels={[withColumnPicker, withoutColumnPicker]}
                  />
                ),
              }),
            }),
            getRowWithText(
              'The same picker works on a time series panel. It hides series by name, and the time field is left out of the options because every frame needs it.'
            ),
            new SceneFlexItem({ minHeight: 300, body: withSeriesPicker }),
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneReactObject({
                component: () => <AppliedTransformations owner={SERIES_PICKER_OWNER} panels={[withSeriesPicker]} />,
              }),
            }),
            getRowWithText(
              `The toggle sets a runtime limit transformation with topic: DataTopic.Annotations, so it keeps the first ${ANNOTATION_LIMIT} annotations and leaves the series untouched.`
            ),
            new SceneFlexItem({ minHeight: 300, body: withAnnotations }),
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneReactObject({
                component: () => <AppliedTransformations owner={ANNOTATION_LIMIT_OWNER} panels={[withAnnotations]} />,
              }),
            }),
          ],
        }),
      });
    },
  });
}

function getTablePanel(title: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(
      new SceneDataTransformer({
        transformations: [{ id: 'sortBy', options: { sort: [{ field: 'requests', desc: true }] } }],
      })
    )
    .build();
}

function getAnnotationsPanel() {
  return PanelBuilders.timeseries()
    .setTitle('Panel with annotation limit')
    .setData(
      new SceneDataTransformer({
        $data: new SceneQueryRunner({
          $data: new SceneDataLayerSet({
            layers: [
              new dataLayers.AnnotationsDataLayer({
                name: 'Annotations',
                query: {
                  datasource: { type: 'testdata', uid: 'gdev-testdata' },
                  enable: true,
                  iconColor: 'purple',
                  name: 'Annotations',
                  target: {
                    // @ts-ignore
                    lines: 10,
                    refId: 'Anno',
                    scenarioId: 'annotations',
                  },
                },
              }),
            ],
          }),
          queries: [{ refId: 'A', datasource: DATASOURCE_REF, scenarioId: 'random_walk' }],
        }),
        transformations: [],
      })
    )
    .build();
}

function getTimeSeriesPanel() {
  return PanelBuilders.timeseries()
    .setTitle('Panel with series picker')
    .setData(
      new SceneDataTransformer({
        $data: getQueryRunnerWithRandomWalkQuery({ seriesCount: 4 }),
        transformations: [],
      })
    )
    .build();
}

function useRuntimeTransformations(panel: VizPanel, owner: string) {
  const runtime = panel.getRuntimeTransformations();

  return useSyncExternalStore(
    (onChange) => runtime.subscribe(owner, onChange),
    () => runtime.get(owner)
  );
}

interface FieldPickerProps {
  panel: VizPanel;
  owner: string;
  placeholder: string;
}

function FieldPicker({ panel, owner, placeholder }: FieldPickerProps) {
  const runtime = panel.getRuntimeTransformations();
  const transformations = useRuntimeTransformations(panel, owner);

  // Re-render when the panel data changes so the options track the source columns
  sceneGraph.getData(panel).useState();

  // Source series still contain the fields this owner hides, so hidden fields stay selectable
  const columns = new Set(
    runtime
      .getSourceSeries(owner)
      .flatMap((frame) =>
        frame.fields.filter((field) => field.type !== FieldType.time).map((field) => getFieldDisplayName(field, frame))
      )
  );
  const options = Array.from(columns, (name) => ({ label: name, value: name }));
  const excludeByName: Record<string, boolean> = transformations[0]?.options.excludeByName ?? {};

  const onChange = (selected: Array<SelectableValue<string>>) => {
    const hidden = selected.map((item) => item.value!);

    runtime.set(
      owner,
      hidden.length > 0
        ? [{ id: 'organize', options: { excludeByName: Object.fromEntries(hidden.map((name) => [name, true])) } }]
        : []
    );
  };

  return (
    <MultiSelect
      placeholder={placeholder}
      options={options}
      value={Object.keys(excludeByName)}
      onChange={onChange}
      width={40}
    />
  );
}

function AnnotationLimitToggle({ panel }: { panel: VizPanel }) {
  const runtime = panel.getRuntimeTransformations();
  const limited = useRuntimeTransformations(panel, ANNOTATION_LIMIT_OWNER).length > 0;

  const onChange = (value: boolean) => {
    runtime.set(
      ANNOTATION_LIMIT_OWNER,
      value ? [{ id: 'limit', topic: DataTopic.Annotations, options: { limitField: ANNOTATION_LIMIT } }] : []
    );
  };

  return (
    <RadioButtonGroup
      size="sm"
      options={[
        { label: 'All annotations', value: false },
        { label: `First ${ANNOTATION_LIMIT}`, value: true },
      ]}
      value={limited}
      onChange={onChange}
    />
  );
}

function AppliedTransformations({ owner, panels }: { owner: string; panels: VizPanel[] }) {
  return (
    <ControlledCollapse label="Applied runtime transformations" isOpen={false}>
      {/* Matches the panel row above: one equal-width column per panel with the same gap */}
      <Grid columns={panels.length === 1 ? 1 : 2} gap={1}>
        {panels.map((panel) => (
          <PanelTransformations key={panel.state.key} owner={owner} panel={panel} />
        ))}
      </Grid>
    </ControlledCollapse>
  );
}

function PanelTransformations({ owner, panel }: { owner: string; panel: VizPanel }) {
  const transformations = useRuntimeTransformations(panel, owner);

  return (
    <div>
      <h6>{panel.state.title}</h6>
      <pre>{JSON.stringify({ [owner]: transformations }, null, 2)}</pre>
    </div>
  );
}

import React, { useState } from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneReactObject,
  VizPanel,
} from '@grafana/scenes';
import { Button, ControlledCollapse, Grid, Stack } from '@grafana/ui';
import { PanelTransformations } from './runtimeTransformations';
import { getEmbeddedSceneDefaults, getQueryRunnerWithRandomWalkQuery, getRowWithText } from './utils';

const OWNER = 'demo:clone-bug';

const CSV_CONTENT = `service,region,requests,errors
checkout,us-east,1200,12
search,us-east,5400,31
payments,us-east,800,2`;

export function getRuntimeTransformationsCloneBugDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      // No $data on the transformer, so it reads the scene query below; with its own $data the bug does not reproduce
      const original = PanelBuilders.table()
        .setTitle('Original')
        .setData(
          new SceneDataTransformer({
            transformations: [{ id: 'sortBy', options: { sort: [{ field: 'requests', desc: true }] } }],
          })
        )
        .build();

      const originalItem = new SceneFlexItem({ body: original });
      const cloneItem = new SceneFlexItem({ body: new SceneReactObject({ component: () => null }) });

      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'csv_content', csvContent: CSV_CONTENT }),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            getRowWithText(
              'Run the steps in order. The clone should show the sorted table without the runtime transformation. Before the fix it stayed empty, because its transformer inherited the memo of a pass that ran before the runtime owner existed. Reload the page to run it again.'
            ),
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneReactObject({
                component: () => <Steps original={original} originalItem={originalItem} cloneItem={cloneItem} />,
              }),
            }),
            new SceneFlexItem({
              minHeight: 250,
              body: new SceneFlexLayout({ direction: 'row', children: [originalItem, cloneItem] }),
            }),
            new SceneFlexItem({
              ySizing: 'content',
              body: new SceneReactObject({
                component: () => <AppliedTransformations original={original} cloneItem={cloneItem} />,
              }),
            }),
          ],
        }),
      });
    },
  });
}

function AppliedTransformations({ original, cloneItem }: { original: VizPanel; cloneItem: SceneFlexItem }) {
  const { body } = cloneItem.useState();
  const clone = body instanceof VizPanel ? body : undefined;

  return (
    <ControlledCollapse label="Applied runtime transformations" isOpen={true}>
      <Grid columns={2} gap={1}>
        <PanelTransformations owner={OWNER} panel={original} />
        {clone && <PanelTransformations owner={OWNER} panel={clone} />}
      </Grid>
    </ControlledCollapse>
  );
}

interface StepsProps {
  original: VizPanel;
  originalItem: SceneFlexItem;
  cloneItem: SceneFlexItem;
}

function Steps({ original, originalItem, cloneItem }: StepsProps) {
  const [step, setStep] = useState(0);
  const [cloneData, setCloneData] = useState<string>();

  const steps = [
    {
      label: '1. Hide original (deactivates its transformer)',
      run: () => originalItem.setState({ isHidden: true }),
    },
    {
      label: '2. Set runtime transformation while inactive',
      run: () =>
        original
          .getRuntimeTransformations()
          .set(OWNER, [{ id: 'organize', options: { excludeByName: { errors: true } } }]),
    },
    {
      label: '3. Clone original and show the clone',
      run: () => {
        const clone = original.clone({ title: 'Clone' });
        cloneItem.setState({ body: clone });

        // Read after the clone has activated and had a chance to transform
        setTimeout(() => {
          const data = (clone.state.$data as SceneDataTransformer).state.data;
          setCloneData(data ? `${data.series.length} frame(s)` : 'undefined');
        }, 500);
      },
    },
  ];

  return (
    <Stack direction="column" gap={1}>
      <Stack gap={1}>
        {steps.map(({ label, run }, i) => (
          <Button
            key={label}
            size="sm"
            variant={i === step ? 'primary' : 'secondary'}
            disabled={i !== step}
            onClick={() => {
              run();
              setStep(i + 1);
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>
      {cloneData && <div>Clone transformer state.data: {cloneData}</div>}
    </Stack>
  );
}

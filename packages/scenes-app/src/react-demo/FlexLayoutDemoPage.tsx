import React from 'react';
import { PageWrapper } from './PageWrapper';
import { PlainGraphWithRandomWalk } from './PlainGraphWithRandomWalk';
import { DemoSubTitle } from '../pages/DemoSubTitle';
import { SceneFlexItem, SceneFlexLayout } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';

export function FlexLayoutDemoPage() {
  return (
    <PageWrapper
      title="Flex layout (scenes-react)"
      subTitle={
        <DemoSubTitle
          text={'Using SceneFlexLayout/SceneFlexItem as React components (no manual Scene object construction).'}
          getSourceCodeModule={() => import('!!raw-loader!./FlexLayoutDemoPage')}
        />
      }
    >
      <Stack direction="column" gap={2}>
        <SceneFlexLayout direction="row" wrap="wrap" minHeight={640}>
          <SceneFlexItem minWidth={400} minHeight={320}>
            <PlainGraphWithRandomWalk title="A Panel" />
          </SceneFlexItem>
          <SceneFlexItem minWidth={400} minHeight={320}>
            <PlainGraphWithRandomWalk title="B Panel" />
          </SceneFlexItem>
          <SceneFlexItem minWidth={400} minHeight={320}>
            <PlainGraphWithRandomWalk title="C Panel" />
          </SceneFlexItem>
          <SceneFlexItem minWidth={400} minHeight={320}>
            <PlainGraphWithRandomWalk title="D Panel" />
          </SceneFlexItem>
        </SceneFlexLayout>
      </Stack>
    </PageWrapper>
  );
}

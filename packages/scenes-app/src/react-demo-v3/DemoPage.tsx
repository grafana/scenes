import { PluginPage } from '@grafana/runtime';
import { DemoV3 } from '@grafana/scenes-rethink';
import React from 'react';

export function ReactDemoV3Page() {
  return (
    <PluginPage pageNav={{ text: 'demo v3' }} subTitle={'hello'}>
      <DemoV3 />
    </PluginPage>
  );
}

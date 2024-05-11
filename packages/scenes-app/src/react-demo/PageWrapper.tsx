import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { RTimeRangePicker, RVariableSelect } from '@grafana/scenes';
import React from 'react';

export interface Props {
  title: string;
  subTitle: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, subTitle, children }: Props) {
  const pageNav: NavModelItem = { text: title };

  return (
    <PluginPage pageNav={pageNav} subTitle={subTitle} actions={<PageActions />}>
      {children}
    </PluginPage>
  );
}

function PageActions() {
  return (
    <>
      <RVariableSelect name="env" />
      <RTimeRangePicker />
    </>
  );
}

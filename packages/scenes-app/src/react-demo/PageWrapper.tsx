import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { BreadcrumbContext, RRefreshPicker, RTimeRangePicker, RVariableSelect } from '@grafana/scenes';
import React, { useContext } from 'react';

export interface Props {
  title: string;
  subTitle: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, subTitle, children }: Props) {
  const pageNav: NavModelItem = { text: title };
  const { breadcrumbs } = useContext(BreadcrumbContext);

  if (breadcrumbs.length > 0) {
    let current = pageNav;

    for (const breadcrumb of breadcrumbs) {
      if (breadcrumb.text === title) {
        break;
      }

      current.parentItem = { text: breadcrumb.text, url: breadcrumb.url };
    }
  }

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
      <RRefreshPicker withText />
    </>
  );
}

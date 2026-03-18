import { NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { BreadcrumbContext, RefreshPicker, TimeRangePicker, VariableControl } from '@grafana/scenes-react';
import React, { useContext } from 'react';

export interface Props {
  title: string;
  subTitle: React.ReactNode;
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
      <VariableControl name="env" />
      <TimeRangePicker />
      <RefreshPicker withText={true} />
    </>
  );
}

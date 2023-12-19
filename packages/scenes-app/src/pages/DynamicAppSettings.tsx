import { SceneObjectState, SceneObjectBase, SceneComponentProps } from '@grafana/scenes';
import React from 'react';
import { DataSourceInstanceSettings } from '@grafana/data';
import { Button, Field, Switch, VerticalGroup } from '@grafana/ui';
import { DataSourcePicker } from '@grafana/runtime';
import { getDynamicApp } from './shared';

export class DynamicAppSettings extends SceneObjectBase<SceneObjectState> {
  public onChangeDataSource = (ds: DataSourceInstanceSettings) => {
    getDynamicApp(this).onChangeSettings({ initialDataSource: ds.uid });
  };

  public onChangeShowPanelDescriptions = (evt: React.ChangeEvent<HTMLInputElement>) => {
    getDynamicApp(this).onChangeSettings({ showPanelDescriptions: evt.currentTarget.checked });
  };

  static Component = ({ model }: SceneComponentProps<DynamicAppSettings>) => {
    const app = getDynamicApp(model);
    const { settings } = app.useState();

    return (
      <VerticalGroup>
        <Field label="Default data source">
          <DataSourcePicker
            current={settings?.initialDataSource}
            pluginId="grafana-testdata-datasource"
            onChange={model.onChangeDataSource}
          />
        </Field>

        <Field label="Show panel descriptions">
          <Switch value={settings?.showPanelDescriptions ?? false} onChange={model.onChangeShowPanelDescriptions} />
        </Field>

        {!settings?.isConfigured && <Button onClick={app.onCompleteSetup}>Complete setup</Button>}
      </VerticalGroup>
    );
  };
}

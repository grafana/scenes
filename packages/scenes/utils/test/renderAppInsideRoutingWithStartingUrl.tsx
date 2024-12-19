import React from 'react';
import { locationService } from '@grafana/runtime';
import { render } from '@testing-library/react';
import { SceneApp } from '../../src/components/SceneApp/SceneApp';
import { TestContextProviderBase } from './TestContextProvider';

export function renderAppInsideRouterWithStartingUrl(app: SceneApp, startingUrl: string) {
  locationService.push(startingUrl);

  return render(
    <TestContextProviderBase>
      <app.Component model={app} />
    </TestContextProviderBase>
  );
}

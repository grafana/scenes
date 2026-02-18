import React from 'react';
import { locationService } from '@grafana/runtime';
import { render } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { SceneApp } from '../../src/components/SceneApp/SceneApp';
import { TestContextProviderBase } from './TestContextProvider';

export function renderAppInsideRouterWithStartingUrl(app: SceneApp, startingUrl: string) {
  locationService.push(startingUrl);

  return render(
    <TestContextProviderBase>
      <Routes>
        <Route path="/*" element={<app.Component model={app} />} />
      </Routes>
    </TestContextProviderBase>
  );
}

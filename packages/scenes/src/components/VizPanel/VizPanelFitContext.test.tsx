import React from 'react';
import { render, screen } from '@testing-library/react';
import { PanelProps } from '@grafana/data';

import { getPanelPlugin } from '../../../utils/test/__mocks__/pluginMocks';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { VizPanel } from './VizPanel';
import { VizPanelFitScope, VizPanelFitScopeProps } from './VizPanelFitContext';

let panelProps: (PanelProps & { fitContent?: boolean; fitMaxHeight?: number }) | undefined;
let panelChromeProps: Record<string, unknown> | undefined;

const panelPlugin = getPanelPlugin({ id: 'fit-plugin-id', skipDataQuery: true }, (props) => {
  panelProps = props;
  return <div>My fit panel</div>;
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getPluginImportUtils: () => ({
    getPanelPluginFromCache: () => panelPlugin,
    importPanelPlugin: () => Promise.resolve(panelPlugin),
  }),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 500, height: 500 }],
}));

// The published PanelChrome ignores maxHeight. Size the inner height to the cap like grafana/grafana#136044 does.
jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  const PanelChrome = Object.assign((props: Record<string, unknown>) => {
    panelChromeProps = props;
    return <actual.PanelChrome {...props} height={props.height ?? props.maxHeight} />;
  }, actual.PanelChrome);
  return { ...actual, PanelChrome };
});

async function renderInScope(scope: Omit<VizPanelFitScopeProps, 'children'>) {
  const panel = new VizPanel({ pluginId: 'fit-plugin-id', title: '', $timeRange: new SceneTimeRange() });
  render(
    <VizPanelFitScope {...scope}>
      <panel.Component model={panel} />
    </VizPanelFitScope>
  );
  expect(await screen.findByText('My fit panel')).toBeInTheDocument();
}

describe('VizPanelFitScope', () => {
  beforeEach(() => {
    panelProps = undefined;
    panelChromeProps = undefined;
  });

  it('ignores minHeight and maxHeight when disabled', async () => {
    await renderInScope({ enabled: false, minHeight: 100, maxHeight: 300 });

    expect(panelChromeProps).toMatchObject({ height: 500, minHeight: undefined, maxHeight: undefined });
    expect(panelProps?.height).toBeGreaterThan(0);
    expect(panelProps?.fitContent).toBeUndefined();
    expect(panelProps?.fitMaxHeight).toBeUndefined();
  });

  it('gives the panel no height or fitMaxHeight without maxHeight', async () => {
    await renderInScope({ enabled: true, minHeight: 100 });

    expect(panelChromeProps).toMatchObject({ height: undefined, minHeight: 100, maxHeight: undefined });
    expect(panelProps?.height).toBe(0);
    expect(panelProps?.fitContent).toBe(true);
    expect(panelProps?.fitMaxHeight).toBeUndefined();
  });

  it('passes maxHeight to the chrome and the inner height it leaves as fitMaxHeight', async () => {
    await renderInScope({ enabled: true, minHeight: 100, maxHeight: 300 });

    expect(panelChromeProps).toMatchObject({ height: undefined, maxHeight: 300 });
    expect(panelProps?.height).toBe(0);
    expect(panelProps?.fitContent).toBe(true);
    expect(panelProps?.fitMaxHeight).toBeGreaterThan(0);
    expect(panelProps?.fitMaxHeight).toBeLessThan(300);
  });
});

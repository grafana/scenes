import React from 'react';
import { render } from '@testing-library/react';
import { PanelChrome } from '@grafana/ui';

import { getPanelPlugin } from '../../../utils/test/__mocks__/pluginMocks';
import { VizPanel } from './VizPanel';
import { VizPanelHeaderMenuScope } from './VizPanelHeaderMenuContext';
import { VizPanelMenu } from './VizPanelMenu';

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  // Wraps the real PanelChrome (keeping its static subcomponents) so the props it receives can be asserted
  return { ...actual, PanelChrome: Object.assign(jest.fn(actual.PanelChrome), actual.PanelChrome) };
});

const plugin = getPanelPlugin({ id: 'custom-plugin-id' }, () => <div>My custom panel</div>);

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getPluginImportUtils: () => ({
    getPanelPluginFromCache: () => plugin,
    importPanelPlugin: () => Promise.resolve(plugin),
  }),
}));

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 500, height: 500 }],
}));

function getLastPanelChromeProps() {
  const calls = jest.mocked(PanelChrome).mock.calls;
  return calls[calls.length - 1][0];
}

describe('VizPanelHeaderMenuScope', () => {
  let panel: VizPanel;

  beforeAll(() => {
    // The panel title's truncation measures itself
    global.ResizeObserver = class {
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      observe() {}
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      unobserve() {}
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      disconnect() {}
    };
  });

  beforeEach(() => {
    jest.mocked(PanelChrome).mockClear();
    panel = new VizPanel({ title: 'Menu Panel', pluginId: 'custom-plugin-id', menu: new VizPanelMenu({}) });
    panel.activate();
  });

  it.each([
    { desc: 'with hideOnHover', hideOnHover: true },
    { desc: 'without hideOnHover', hideOnHover: false },
  ])('passes hideMenuOnHover to the panel chrome $desc', ({ hideOnHover }) => {
    render(
      <VizPanelHeaderMenuScope hideOnHover={hideOnHover}>
        <panel.Component model={panel} />
      </VizPanelHeaderMenuScope>
    );

    expect(getLastPanelChromeProps()).toEqual(expect.objectContaining({ hideMenuOnHover: hideOnHover }));
  });

  it('does not hide the header menu on hover outside a scope', () => {
    render(<panel.Component model={panel} />);

    expect(getLastPanelChromeProps()).toEqual(expect.objectContaining({ hideMenuOnHover: false }));
  });
});

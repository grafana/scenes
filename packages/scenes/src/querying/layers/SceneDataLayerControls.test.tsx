import { selectors } from '@grafana/e2e-selectors';
import { act, render, screen } from '@testing-library/react';
import { DataLayerControlSwitch } from './SceneDataLayerControls';
import { TestAnnotationsDataLayer } from './TestDataLayer';

describe('SceneDataLayerControl', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  it('renders loading indicator when layers state is Loading', () => {
    const layer = new TestAnnotationsDataLayer({
      name: 'Layer 1',
    });

    render(<DataLayerControlSwitch layer={layer} />);
    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(0);

    act(() => {
      layer.activate();
    });

    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(0);

    act(() => {
      layer.startRun();
    });
    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(1);

    act(() => {
      layer.completeRun();
    });
    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(0);

    act(() => {
      layer.startRun();
    });
    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(1);

    act(() => {
      layer.completeRunWithError();
    });
    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(0);
  });

  it('hides loading indicator when query canceled by loading indicator click', async () => {
    const layer = new TestAnnotationsDataLayer({
      name: 'Layer 1',
    });

    render(<DataLayerControlSwitch layer={layer} />);

    act(() => {
      layer.activate();
      layer.startRun();
    });
    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(1);

    act(() => {
      layer.cancelQuery();
    });

    expect(screen.queryAllByLabelText(selectors.components.LoadingIndicator.icon)).toHaveLength(0);
  });
});

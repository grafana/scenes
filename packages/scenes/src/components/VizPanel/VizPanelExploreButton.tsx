import React from 'react';

import { LinkButton } from '@grafana/ui';
import { DataQuery } from '@grafana/schema';
import { useAsync } from 'react-use';
import { SceneComponentProps, SceneObjectState } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { getExploreURL } from '../../utils/explore';

export interface ExploreButtonOptions {
  // Callback to hook in tracking / analytics
  onClick?: () => void;

  // Callback to modify interpolated query before passing it to explore
  transform?: (query: DataQuery) => DataQuery;
}

interface ExploreButtonState extends SceneObjectState {
  options: ExploreButtonOptions;
}

export class VizPanelExploreButton extends SceneObjectBase<ExploreButtonState> {
  static Component = VizPanelExploreButtonComponent;

  public constructor(options: ExploreButtonOptions = {}) {
    super({ options });
  }
}

function VizPanelExploreButtonComponent({ model }: SceneComponentProps<VizPanelExploreButton>) {
  const { options } = model.useState();

  const { data } = sceneGraph.getData(model).useState();

  const { from, to } = sceneGraph.getTimeRange(model).useState();

  const { value: exploreLink } = useAsync(
    async () => (data ? getExploreURL(data, model, { from, to }, options.transform) : ''),
    [data, model, from, to]
  );

  if (exploreLink) {
    return (
      <LinkButton
        key="explore"
        icon="compass"
        size="sm"
        variant="secondary"
        href={exploreLink}
        onClick={options.onClick}
      >
        Explore
      </LinkButton>
    );
  }
  return null;
}

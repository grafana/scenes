import { Trans } from '@grafana/i18n';

import { LinkButton } from '@grafana/ui';
import { DataQuery } from '@grafana/schema';
import { useAsync } from 'react-use';
import { SceneComponentProps, SceneObjectState } from '../../core/types';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { getExploreURL } from '../../utils/explore';
import { useReturnToPrevious } from '@grafana/runtime';

export interface ExploreButtonOptions {
  // Callback to hook in tracking / analytics
  onClick?: () => void;

  // Callback to modify interpolated query before passing it to explore
  transform?: (query: DataQuery) => DataQuery;

  // Title and href for the return to previous button
  returnToPrevious?: {
    title: string;
    href?: string;
  };
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

  const { value: exploreLink } = useAsync(async () => {
    if (!data) {
      return '';
    }

    return getExploreURL(data, model, { from, to }, options.transform);
  }, [data, model, from, to]);

  const returnToPrevious = useReturnToPrevious();

  if (exploreLink) {
    return (
      <LinkButton
        key="explore"
        icon="compass"
        size="sm"
        variant="secondary"
        href={exploreLink}
        onClick={() => {
          if (options.returnToPrevious) {
            returnToPrevious(options.returnToPrevious.title, options.returnToPrevious.href);
          }
          options.onClick?.();
        }}
      >
        <Trans i18nKey="grafana-scenes.components.viz-panel-explore-button.explore">Explore</Trans>
      </LinkButton>
    );
  }
  return null;
}

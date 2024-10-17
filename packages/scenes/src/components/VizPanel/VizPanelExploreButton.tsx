import React, { useMemo } from 'react';

import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { LinkButton } from '@grafana/ui';
import { DataQuery } from '@grafana/schema';
import { getDataSourceSrv } from '@grafana/runtime';
import { ScopedVars } from '@grafana/data';
import { useAsync } from 'react-use';

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

  const targets = useMemo(() => data?.request?.targets ?? [], [data]);

  const { from, to } = sceneGraph.getTimeRange(model).useState();

  const { value: interpolatedQueries } = useAsync(async () => {
    const scopedVars: ScopedVars = {
      __sceneObject: { text: '__sceneObject', value: model },
    };
    return (
      await Promise.allSettled(
        targets.map(async (q) => {
          const queryDs = await getDataSourceSrv().get(q.datasource);
          return queryDs.interpolateVariablesInQueries?.([q], scopedVars ?? {})[0] || q;
        })
      )
    )
      .filter((promise): promise is PromiseFulfilledResult<DataQuery> => promise.status === 'fulfilled')
      .map((q) => q.value)
      .map((q) => options.transform?.(q) ?? q);
  }, [targets, model]);

  const left = useMemo(() => {
    const queries: DataQuery[] = interpolatedQueries ?? [];

    const datasource = queries.find((query) => !!query.datasource?.uid)?.datasource?.uid;

    if (queries?.length && datasource && from && to) {
      return encodeURIComponent(
        JSON.stringify({
          datasource,
          queries,
          range: {
            from,
            to,
          },
        })
      );
    }
    return '';
  }, [interpolatedQueries, from, to]);

  if (left) {
    return (
      <LinkButton
        key="explore"
        icon="compass"
        size="sm"
        variant="secondary"
        href={`/explore?left=${left}`}
        onClick={options.onClick}
      >
        Explore
      </LinkButton>
    );
  }
  return null;
}

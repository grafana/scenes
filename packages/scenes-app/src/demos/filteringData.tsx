import React from 'react';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneAppPage,
  SceneAppPageState,
  SceneComponentProps,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
} from '@grafana/scenes';
import { Input } from '@grafana/ui';
import { getEmbeddedSceneDefaults } from './utils';
import { ControlsLabel } from '@grafana/scenes/src/utils/ControlsLabel';
import { DataTransformerConfig, MatcherConfig } from '@grafana/schema';
import { BasicValueMatcherOptions, DataTransformerID, ValueMatcherID } from '@grafana/data';
import { DATASOURCE_REF } from '../constants';

export function getDataFilteringTest(defaults: SceneAppPageState) {
  const searchBox = new SearchBox({ value: '' });

  const data = new SceneQueryRunner({
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'random_walk_table',
      },
    ],
  });

  const filteredData = new SceneDataTransformer({
    $data: data,
    transformations: [getTableFilterTransform('')],
  });

  /**
   * When filteredData activates, we subscribe to changes to the search box and update the transform accordingly
   */
  filteredData.addActivationHandler(() => {
    const sub = searchBox.subscribeToState((state) => {
      // Update transform and re-process them
      filteredData.setState({ transformations: [getTableFilterTransform(state.value)] });
      filteredData.reprocessTransformations();
    });

    return () => sub.unsubscribe();
  });

  const tablePanel = PanelBuilders.table().setData(filteredData).build();

  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        key: 'Flex layout embedded scene',
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              minWidth: '70%',
              body: tablePanel,
            }),
          ],
        }),

        controls: [searchBox],
      });
    },
  });
}

export interface SearchBoxState extends SceneObjectState {
  value: string;
}

export class SearchBox extends SceneObjectBase<SearchBoxState> {
  onChange = (evt: React.FormEvent<HTMLInputElement>) => {
    this.setState({ value: evt.currentTarget.value });
  };

  static Component = ({ model }: SceneComponentProps<SearchBox>) => {
    const { value } = model.useState();

    return (
      <div style={{ display: 'flex' }}>
        <ControlsLabel label="Search by Info" htmlFor={'search-box'} />
        <Input id="search-box" width={25} placeholder="i.e. ^up" value={value} onChange={model.onChange} />
      </div>
    );
  };
}

export function getTableFilterTransform(query: string): DataTransformerConfig {
  const regex: MatcherConfig<BasicValueMatcherOptions<string>> = {
    id: ValueMatcherID.regex,
    options: { value: query },
  };

  return {
    id: DataTransformerID.filterByValue,
    options: {
      type: 'include',
      match: 'all',
      filters: [
        {
          fieldName: 'Info',
          config: regex,
        },
      ],
    },
  };
}

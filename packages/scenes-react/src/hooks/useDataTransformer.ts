import {
  CustomTransformerDefinition,
  DataProviderProxy,
  SceneDataProvider,
  SceneDataTransformer,
} from '@grafana/scenes';
import { useSceneContext } from './hooks';
import { useEffect, useId } from 'react';
import { DataTransformerConfig } from '@grafana/schema';
import { useAddToScene } from '../contexts/SceneContextObject';

export interface UseDataTransformerOptions {
  transformations: Array<DataTransformerConfig | CustomTransformerDefinition>;
  data: SceneDataProvider;
}

export function useDataTransformer(options: UseDataTransformerOptions) {
  const scene = useSceneContext();
  const key = useId();

  let dataTransformer = scene.findByKey<SceneDataTransformer>(key);

  if (!dataTransformer) {
    dataTransformer = new SceneDataTransformer({
      key: key,
      $data: new DataProviderProxy({ source: options.data.getRef() }),
      transformations: options.transformations,
    });
  }

  useAddToScene(dataTransformer, scene);

  useEffect(() => {
    // Replaces only the user transformations, so runtime ones added via setSystemTransformations survive
    dataTransformer.setUserTransformations(options.transformations);
  }, [dataTransformer, options.transformations]);

  return dataTransformer;
}

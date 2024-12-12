import { SceneDataTransformer, DataProviderProxy } from '@grafana/scenes';
import { useSceneContext } from './hooks.js';
import { useId, useEffect } from 'react';
import { isEqual } from 'lodash';

function useDataTransformer(options) {
  const scene = useSceneContext();
  const key = useId();
  let dataTransformer = scene.findByKey(key);
  if (!dataTransformer) {
    dataTransformer = new SceneDataTransformer({
      key,
      $data: new DataProviderProxy({ source: options.data.getRef() }),
      transformations: options.transformations
    });
  }
  useEffect(() => scene.addToScene(dataTransformer), [dataTransformer, scene]);
  useEffect(() => {
    if (!isEqual(dataTransformer.state.transformations, options.transformations)) {
      dataTransformer.setState({ transformations: options.transformations });
      dataTransformer.reprocessTransformations();
    }
  }, [dataTransformer, options.transformations]);
  return dataTransformer;
}

export { useDataTransformer };
//# sourceMappingURL=useDataTransformer.js.map

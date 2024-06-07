import { CustomTransformerDefinition, SceneDataProvider, SceneDataTransformer } from "@grafana/scenes"
import { useSceneContext } from "./hooks";
import { useEffect, useId } from "react";
import { isEqual } from "lodash";
import { DataTransformerConfig } from "@grafana/schema";
import { DataProxyProvider } from "../DataProxyProvider";

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
      $data: new DataProxyProvider({ source: options.data.getRef() }),
      transformations: options.transformations,
    });
  }

  useEffect(() => scene.addToScene(dataTransformer));

  useEffect(() => {
    if (!isEqual(dataTransformer.state.transformations, options.transformations)) {
      dataTransformer.setState({ transformations: options.transformations });
      dataTransformer.reprocessTransformations();
    }
  });

  return dataTransformer;
}

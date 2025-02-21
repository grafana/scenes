import React, { useEffect, useState } from 'react';
import { useSceneContext } from '../hooks/hooks';
import { AnnotationQuery } from '@grafana/data';
import { SceneDataLayerSet, dataLayers } from '@grafana/scenes';
import { SceneContextObject } from '../contexts/SceneContextObject';
import { writeSceneLog } from '../utils';

export interface AnnotationLayerSetProps {
  name: string;
  query: AnnotationQuery;
  children: React.ReactNode;
}

export function AnnotationLayer({ name, query, children }: AnnotationLayerSetProps): React.ReactNode {
  const scene = useSceneContext();
  const [annotationAdded, setAnnotationAdded] = useState<boolean>();

  let annotation: dataLayers.AnnotationsDataLayer | undefined = findAnnotationLayer(scene, name);

  if (!annotation) {
    annotation = new dataLayers.AnnotationsDataLayer({ name, query });
  }

  useEffect(() => {
    const removeFn = addAnnotationLayer(scene, annotation);
    setAnnotationAdded(true);
    return removeFn;
  }, [scene, name, annotation]);

  useEffect(() => {
    // Handle prop changes
  }, [annotationAdded]);

  if (!annotationAdded) {
    return null;
  }

  return children;
}

function findAnnotationLayer<T>(scene: SceneContextObject, name: string): T | undefined {
  const annotations = scene.state.$data as SceneDataLayerSet;

  if (!annotations) {
    return;
  }

  return annotations.state.layers.find((anno) => anno.state.name === name) as T;
}

function addAnnotationLayer(scene: SceneContextObject, layer: dataLayers.AnnotationsDataLayer) {
  let set = scene.state.$data as SceneDataLayerSet;

  if (set) {
    set.setState({ layers: [...set.state.layers, layer] });
  } else {
    set = new SceneDataLayerSet({ layers: [layer] });
    scene.setState({ $data: set });
  }

  writeSceneLog('SceneContext', `Adding annotation data layer: ${layer.state.name} key: ${layer.state.key}`);

  return () => {
    set.setState({ layers: set.state.layers.filter((x) => x !== layer) });
    writeSceneLog('SceneContext', `Removing annotation data layer: ${layer.state.name} key: ${layer.state.key}`);
  };
}

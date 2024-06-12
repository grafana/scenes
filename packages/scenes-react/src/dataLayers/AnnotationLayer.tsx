import React, { useEffect, useState } from 'react';
import { useSceneContext } from '../hooks/hooks';
import { AnnotationQuery } from '@grafana/data';
import { dataLayers } from '@grafana/scenes';

export interface AnnotationLayerSetProps {
  name: string;
  query: AnnotationQuery;
  children: React.ReactNode;
}

export function AnnotationLayer({ name, query, children }: AnnotationLayerSetProps): React.ReactNode {
  const scene = useSceneContext();
  const [annotationSetAdded, setAnnotationSetAdded] = useState<boolean>();

  let annotation: dataLayers.AnnotationsDataLayer | undefined = scene.findAnnotationLayer(name);

  if (!annotation) {
    annotation = new dataLayers.AnnotationsDataLayer({ name, query });
  }

  useEffect(() => {
    const removeFn = scene.addAnnotationLayer(annotation);
    setAnnotationSetAdded(true);
    return removeFn;
  }, [scene, name, annotation]);

  useEffect(() => {
    // Handle prop changes
  }, [annotationSetAdded]);

  if (!annotationSetAdded) {
    return null;
  }

  return children;
}

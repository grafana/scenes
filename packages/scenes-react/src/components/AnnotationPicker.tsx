import React, { useEffect, useId } from 'react';
import { useSceneContext } from '../hooks/hooks';
import { SceneDataLayerControls } from '@grafana/scenes';

export interface Props {}

export function AnnotationPicker(props: Props) {
  const scene = useSceneContext();
  const key = useId();

  let picker = scene.findByKey<SceneDataLayerControls>(key);

  if (!picker) {
    picker = new SceneDataLayerControls();
  }

  useEffect(() => scene.addToScene(picker), [picker, scene]);

  return <picker.Component model={picker} />;
}

import { useState, useEffect } from 'react';
import { useSceneContext } from '../hooks/hooks.js';
import { dataLayers, SceneDataLayerSet } from '@grafana/scenes';
import { writeSceneLog } from '../utils.js';

function AnnotationLayer({ name, query, children }) {
  const scene = useSceneContext();
  const [annotationAdded, setAnnotationAdded] = useState();
  let annotation = findAnnotationLayer(scene, name);
  if (!annotation) {
    annotation = new dataLayers.AnnotationsDataLayer({ name, query });
  }
  useEffect(() => {
    const removeFn = addAnnotationLayer(scene, annotation);
    setAnnotationAdded(true);
    return removeFn;
  }, [scene, name, annotation]);
  useEffect(() => {
  }, [annotationAdded]);
  if (!annotationAdded) {
    return null;
  }
  return children;
}
function findAnnotationLayer(scene, name) {
  const annotations = scene.state.$data;
  if (!annotations) {
    return;
  }
  return annotations.state.layers.find((anno) => anno.state.name === name);
}
function addAnnotationLayer(scene, layer) {
  let set = scene.state.$data;
  if (set) {
    set.setState({ layers: [...set.state.layers, layer] });
  } else {
    set = new SceneDataLayerSet({ layers: [layer] });
    scene.setState({ $data: set });
  }
  writeSceneLog("SceneContext", `Adding annotation data layer: ${layer.state.name} key: ${layer.state.key}`);
  return () => {
    set.setState({ layers: set.state.layers.filter((x) => x !== layer) });
    writeSceneLog("SceneContext", `Removing annotation data layer: ${layer.state.name} key: ${layer.state.key}`);
  };
}

export { AnnotationLayer };
//# sourceMappingURL=AnnotationLayer.js.map

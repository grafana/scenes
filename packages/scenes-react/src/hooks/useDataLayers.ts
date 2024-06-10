import { SceneDataLayerSet, SceneDataProvider, dataLayers } from "@grafana/scenes";
import { useSceneContext } from "./hooks";
import { useEffect, useId } from "react";
import { isEqual } from "lodash";

export interface UseDataLayersOptions {
    layers: Array<dataLayers.AnnotationsDataLayer>;
}

export function useDataLayers(options: UseDataLayersOptions): SceneDataProvider {
    const scene = useSceneContext();
    const key = useId();

    let dataProvider = scene.findByKey<SceneDataLayerSet>(key);

    if (!dataProvider) {
        dataProvider = new SceneDataLayerSet({
            layers: options.layers
        });
    }

    useEffect(() => scene.addToScene(dataProvider), [dataProvider, scene]);

    useEffect(() => {
       if (!isEqual(dataProvider.state.layers, options.layers)) {
           dataProvider.setState({ layers: options.layers });
           dataProvider.state.layers.forEach((layer) => {
               if (layer instanceof dataLayers.AnnotationsDataLayer) {
                   layer.runLayer();
               }
           });
       }
    }, [dataProvider, options]);

    return dataProvider;
}

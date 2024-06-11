import React, { useEffect, useState } from 'react';
import { useSceneContext } from '../hooks/hooks';
import { AnnotationQuery } from '@grafana/schema';
import { AnnotationsDataLayer } from '@grafana/scenes/src/querying/layers';

export interface AnnotationLayerProps {
    name: string;
    query: AnnotationQuery;
    children: React.ReactNode;
}

export function AnnotationLayer({ name, query, children }: AnnotationLayerProps): React.ReactNode {
    const scene = useSceneContext();
    const [annotationAdded, setAnnotationAdded] = useState<boolean>();

    let annotationLayer: AnnotationsDataLayer | undefined = scene.findAnnotationLayer(name);

    if (!annotationLayer) {
        annotationLayer = new AnnotationsDataLayer({ name, query });
    }

    useEffect(() => {
        const removeFn = scene.addAnnotationLayer(annotationLayer!);
        setAnnotationAdded(true);
        return removeFn;
    }, [annotationLayer, scene, name]);

    useEffect(() => {
        // Handle prop changes
    }, [annotationLayer]);

    if (!annotationAdded) {
        return null;
    }

    return children;
}

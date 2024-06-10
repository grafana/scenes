import React from 'react';

import { dataLayers } from "@grafana/scenes";
import { VizPanel, useDataLayers, useQueryRunner } from "@grafana/scenes-react";
import { plainGraph } from "./visualizations";

interface Props {
    maxDataPoints?: number;
    title: string;
}

export function GraphWithAnnotation({ maxDataPoints, title }: Props) {
    const layers = [
        new dataLayers.AnnotationsDataLayer({
            name: 'Independent annotations',
            query: {
                datasource: {
                    type: 'testdata',
                    uid: 'gdev-testdata',
                },
                enable: true,
                iconColor: 'purple',
                name: 'New annotation',
                target: {
                    // @ts-ignore
                    lines: 3,
                    refId: 'Anno',
                    scenarioId: 'annotations',
                },
            },
        }),
    ];

    const sceneDataSet = useDataLayers({ layers });

    const dataProvider = useQueryRunner({
        queries: [{ uid: 'gdev-testdata', refId: 'A', scenarioId: 'random_walk', alias: 'foo' }],
        maxDataPoints: maxDataPoints ?? 20,
        annotations: sceneDataSet
    });

    return <VizPanel title={title} viz={plainGraph} dataProvider={dataProvider} />;
};

import React from "react";
import { GraphWithAnnotation } from "./GraphWithAnnotation";
import { DemoVizLayout } from "./utils";
import { PageWrapper } from "./PageWrapper";
import { Stack } from "@grafana/ui";
import { AnnotationLayer } from "@grafana/scenes-react";
import { PlainGraphWithRandomWalk } from "./PlainGraphWithRandomWalk";

export function AnnotationDemoPage() {
    // const query1 = {
    //   datasource: {
    //     type: 'testdata',
    //     uid: 'gdev-testdata',
    //   },
    //   enable: true,
    //   iconColor: 'yellow',
    //   name: 'New annotation',
    //   target: {
    //     // @ts-ignore
    //     lines: 10,
    //     refId: 'Anno',
    //     scenarioId: 'annotations',
    //   },
    // };

    const query2 = {
      datasource: {
        type: 'testdata',
        uid: 'gdev-testdata',
      },
      enable: true,
      iconColor: 'red',
      name: 'New annotation',
      target: {
        // @ts-ignore
        lines: 15,
        refId: 'Anno',
        scenarioId: 'annotations',
      },
    };

    return (
        <PageWrapper title="Annotations" subTitle="Annotation demo page">
            <Stack direction={'column'} gap={2}>
                <DemoVizLayout>
                    <AnnotationLayer name="Global Anno 2" query={query2} >
                        <GraphWithAnnotation title="Anno" maxDataPoints={50} />
                    </AnnotationLayer>
                </DemoVizLayout>
                <DemoVizLayout>
                    <PlainGraphWithRandomWalk title="Plain graph" />
                </DemoVizLayout>
            </Stack>
        </PageWrapper>
    )
}

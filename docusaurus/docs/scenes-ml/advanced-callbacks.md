---
id: advanced-callbacks
title: Using callbacks
---

Many of the components in `scenes-ml` allow a callback to be passed in the constructor. For example, in `SceneOutlierDetector`:

```ts
const outlierDetector = new SceneOutlierDetector({
  onOutlierDetected: (outlier: Outlier) => {},
});
```

This callback can be used to create more customised experiences specific to your Scene.

For example, you may have a custom scene showing all pods for a given Kubernetes deployment. By enabling the outlier detector, you could use the callback to store all pods and timestamps which appear to be behaving differently, and render a second panel to show the logs for those pods and timestamps.

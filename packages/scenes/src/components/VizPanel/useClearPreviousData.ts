import { DataFrame, PanelData } from '@grafana/data';
import { useRef } from 'react';

function getValues(frames: readonly DataFrame[]): Set<unknown[]> {
  const values = new Set<unknown[]>();
  for (const frame of frames) {
    // Legacy streaming frames own mutable buffers that must not be truncated.
    if ('appendRow' in frame) {
      continue;
    }
    for (const field of frame.fields) {
      values.add(field.values);
    }
  }
  return values;
}

export function useClearPreviousData(
  data: PanelData | undefined,
  retainedFrames: readonly DataFrame[],
  enabled = true
) {
  const previousValues = useRef(new Set<unknown[]>());

  if (!enabled) {
    previousValues.current.clear();
    return;
  }

  // Missing data can be temporary; keep candidates until the next result can establish ownership.
  if (!data) {
    return;
  }

  const currentValues = getValues([...(data.series ?? []), ...(data.annotations ?? [])]);
  const retainedValues = getValues(retainedFrames);

  // React can retain old panel props. Empty obsolete rendered arrays, but preserve shared arrays
  // still needed by upstream data or a runtime stage, even when hidden from the current output.
  for (const values of previousValues.current) {
    if (currentValues.has(values)) {
      continue;
    }
    if (retainedValues.has(values)) {
      // Keep deferred candidates so a later query refresh can release them.
      currentValues.add(values);
    } else {
      values.length = 0;
    }
  }
  previousValues.current = currentValues;
}

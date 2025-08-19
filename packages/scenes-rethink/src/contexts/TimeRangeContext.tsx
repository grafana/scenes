import { TimeRange } from '@grafana/data';
import React, { createContext, useContext, useState } from 'react';
import { ContextValueBase } from './ContextValueBase';
import { evaluateTimeRange } from '@grafana/scenes/src/utils/evaluateTimeRange';
import { useContextState } from '../utils/utils';

export interface TimeRangeContextState {
  value: TimeRange;
  from: string;
  to: string;
}

export class TimeRangeContextValue extends ContextValueBase<TimeRangeContextState> {
  public constructor({ from, to }: { from: string; to: string }) {
    super({
      from,
      to,
      value: evaluateTimeRange(from, to, 'utc', undefined, undefined, undefined),
    });
  }

  public changeTimeRange(timeRange: TimeRange) {
    const update: Partial<TimeRangeContextState> = {};

    if (typeof timeRange.raw.from === 'string') {
      update.from = timeRange.raw.from;
    } else {
      update.from = timeRange.raw.from.toISOString();
    }

    if (typeof timeRange.raw.to === 'string') {
      update.to = timeRange.raw.to;
    } else {
      update.to = timeRange.raw.to.toISOString();
    }

    update.value = evaluateTimeRange(update.from, update.to, 'utc', undefined, undefined, undefined);

    // Only update if time range actually changed
    if (update.from !== this.state.from || update.to !== this.state.to) {
      this.setState(update);
    }
  }
}

export const TimeRangeContext = createContext<TimeRangeContextValue>(
  new TimeRangeContextValue({
    from: '1h-now',
    to: 'now',
  })
);

export interface TimeRangeContextProviderProps {
  from: string;
  to: string;
  children: React.ReactNode;
}

export function TimeRangeContextProvider({ from, to, children }: TimeRangeContextProviderProps) {
  const [value, _] = useState(
    new TimeRangeContextValue({
      from,
      to,
    })
  );

  return <TimeRangeContext.Provider value={value}>{children}</TimeRangeContext.Provider>;
}

export function useTimeRange(): TimeRangeContextValue {
  const contextValue = useContext(TimeRangeContext);

  useContextState(contextValue);

  return contextValue;
}

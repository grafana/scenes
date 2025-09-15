import { writeSceneLog } from './writeSceneLog';

export interface ReactRenderData {
  phase: string;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: number;
}

export interface SimpleRenderData {
  duration: number;
  type: string;
  timestamp: number;
}

export interface RenderComparisonOptions {
  panelKey?: string;
  pluginId?: string;
  loggerName?: string;
}

/**
 * Compare React Profiler vs Simple Render measurements for debugging
 * Only runs when enabled via localStorage: localStorage.setItem('scenes.debug.renderComparison', 'true')
 * Used for debugging and validating render timing accuracy
 */
export function compareRenderMeasurements(
  reactRender: ReactRenderData,
  simpleRender: SimpleRenderData,
  options: RenderComparisonOptions = {}
) {
  // Only run comparison if explicitly enabled via localStorage
  if (!localStorage.getItem('scenes.debug.renderComparison')) {
    return;
  }

  const { panelKey, pluginId, loggerName = 'RenderComparison' } = options;

  // More sophisticated correlation logic
  const timeDiff = Math.abs(reactRender.timestamp - simpleRender.timestamp);
  const reactDuration = reactRender.actualDuration;
  const simpleDuration = simpleRender.duration;

  // Skip comparison if measurements are clearly from different render cycles
  if (timeDiff > 10) {
    // Much tighter window - 10ms instead of 50ms for better correlation
    writeSceneLog(loggerName, '⏭️ Skipping comparison - measurements from different render cycles', {
      timeDiff: `${timeDiff.toFixed(2)}ms`,
      reactDuration: `${reactDuration.toFixed(2)}ms`,
      simpleDuration: `${simpleDuration.toFixed(2)}ms`,
      reactStartTime: reactRender.startTime.toFixed(2),
      simpleStartTime: simpleRender.timestamp.toFixed(2),
      reactPhase: reactRender.phase,
    });
    return;
  }

  // Skip if React Profiler shows 0ms (likely a no-op render)
  if (reactDuration === 0) {
    writeSceneLog(loggerName, '⏭️ Skipping comparison - React Profiler shows 0ms (no-op render)', {
      reactPhase: reactRender.phase,
      simpleDuration: `${simpleDuration.toFixed(2)}ms`,
    });
    return;
  }

  const difference = simpleDuration - reactDuration;
  const percentDiff = ((difference / reactDuration) * 100).toFixed(1);

  // Create a comprehensive comparison summary
  const summary = {
    '🎯 RENDER MEASUREMENT COMPARISON': '━'.repeat(50),
    '📊 React Profiler (Official)': `${reactDuration.toFixed(2)}ms`,
    '🔧 Simple Measurement (Ours)': `${simpleDuration.toFixed(2)}ms`,
    '📈 Difference': `${difference > 0 ? '+' : ''}${difference.toFixed(2)}ms (${percentDiff}%)`,
    '📋 Analysis': analyzeRenderDifference(reactDuration, simpleDuration, difference),
    '🔍 Details': {
      reactPhase: reactRender.phase,
      reactBaseDuration: `${reactRender.baseDuration.toFixed(2)}ms`,
      simpleType: simpleRender.type,
      panelKey,
      pluginId,
    },
    '⏱️ Timing': {
      reactStart: reactRender.startTime.toFixed(2),
      reactCommit: reactRender.commitTime.toFixed(2),
      measurementGap: `${timeDiff.toFixed(2)}ms`,
    },
  };

  // Log the comparison with writeSceneLog for consistency
  writeSceneLog(loggerName, '🔬 RENDER MEASUREMENT COMPARISON', summary);
}

function analyzeRenderDifference(reactDuration: number, simpleDuration: number, difference: number): string {
  const absDiff = Math.abs(difference);
  const percentDiff = Math.abs((difference / reactDuration) * 100);

  if (absDiff < 1) {
    return '✅ Very close measurements - both approaches are accurate';
  } else if (simpleDuration > reactDuration) {
    if (percentDiff > 1000) {
      return '🚨 Simple measurement MUCH higher - likely measuring different render cycles or includes expensive operations';
    } else if (difference > 10) {
      return '⚠️ Simple measurement significantly higher - includes component function + hook execution overhead';
    } else if (difference > 2) {
      return '📊 Simple measurement higher - includes component function execution time';
    } else {
      return '✅ Simple measurement slightly higher - normal overhead from manual timing';
    }
  } else {
    if (percentDiff > 500) {
      return '🚨 React Profiler MUCH higher - measurements likely from different render cycles';
    } else if (Math.abs(difference) > 10) {
      return '🤔 React Profiler significantly higher - may indicate measurement timing mismatch';
    } else {
      return '📉 React Profiler slightly higher - normal variation in measurement timing';
    }
  }
}

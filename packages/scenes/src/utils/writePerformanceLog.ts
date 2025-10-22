export function writePerformanceLog(logger: string, message: string, ...rest: unknown[]) {
  let loggingEnabled = false;

  if (typeof window !== 'undefined') {
    loggingEnabled = localStorage.getItem('grafana.debug.sceneProfiling') === 'true';
  }

  if (loggingEnabled) {
    console.log(`${logger}: `, message, ...rest);
  }
}

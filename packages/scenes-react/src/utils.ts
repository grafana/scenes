export function writeSceneLog(logger: string, message: string, ...rest: unknown[]) {
  let loggingEnabled = false;

  if (typeof window !== 'undefined') {
    loggingEnabled = localStorage.getItem('grafana.debug.scenes') === 'true';
  }

  if (loggingEnabled) {
    console.log(`${logger}: `, message, ...rest);
  }
}

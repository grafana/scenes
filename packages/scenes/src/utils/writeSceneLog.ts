export function writeSceneLog(logger: string, message: string, ...rest: unknown[]) {
  if ((window as any).grafanaSceneLogging) {
    console.log(`${logger}: `, message, ...rest);
  }
}

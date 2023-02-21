export function writeSceneLog(logger: string, message: string, err?: Error) {
  if ((window as any).grafanaSceneLogging) {
    if (err) {
      console.log(`${logger}: `, message, err);
    } else {
      console.log(`${logger}: `, message);
    }
  }
}

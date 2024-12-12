function writeSceneLog(logger, message, ...rest) {
  let loggingEnabled = false;
  if (typeof window !== "undefined") {
    loggingEnabled = localStorage.getItem("grafana.debug.scenes") === "true";
  }
  if (loggingEnabled) {
    console.log(`${logger}: `, message, ...rest);
  }
}

export { writeSceneLog };
//# sourceMappingURL=writeSceneLog.js.map

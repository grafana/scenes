import { locationService, config } from '@grafana/runtime';

class UrlMacro {
  constructor(name, _) {
    this.state = { name, type: "url_macro" };
  }
  getValue(fieldPath) {
    var _a;
    const location = locationService.getLocation();
    const subUrl = (_a = config.appSubUrl) != null ? _a : "";
    switch (fieldPath != null ? fieldPath : "") {
      case "params":
        return new UrlStateFormatter(location.search);
      case "path":
        return subUrl + location.pathname;
      case "":
      default:
        return subUrl + location.pathname + location.search;
    }
  }
  getValueText() {
    return "";
  }
}
class UrlStateFormatter {
  constructor(_urlQueryParams) {
    this._urlQueryParams = _urlQueryParams;
  }
  formatter(options) {
    if (!options) {
      return this._urlQueryParams;
    }
    const params = options.split(":");
    if (params[0] === "exclude" && params.length > 1) {
      const allParams = new URLSearchParams(this._urlQueryParams);
      for (const param of params[1].split(",")) {
        allParams.delete(param);
      }
      return `?${allParams}`;
    }
    if (params[0] === "include" && params.length > 1) {
      const allParams = new URLSearchParams(this._urlQueryParams);
      const includeOnly = params[1].split(",");
      for (const param of allParams.keys()) {
        if (!includeOnly.includes(param)) {
          allParams.delete(param);
        }
      }
      return `?${allParams}`;
    }
    return this._urlQueryParams;
  }
}

export { UrlMacro };
//# sourceMappingURL=urlMacros.js.map

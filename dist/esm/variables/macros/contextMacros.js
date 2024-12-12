import { config } from '@grafana/runtime';

class UserMacro {
  constructor(name, _) {
    this.state = { name, type: "user_macro" };
  }
  getValue(fieldPath) {
    const user = config.bootData.user;
    switch (fieldPath) {
      case "login":
        return user.login;
      case "email":
        return user.email;
      case "id":
      default:
        return String(user.id);
    }
  }
  getValueText() {
    return "";
  }
}
class OrgMacro {
  constructor(name, _) {
    this.state = { name, type: "org_macro" };
  }
  getValue(fieldPath) {
    const user = config.bootData.user;
    switch (fieldPath) {
      case "name":
        return user.orgName;
      case "id":
      default:
        return String(user.orgId);
    }
  }
  getValueText() {
    return "";
  }
}

export { OrgMacro, UserMacro };
//# sourceMappingURL=contextMacros.js.map

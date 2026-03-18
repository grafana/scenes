import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { config } from '@grafana/runtime';

/**
 * Handles expressions like ${__user.login}
 */
export class UserMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, _: SceneObject) {
    this.state = { name: name, type: 'user_macro' };
  }

  public getValue(fieldPath?: string): string {
    const user = config.bootData.user;

    switch (fieldPath) {
      case 'login':
        return user.login;
      case 'email':
        return user.email;
      case 'id':
      default:
        return String(user.id);
    }
  }
}

/**
 * Handles expressions like ${__org.name}
 */
export class OrgMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, _: SceneObject) {
    this.state = { name: name, type: 'org_macro' };
  }

  public getValue(fieldPath?: string): string {
    const user = config.bootData.user;

    switch (fieldPath) {
      case 'name':
        return user.orgName;
      case 'id':
      default:
        return String(user.orgId);
    }
  }
}

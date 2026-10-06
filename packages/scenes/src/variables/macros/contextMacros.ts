import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';
import { getFieldAccessor } from '../interpolation/fieldAccessorCache';
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

/**
 * Handles expressions like ${__namespace}, the Kubernetes namespace of the current instance.
 * Grafana APIs are namespaced, so queries against them need it to build the URL.
 */
export class NamespaceMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, _: SceneObject) {
    this.state = { name: name, type: 'namespace_macro' };
  }

  public getValue(): string {
    return config.namespace;
  }
}

/**
 * Handles expressions like ${__theme.colors.text.primary}, a value from the current theme.
 */
export class ThemeMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(name: string, _: SceneObject, private _match: string) {
    this.state = { name: name, type: 'theme_macro' };
  }

  public getValue(fieldPath?: string): string {
    if (!fieldPath) {
      return this._match;
    }

    const value = getFieldAccessor(fieldPath)(config.theme2);

    // Only leaf values: an object would render as [object Object] and a function as its source code.
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return this._match;
  }
}

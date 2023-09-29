import { cloneDeep, merge } from 'lodash';
import { DeepPartial } from '../types';

export class PanelOptionsBuilder<TOptions extends {} = {}> {
  private _options: DeepPartial<TOptions> = {};

  public constructor(private defaultOptions?: () => Partial<TOptions>) {
    this.setDefaults();
  }

  private setDefaults() {
    this._options = this.defaultOptions ? cloneDeep(this.defaultOptions()) : ({} as TOptions);
  }

  /**
   * Set an individual panel option. This will merge the value with the existing options.
   */
  public setOption<T extends TOptions, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this {
    this._options = merge(this._options, { [id]: value });
    return this;
  }

  public build() {
    return this._options;
  }
}

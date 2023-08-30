export class SceneObjectRef<T> {
  #ref: T;

  public constructor(ref: T) {
    this.#ref = ref;
  }

  public get(): T {
    return this.#ref;
  }
}

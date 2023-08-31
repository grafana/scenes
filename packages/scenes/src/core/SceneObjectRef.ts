export class SceneObjectRef<T> {
  #ref: T;

  public constructor(ref: T) {
    this.#ref = ref;
  }

  public resolve(): T {
    return this.#ref;
  }
}

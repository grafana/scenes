import { cloneDeep } from 'lodash';
import { TestScene } from '../variables/TestScene';
import { SafeSerializableSceneObject } from './SafeSerializableSceneObject';

describe('SafeSerializableSceneObject', () => {
  test('it should resolve the correct wrapped scene object when cloned deep', () => {
    const sceneObject = new TestScene({});

    const source = new SafeSerializableSceneObject(sceneObject);

    const cloned = cloneDeep(source);

    expect(cloned).not.toBe(source);
    // SafeSerializableSceneObject.value always returns itself
    expect(cloned.value).not.toBe(source.value);
    expect(cloned.value.valueOf()).toBe(sceneObject);

    // SafeSerializableSceneObject.valueOf always returns the originally wrapped scene object
    expect(cloned.value.valueOf()).toBe(source.value.valueOf());
    expect(cloned.valueOf()).toBe(sceneObject);
  });
});

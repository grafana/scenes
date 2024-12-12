import { property } from 'lodash';

let fieldAccessorCache = {};
function getFieldAccessor(fieldPath) {
  const accessor = fieldAccessorCache[fieldPath];
  if (accessor) {
    return accessor;
  }
  return fieldAccessorCache[fieldPath] = property(fieldPath);
}

export { getFieldAccessor };
//# sourceMappingURL=fieldAccessorCache.js.map

import { EmptyDataNode, EmptyVariableSet } from '../../variables/interpolation/defaults.js';
import { sceneInterpolator } from '../../variables/interpolation/sceneInterpolator.js';
import { isDataLayer } from '../types.js';
import { lookupVariable } from '../../variables/lookupVariable.js';
import { getClosest } from './utils.js';
import { isQueryController } from '../../behaviors/SceneQueryController.js';
import { QueryVariable } from '../../variables/variants/query/QueryVariable.js';

function getVariables(sceneObject) {
  var _a;
  return (_a = getClosest(sceneObject, (s) => s.state.$variables)) != null ? _a : EmptyVariableSet;
}
function getData(sceneObject) {
  var _a;
  return (_a = getClosest(sceneObject, (s) => s.state.$data)) != null ? _a : EmptyDataNode;
}
function isSceneLayout(s) {
  return "isDraggable" in s;
}
function getLayout(scene) {
  const parent = getClosest(scene, (s) => isSceneLayout(s) ? s : void 0);
  if (parent) {
    return parent;
  }
  return null;
}
function interpolate(sceneObject, value, scopedVars, format, interpolations) {
  if (value === "" || value == null) {
    return "";
  }
  return sceneInterpolator(sceneObject, value, scopedVars, format, interpolations);
}
function hasVariableDependencyInLoadingState(sceneObject) {
  if (!sceneObject.variableDependency) {
    return false;
  }
  for (const name of sceneObject.variableDependency.getNames()) {
    if (sceneObject instanceof QueryVariable && sceneObject.state.name === name) {
      console.warn("Query variable is referencing itself");
      continue;
    }
    const variable = lookupVariable(name, sceneObject);
    if (!variable) {
      continue;
    }
    const set = variable.parent;
    if (set.isVariableLoadingOrWaitingToUpdate(variable)) {
      return true;
    }
  }
  return false;
}
function findObjectInternal(scene, check, alreadySearchedChild, shouldSearchUp) {
  if (check(scene)) {
    return scene;
  }
  let found = null;
  scene.forEachChild((child) => {
    if (child === alreadySearchedChild) {
      return;
    }
    let maybe = findObjectInternal(child, check);
    if (maybe) {
      found = maybe;
    }
  });
  if (found) {
    return found;
  }
  if (shouldSearchUp && scene.parent) {
    return findObjectInternal(scene.parent, check, scene, true);
  }
  return null;
}
function findByKey(sceneObject, key) {
  const found = findObject(sceneObject, (sceneToCheck) => {
    return sceneToCheck.state.key === key;
  });
  if (!found) {
    throw new Error("Unable to find scene with key " + key);
  }
  return found;
}
function findByKeyAndType(sceneObject, key, targetType) {
  const found = findObject(sceneObject, (sceneToCheck) => {
    return sceneToCheck.state.key === key;
  });
  if (!found) {
    throw new Error("Unable to find scene with key " + key);
  }
  if (!(found instanceof targetType)) {
    throw new Error(`Found scene object with key ${key} does not match type ${targetType.name}`);
  }
  return found;
}
function findObject(scene, check) {
  return findObjectInternal(scene, check, void 0, true);
}
function findAllObjects(scene, check) {
  const found = [];
  scene.forEachChild((child) => {
    if (check(child)) {
      found.push(child);
    }
    found.push(...findAllObjects(child, check));
  });
  return found;
}
function getDataLayers(sceneObject, localOnly = false) {
  let currentLevel = sceneObject;
  let collected = [];
  while (currentLevel) {
    const dataProvider = currentLevel.state.$data;
    if (!dataProvider) {
      currentLevel = currentLevel.parent;
      continue;
    }
    if (isDataLayer(dataProvider)) {
      collected = collected.concat(dataProvider);
    } else {
      if (dataProvider.state.$data && isDataLayer(dataProvider.state.$data)) {
        collected = collected.concat(dataProvider.state.$data);
      }
    }
    if (localOnly && collected.length > 0) {
      break;
    }
    currentLevel = currentLevel.parent;
  }
  return collected;
}
function getAncestor(sceneObject, ancestorType) {
  let parent = sceneObject;
  while (parent) {
    if (parent instanceof ancestorType) {
      return parent;
    }
    parent = parent.parent;
  }
  if (!parent) {
    throw new Error("Unable to find parent of type " + ancestorType.name);
  }
  return parent;
}
function findDescendents(scene, descendentType) {
  function isDescendentType(scene2) {
    return scene2 instanceof descendentType;
  }
  const targetScenes = findAllObjects(scene, isDescendentType);
  return targetScenes.filter(isDescendentType);
}
function getQueryController(sceneObject) {
  let parent = sceneObject;
  while (parent) {
    if (parent.state.$behaviors) {
      for (const behavior of parent.state.$behaviors) {
        if (isQueryController(behavior)) {
          return behavior;
        }
      }
    }
    parent = parent.parent;
  }
  return void 0;
}
function getUrlSyncManager(sceneObject) {
  let parent = sceneObject;
  while (parent) {
    if ("urlSyncManager" in parent.state) {
      return parent.state.urlSyncManager;
    }
    parent = parent.parent;
  }
  return void 0;
}

export { findAllObjects, findByKey, findByKeyAndType, findDescendents, findObject, getAncestor, getData, getDataLayers, getLayout, getQueryController, getUrlSyncManager, getVariables, hasVariableDependencyInLoadingState, interpolate };
//# sourceMappingURL=sceneGraph.js.map

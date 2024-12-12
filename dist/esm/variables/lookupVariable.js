function lookupVariable(name, sceneObject) {
  const variables = sceneObject.state.$variables;
  if (!variables) {
    if (sceneObject.parent) {
      return lookupVariable(name, sceneObject.parent);
    } else {
      return null;
    }
  }
  const found = variables.getByName(name);
  if (found) {
    return found;
  } else if (sceneObject.parent) {
    return lookupVariable(name, sceneObject.parent);
  }
  return null;
}

export { lookupVariable };
//# sourceMappingURL=lookupVariable.js.map

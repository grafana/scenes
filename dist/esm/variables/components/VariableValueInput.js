import React, { useCallback } from 'react';
import { AutoSizeInput } from '@grafana/ui';

function VariableValueInput({ model }) {
  const { value, key, loading } = model.useState();
  const onBlur = useCallback(
    (e) => {
      model.setValue(e.currentTarget.value);
    },
    [model]
  );
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        model.setValue(e.currentTarget.value);
      }
    },
    [model]
  );
  return /* @__PURE__ */ React.createElement(AutoSizeInput, {
    id: key,
    placeholder: "Enter value",
    minWidth: 15,
    value,
    loading,
    onBlur,
    onKeyDown
  });
}

export { VariableValueInput };
//# sourceMappingURL=VariableValueInput.js.map

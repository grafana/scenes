import { DataTransformerInfo, standardTransformersRegistry } from '@grafana/data';

let isInitialised = false;

export const mockTransformationsRegistry = (transformers: Array<DataTransformerInfo<any>>) => {
  if (isInitialised) {
    return;
  }

  standardTransformersRegistry.setInit(() => {
    return transformers.map((t) => {
      return {
        id: t.id,
        aliasIds: t.aliasIds,
        name: t.name,
        transformation: t,
        description: t.description,
        editor: () => null,
        imageDark: '',
        imageLight: '',
      };
    });
  });
  isInitialised = true;
};

import React, { useEffect, useId } from 'react';
import { useSceneContext } from '../hooks/hooks';
import { SceneRefreshPicker, SceneRefreshPickerState } from '@grafana/scenes';
import { usePrevious } from 'react-use';
import { useAddToScene } from '../contexts/SceneContextObject';

export interface Props {
  refresh?: string;
  withText?: boolean;
}

export function RefreshPicker(props: Props) {
  const scene = useSceneContext();
  const key = useId();
  const prevProps = usePrevious(props);

  let picker = scene.findByKey<SceneRefreshPicker>(key);

  if (!picker) {
    picker = new SceneRefreshPicker({
      key: key,
      ...props,
    });
  }

  useAddToScene(picker, scene);

  // Update options
  useEffect(() => {
    const stateUpdate: Partial<SceneRefreshPickerState> = {};

    if (!prevProps) {
      return;
    }

    if (props.refresh !== prevProps.refresh) {
      stateUpdate.refresh = props.refresh;
    }

    if (props.withText !== prevProps.withText) {
      stateUpdate.withText = props.withText;
    }

    picker.setState(stateUpdate);
  }, [picker, props, prevProps]);

  return <picker.Component model={picker} />;
}

import React, { useEffect, useId } from 'react';
import { useSceneContext } from './hooks';
import { SceneRefreshPicker, SceneRefreshPickerState } from '../components/SceneRefreshPicker';
import { usePrevious } from 'react-use';

export interface Props extends Partial<SceneRefreshPickerState> {}

export function RRefreshPicker(props: Props) {
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

  useEffect(() => {
    scene.addToScene(picker);

    return () => {
      scene.removeFromScene(picker);
    };
  }, [picker, scene, key]);

  // Update options
  useEffect(() => {
    const stateUpdate: Partial<SceneRefreshPickerState> = {};

    if (!prevProps) {
      return;
    }

    if (props.refresh !== prevProps.refresh) {
      stateUpdate.refresh = props.refresh;
    }

    picker.setState(stateUpdate);
  }, [picker, props, prevProps]);

  return <picker.Component model={picker} />;
}

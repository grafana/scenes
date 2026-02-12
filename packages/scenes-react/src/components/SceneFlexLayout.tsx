import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { isEqual } from 'lodash';
import {
  SceneFlexItem as SceneFlexItemObject,
  SceneFlexLayout as SceneFlexLayoutObject,
  type SceneFlexItemPlacement,
} from '@grafana/scenes';

import { useSceneContext } from '../hooks/hooks';
import { SceneFlexItem, type SceneFlexItemProps } from './SceneFlexItem';
import { SceneFlexLayoutContext } from './SceneFlexLayoutContext';

export interface SceneFlexLayoutProps extends SceneFlexItemPlacement {
  children: React.ReactNode;
}

type RegistryEntry = { item: SceneFlexItemObject; order: number };

export function SceneFlexLayout(props: SceneFlexLayoutProps) {
  const scene = useSceneContext();
  const key = useId();
  const { wrap, direction, width, height, minWidth, minHeight, maxWidth, maxHeight, xSizing, ySizing, isHidden, md } =
    props;

  let layout = scene.findByKey<SceneFlexLayoutObject>(key);

  if (!layout) {
    layout = new SceneFlexLayoutObject({
      key,
      children: [],
      wrap,
      direction,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      xSizing,
      ySizing,
      isHidden,
      md,
    });
  }

  useEffect(() => scene.addToScene(layout), [layout, scene]);

  // Keep layout placement props in sync (but do not touch children here).
  useEffect(() => {
    const nextPlacement: SceneFlexItemPlacement = {
      wrap,
      direction,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      xSizing,
      ySizing,
      isHidden,
      md,
    };

    if (
      layout.state.wrap === nextPlacement.wrap &&
      layout.state.direction === nextPlacement.direction &&
      layout.state.width === nextPlacement.width &&
      layout.state.height === nextPlacement.height &&
      layout.state.minWidth === nextPlacement.minWidth &&
      layout.state.minHeight === nextPlacement.minHeight &&
      layout.state.maxWidth === nextPlacement.maxWidth &&
      layout.state.maxHeight === nextPlacement.maxHeight &&
      layout.state.xSizing === nextPlacement.xSizing &&
      layout.state.ySizing === nextPlacement.ySizing &&
      layout.state.isHidden === nextPlacement.isHidden &&
      isEqual(layout.state.md, nextPlacement.md)
    ) {
      return;
    }

    layout.setState(nextPlacement);
  }, [
    layout,
    direction,
    height,
    isHidden,
    maxHeight,
    maxWidth,
    md,
    minHeight,
    minWidth,
    width,
    wrap,
    xSizing,
    ySizing,
  ]);

  const registryRef = useRef<Map<string, RegistryEntry>>(new Map());

  const updateLayoutChildren = useCallback(() => {
    const entries = Array.from(registryRef.current.values()).sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // `key` is guaranteed at runtime, but typed optional in `SceneObjectState`.
      return (a.item.state.key ?? '').localeCompare(b.item.state.key ?? '');
    });

    const nextChildren = entries.map((e) => e.item);
    const currentChildren = layout.state.children;

    if (
      currentChildren.length === nextChildren.length &&
      currentChildren.every((child, idx) => child === nextChildren[idx])
    ) {
      return;
    }

    layout.setState({ children: nextChildren });
  }, [layout]);

  const register = useCallback(
    (id: string, item: SceneFlexItemObject, order: number) => {
      registryRef.current.set(id, { item, order });
      updateLayoutChildren();
    },
    [updateLayoutChildren]
  );

  const unregister = useCallback(
    (id: string) => {
      registryRef.current.delete(id);
      updateLayoutChildren();
    },
    [updateLayoutChildren]
  );

  const ctxValue = useMemo(() => {
    return { layout, register, unregister };
  }, [layout, register, unregister]);

  const flexItemChildren = useMemo(() => {
    const items = collectFlexItemElements(props.children);
    return items.map((el, idx) => {
      // Ensure stable keys for React list rendering (also avoids warnings when consumers omit keys).
      const key = el.key ?? `__scene_flex_item_${idx}`;
      return React.cloneElement(el, { key, __order: idx } as any);
    });
  }, [props.children]);

  return (
    <SceneFlexLayoutContext.Provider value={ctxValue}>
      <layout.Component model={layout} />
      {flexItemChildren}
    </SceneFlexLayoutContext.Provider>
  );
}

function collectFlexItemElements(children: React.ReactNode): Array<React.ReactElement<SceneFlexItemProps>> {
  const result: Array<React.ReactElement<SceneFlexItemProps>> = [];

  React.Children.forEach(children, (child) => {
    if (!child) {
      return;
    }

    if (React.isValidElement(child) && child.type === React.Fragment) {
      result.push(...collectFlexItemElements(child.props.children));
      return;
    }

    if (React.isValidElement(child) && child.type === SceneFlexItem) {
      result.push(child as React.ReactElement<SceneFlexItemProps>);
      return;
    }
  });

  return result;
}

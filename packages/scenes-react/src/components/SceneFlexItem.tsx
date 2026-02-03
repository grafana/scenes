import React, { useContext, useEffect, useId, useRef } from 'react';
import { isEqual } from 'lodash';
import { SceneFlexItem as SceneFlexItemObject, SceneReactObject, type SceneFlexItemPlacement } from '@grafana/scenes';

import { SceneFlexLayoutContext } from './SceneFlexLayoutContext';

export interface SceneFlexItemProps extends SceneFlexItemPlacement {
  children: React.ReactNode;
}

export function SceneFlexItem(props: SceneFlexItemProps) {
  const ctx = useContext(SceneFlexLayoutContext);
  const key = useId();

  const { children } = props;
  const { wrap, direction, width, height, minWidth, minHeight, maxWidth, maxHeight, xSizing, ySizing, isHidden, md } =
    props;
  const order = (props as SceneFlexItemProps & { __order?: number }).__order ?? 0;

  if (!ctx) {
    throw new Error('SceneFlexItem must be a child of SceneFlexLayout');
  }

  const itemRef = useRef<SceneFlexItemObject>();

  if (!itemRef.current) {
    itemRef.current = new SceneFlexItemObject({
      key,
      body: new SceneReactObject({ reactNode: children }),
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

  const item = itemRef.current;

  // Register/unregister with parent layout
  const mountedRef = useRef(false);

  useEffect(() => {
    ctx.register(key, item, order);
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      ctx.unregister(key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, item, key]);

  // Keep ordering up to date when parent changes React order.
  useEffect(() => {
    if (!mountedRef.current) {
      return;
    }

    ctx.register(key, item, order);
  }, [ctx, item, key, order]);

  // Sync placement props
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
      item.state.wrap === nextPlacement.wrap &&
      item.state.direction === nextPlacement.direction &&
      item.state.width === nextPlacement.width &&
      item.state.height === nextPlacement.height &&
      item.state.minWidth === nextPlacement.minWidth &&
      item.state.minHeight === nextPlacement.minHeight &&
      item.state.maxWidth === nextPlacement.maxWidth &&
      item.state.maxHeight === nextPlacement.maxHeight &&
      item.state.xSizing === nextPlacement.xSizing &&
      item.state.ySizing === nextPlacement.ySizing &&
      item.state.isHidden === nextPlacement.isHidden &&
      isEqual(item.state.md, nextPlacement.md)
    ) {
      return;
    }

    item.setState(nextPlacement);
  }, [item, direction, height, isHidden, maxHeight, maxWidth, md, minHeight, minWidth, width, wrap, xSizing, ySizing]);

  // Sync item body (React node)
  const body = item.state.body as SceneReactObject | undefined;

  useEffect(() => {
    if (!body) {
      return;
    }

    if (body.state.reactNode === children) {
      return;
    }

    body.setState({ reactNode: children });
  }, [body, children]);

  // Rendering happens via SceneFlexLayout's renderer.
  return null;
}

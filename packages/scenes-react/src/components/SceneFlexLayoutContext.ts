import { createContext } from 'react';
import type { SceneFlexItem, SceneFlexLayout } from '@grafana/scenes';

export interface SceneFlexLayoutRegistry {
  layout: SceneFlexLayout;
  register: (id: string, item: SceneFlexItem, order: number) => void;
  unregister: (id: string) => void;
}

export const SceneFlexLayoutContext = createContext<SceneFlexLayoutRegistry | null>(null);

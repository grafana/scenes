import React from 'react';

import { Icon } from '@grafana/ui';

export function SceneDragHandle({ className, dragClass }: { className?: string; dragClass: string }) {
  return (
    <div
      className={`${className} ${dragClass}`}
      style={{
        width: '20px',
        height: '20px',
        cursor: 'move',
      }}
    >
      <Icon name="draggabledots" />
    </div>
  );
}

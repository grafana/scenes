import { css } from '@emotion/react';
import { GrafanaTheme2 } from '@grafana/data';

export function getGlobalStyles(theme: GrafanaTheme2) {
  return css`
    .selecto-selected {
      border: 1px solid #4af !important;
    }
  `;
}

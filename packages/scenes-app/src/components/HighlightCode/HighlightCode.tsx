import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/plugins/toolbar/prism-toolbar.css'; // Toolbar plugin styles
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

import 'prismjs/plugins/toolbar/prism-toolbar'; // Toolbar plugin
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard'; // Copy to Clipboard plugin
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/components/prism-typescript';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

const getStyles = () => ({
  alwaysVisible: css`
      opacity: 1 !important;

      & + div {
          opacity: 1 !important; /* Make the toolbar visible */
      }

      & + .toolbar .toolbar-item .copy-to-clipboard-button {
          padding: 8px;
          margin-top: 8px;
          margin-right: 8px;
      }
  `,
});

type Props = {
  code: string;
  plugins?: string[];
  language: string;
}

export const HighlightCode = ({ code, plugins, language }: Props) => {
  const styles = useStyles2(getStyles);
  const ref = React.useRef<HTMLDivElement>(null);

  function highlight() {
    if (ref && ref.current) {
      Prism.highlightElement(ref.current);
    }
  }

  useEffect(() => {
    highlight();
  }, []);

  return (
    <pre className={cx([!plugins ? '' : `${plugins.join(' ')}`, styles.alwaysVisible])}>
      <code ref={ref} className={`language-${language}`}>
        {code.trim()}
      </code>
    </pre>
  );
};

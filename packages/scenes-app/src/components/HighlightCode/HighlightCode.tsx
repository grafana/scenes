import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
// import 'prismjs/plugins/copy-to-clipboard/prismjs-copy-to-clipboard.js';
import 'prismjs/components/prism-typescript';

type Props = {
  code: string;
  plugins?: string[];
  language: string;
}

export const HighlightCode = ({ code, plugins, language }: Props) => {
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
    <pre className={!plugins ? '' : plugins.join(' ')}>
        <code ref={ref} className={`language-${language}`}>
          {code.trim()}
        </code>
      </pre>
  );
};

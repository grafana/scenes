import React, { CSSProperties } from 'react';

export interface Props {
  children: React.ReactNode;
}

export function DemoVizLayout(props: Props) {
  const style: CSSProperties = {
    display: 'grid',
    flexGrow: 1,
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gridAutoRows: '320px',
    columnGap: `8px`,
    rowGap: `8px`,
  };

  return <div style={style}>{props.children}</div>;
}

export function RenderCounter({ name }: { name: string }) {
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  return (
    <div>
      {name} render count: {renderCount.current}
    </div>
  );
}

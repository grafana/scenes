import React from 'react';

import { Button, ButtonVariant } from '@grafana/ui';

interface Props extends React.ComponentProps<typeof Button> {
  clipboardText: string;

  onClipboardCopy(): void;

  onClipboardError?(): void;

  variant?: ButtonVariant;
}

export const CopyToClipboard = (props: Props) => {
  const { clipboardText, onClipboardCopy, onClipboardError, ...buttonProps } = props;
  const handleClick = () => {
    navigator.clipboard.writeText(clipboardText).then(
      () => {
        /* clipboard successfully set */
        onClipboardCopy();
      },
      () => {
        /* clipboard write failed */
        onClipboardError && onClipboardError();
      }
    );
  };

  return (
    <Button onClick={handleClick} {...buttonProps} type="button">
      {buttonProps.children}
    </Button>
  );
};

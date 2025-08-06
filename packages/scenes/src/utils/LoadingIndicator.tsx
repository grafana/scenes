import { t } from '@grafana/i18n';
import { Icon, Tooltip } from '@grafana/ui';
import React, { useCallback } from 'react';
import { LoadingIndicatorProps as SelectLoadingIndicatorProps } from 'react-select';

export const SelectLoadingIndicator = ({
  innerProps,
  ...props
}: SelectLoadingIndicatorProps & { selectProps: { onCancel: () => void } }) => {
  const { onCancel } = props.selectProps;
  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    },
    [onCancel]
  );

  return <LoadingIndicator onCancel={onMouseDown} />;
};

interface LoadingIndicatorProps {
  onCancel: (event: React.MouseEvent) => void;
}

export function LoadingIndicator(props: LoadingIndicatorProps) {
  return (
    <Tooltip content={t('grafana-scenes.utils.loading-indicator.content-cancel-query', 'Cancel query')}>
      <Icon
        className="spin-clockwise"
        name="sync"
        size="xs"
        role="button"
        onMouseDown={(e) => {
          props.onCancel(e);
        }}
      />
    </Tooltip>
  );
}

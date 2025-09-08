import { cx, css } from '@emotion/css';
import { SelectableValue, GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { useStyles2, Button, Icon } from '@grafana/ui';
import React, { useCallback } from 'react';

interface MultiValuePillProps {
  item: SelectableValue<string>;
  handleRemoveMultiValue: (item: SelectableValue<string>) => void;
  index: number;
  handleEditMultiValuePill: (value: SelectableValue<string>) => void;
}
export const MultiValuePill = ({
  item,
  handleRemoveMultiValue,
  index,
  handleEditMultiValuePill,
}: MultiValuePillProps) => {
  const styles = useStyles2(getStyles);

  const editMultiValuePill = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleEditMultiValuePill(item);
    },
    [handleEditMultiValuePill, item]
  );

  const editMultiValuePillWithKeyboard = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        editMultiValuePill(e);
      }
    },
    [editMultiValuePill]
  );

  const removePillHandler = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleRemoveMultiValue(item);
    },
    [handleRemoveMultiValue, item]
  );

  const removePillHandlerWithKeyboard = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        removePillHandler(e);
      }
    },
    [removePillHandler]
  );

  return (
    <div
      className={cx(styles.basePill, styles.valuePill)}
      onClick={editMultiValuePill}
      onKeyDown={editMultiValuePillWithKeyboard}
      tabIndex={0}
      id={`${item.value}-${index}`}
    >
      {item.label ?? item.value}
      <Button
        onClick={removePillHandler}
        onKeyDownCapture={removePillHandlerWithKeyboard}
        fill="text"
        size="sm"
        variant="secondary"
        className={styles.removeButton}
        tooltip={t(
          'grafana-scenes.components.adhoc-filters-combobox.remove-filter-value',
          'Remove filter value - {{itemLabel}}',
          {
            itemLabel: item.label ?? item.value,
          }
        )}
      >
        <Icon name="times" size="md" id={`${item.value}-${index}-close-icon`} />
      </Button>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  basePill: css({
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.action.disabledBackground,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.125, 1, 0.125, 1),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minHeight: theme.spacing(2.75),
    ...theme.typography.bodySmall,
    cursor: 'pointer',
  }),
  valuePill: css({
    background: theme.colors.action.selected,
    padding: theme.spacing(0.125, 0, 0.125, 1),
  }),
  removeButton: css({
    marginInline: theme.spacing(0.5),
    height: '100%',
    padding: 0,
    cursor: 'pointer',
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});

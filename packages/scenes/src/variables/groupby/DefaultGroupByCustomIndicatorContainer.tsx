import { t } from '@grafana/i18n';
import { Icon, IconButton, Tooltip, getInputStyles, useTheme2 } from '@grafana/ui';
import { GroupByVariable } from './GroupByVariable';
import { isArray } from 'lodash';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

type DefaultGroupByCustomIndicatorProps = {
  model: GroupByVariable;
};

export function DefaultGroupByCustomIndicatorContainer(props: DefaultGroupByCustomIndicatorProps) {
  const { model } = props;
  const theme = useTheme2();
  const styles = getStyles(theme);
  const inputStyles = getInputStyles({ theme, invalid: false });
  const value = isArray(model.state.value) ? model.state.value : model.state.value ? [model.state.value] : [];

  let buttons: React.ReactNode[] = [];

  if (value && value.length) {
    buttons.push(
      <IconButton
        aria-label={t('grafana-scenes.variables.default-group-by-custom-indicator-container.aria-label-clear', 'clear')}
        key="clear"
        name="times"
        size="md"
        className={styles.clearIcon}
        onClick={(e) => {
          model.changeValueTo([], undefined, true);
          if (model.checkIfRestorable([])) {
            model.setState({ restorable: true });
          }
        }}
      />
    );
  }

  if (model.state.restorable) {
    buttons.push(
      <IconButton
        onClick={(e) => {
          props.model.restoreDefaultValues();
        }}
        onKeyDownCapture={(e) => {
          if (e.key === 'Enter') {
            props.model.restoreDefaultValues();
          }
        }}
        key="restore"
        name="history"
        size="md"
        className={styles.clearIcon}
        tooltip={t(
          'grafana-scenes.variables.default-group-by-custom-indicator-container.tooltip-restore-groupby-set-by-this-dashboard',
          'Restore groupby set by this dashboard.'
        )}
      />
    );
  }

  if (!model.state.restorable) {
    buttons.push(
      <Tooltip
        key="tooltip"
        content={t(
          'grafana-scenes.variables.default-group-by-custom-indicator-container.tooltip',
          'Applied by default in this dashboard. If edited, it carries over to other dashboards.'
        )}
        placement="bottom"
      >
        <Icon name="info-circle" size="md" />
      </Tooltip>
    );
  }

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cx(
        inputStyles.suffix,
        css({
          position: 'relative',
        })
      )}
    >
      {buttons}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  clearIcon: css({
    color: theme.colors.action.disabledText,
    cursor: 'pointer',
    '&:hover:before': {
      backgroundColor: 'transparent',
    },
    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
});

import { ClickOutsideWrapper, IconButton, Popover, Stack, Text, useStyles2 } from '@grafana/ui';
import React, { useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { Trans, t } from '@grafana/i18n';

export interface DrilldownPill {
  label: string;
  onClick: () => void;
}

interface Props {
  recentDrilldowns?: DrilldownPill[];
  recommendedDrilldowns?: DrilldownPill[];
}

export function DrilldownRecommendations({ recentDrilldowns, recommendedDrilldowns }: Props) {
  const styles = useStyles2(getStyles);

  const [isPopoverVisible, setPopoverVisible] = useState<boolean>(false);
  const ref = useRef<HTMLButtonElement>(null);

  const openPopover = () => {
    setPopoverVisible(true);
  };

  const onClickAction = (action: () => void) => {
    action();
    setPopoverVisible(false);
  };

  const content = (
    <ClickOutsideWrapper onClick={() => setPopoverVisible(false)} useCapture={true}>
      <div className={styles.menuContainer} onClick={(ev) => ev.stopPropagation()}>
        <Stack direction="column">
          <Text weight="bold" variant="bodySmall" color="secondary">
            <Trans i18nKey="grafana-scenes.components.drilldown-recommendations.recent">Recent</Trans>
          </Text>
          {recentDrilldowns && recentDrilldowns.length > 0 ? (
            recentDrilldowns.map((drilldown) => (
              <div
                key={drilldown.label}
                className={cx(styles.combinedFilterPill)}
                onClick={() => onClickAction(drilldown.onClick)}
              >
                {drilldown.label}
              </div>
            ))
          ) : (
            <div className={styles.emptyMessage}>
              <Trans i18nKey="grafana-scenes.components.drilldown-recommendations.recent-empty">No recent values</Trans>
            </div>
          )}
          <Text weight="bold" variant="bodySmall" color="secondary">
            <Trans i18nKey="grafana-scenes.components.drilldown-recommendations.recommended">Recommended</Trans>
          </Text>
          {recommendedDrilldowns && recommendedDrilldowns.length > 0 ? (
            recommendedDrilldowns.map((drilldown) => (
              <div
                key={drilldown.label}
                className={cx(styles.combinedFilterPill)}
                onClick={() => onClickAction(drilldown.onClick)}
              >
                {drilldown.label}
              </div>
            ))
          ) : (
            <div className={styles.emptyMessage}>
              <Trans i18nKey="grafana-scenes.components.drilldown-recommendations.recommended-empty">
                No recommended values
              </Trans>
            </div>
          )}
        </Stack>
      </div>
    </ClickOutsideWrapper>
  );

  return (
    <>
      <IconButton
        name="plus"
        tooltip={t('grafana-scenes.components.drilldown-recommendations.tooltip', 'Show recommendations')}
        ref={ref}
        className={cx(isPopoverVisible && styles.iconActive)}
        onClick={(ev) => {
          openPopover();
          ev.stopPropagation();
        }}
      />

      {isPopoverVisible && ref.current && (
        <Popover
          content={content}
          onKeyDown={(event) => {
            if (event.key === ' ') {
              event.stopPropagation();
            }
          }}
          placement="bottom-start"
          referenceElement={ref.current}
          show
        />
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  menuContainer: css({
    display: 'flex',
    flexDirection: 'column',
    background: theme.colors.background.elevated,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    boxShadow: theme.shadows.z3,
    padding: theme.spacing(2),
  }),
  combinedFilterPill: css({
    alignItems: 'center',
    background: theme.colors.action.selected,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0.2, 1),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    minHeight: theme.spacing(2.75),
    ...theme.typography.bodySmall,
    fontWeight: theme.typography.fontWeightBold,
    cursor: 'pointer',

    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
  iconActive: css({
    '&:before': {
      backgroundColor: theme.colors.action.hover,
      opacity: 1,
    },
  }),
  emptyMessage: css({
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.colors.text.secondary,
  }),
});

import { t } from '@grafana/i18n';
import { css } from '@emotion/css';
import { GrafanaTheme2, PanelData } from '@grafana/data';
import { Button, Icon, Tooltip, useStyles2 } from '@grafana/ui';

export interface Props {
  showAll?: boolean;
  seriesLimit: number;
  data?: PanelData;
  onShowAllSeries: () => void;
}

export function VizPanelSeriesLimit({ data, showAll, seriesLimit, onShowAllSeries }: Props) {
  const styles = useStyles2(getStyles);
  const seriesCount = data?.series.length;

  if (seriesCount === undefined || seriesCount < seriesLimit) {
    return null;
  }

  const buttonText = showAll ? 'Restore limit' : `Show all ${seriesCount}`;

  return (
    <div className={styles.timeSeriesDisclaimer}>
      {!showAll && (
        <span className={styles.warningMessage}>
          <Icon
            title={t(
              'grafana-scenes.components.viz-panel-series-limit.warning-message',
              `Showing only {{seriesLimit}} series`,
              {
                seriesLimit,
              }
            )}
            name="exclamation-triangle"
            aria-hidden="true"
          />
        </span>
      )}
      <Tooltip
        content={t(
          'grafana-scenes.components.viz-panel-series-limit.content-rendering-series-single-panel-impact-performance',
          'Rendering too many series in a single panel may impact performance and make data harder to read.'
        )}
      >
        <Button variant="secondary" size="sm" onClick={onShowAllSeries}>
          {buttonText}
        </Button>
      </Tooltip>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  timeSeriesDisclaimer: css({
    label: 'time-series-disclaimer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  warningMessage: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.colors.warning.main,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

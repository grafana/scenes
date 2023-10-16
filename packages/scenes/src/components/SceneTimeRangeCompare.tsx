import React from 'react';
import { DateTime, dateTime, GrafanaTheme2, rangeUtil, TimeRange } from '@grafana/data';
import { ButtonGroup, Checkbox, Dropdown, Menu, ToolbarButton, useStyles2 } from '@grafana/ui';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectState, SceneObjectUrlValues } from '../core/types';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';
import { parseUrlParam } from '../utils/parseUrlParam';
import { css } from '@emotion/css';

export interface TimeRangeCompareProvider {
  getCompareTimeRange(timeRange: TimeRange): TimeRange | undefined;
}

interface SceneTimeRangeCompareState extends SceneObjectState {
  compareWith?: string;
  compareOptions: Array<{ label: string; value: string }>;
}

const PREVIOUS_PERIOD_VALUE = '__previousPeriod';

export const PREVIOUS_PERIOD_COMPARE_OPTION = {
  label: 'Previous period',
  value: PREVIOUS_PERIOD_VALUE,
};

export const DEFAULT_COMPARE_OPTIONS = [
  { label: '1 day before', value: '24h' },
  { label: '3 days before', value: '3d' },
  { label: '1 week before', value: '1w' },
  { label: '2 weeks before', value: '2w' },
  { label: '1 month before', value: '1M' },
  { label: '3 months before', value: '3M' },
  { label: '6 months before', value: '6M' },
  { label: '1 year before', value: '1y' },
];

export class SceneTimeRangeCompare
  extends SceneObjectBase<SceneTimeRangeCompareState>
  implements TimeRangeCompareProvider
{
  static Component = SceneTimeRangeCompareRenderer;
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['compareWith'] });

  public constructor(state: Partial<SceneTimeRangeCompareState>) {
    super({ compareOptions: DEFAULT_COMPARE_OPTIONS, ...state });
    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const sceneTimeRange = sceneGraph.getTimeRange(this);
    this.setState({ compareOptions: this.getCompareOptions(sceneTimeRange.state.value) });

    this._subs.add(
      sceneTimeRange.subscribeToState((timeRange) => {
        const compareOptions = this.getCompareOptions(timeRange.value);
        const stateUpdate: Partial<SceneTimeRangeCompareState> = { compareOptions };

        // if current compareWith is not applicable to the new time range, set it to previous period comparison
        if (Boolean(this.state.compareWith) && !compareOptions.find(({ value }) => value === this.state.compareWith)) {
          stateUpdate.compareWith = PREVIOUS_PERIOD_VALUE;
        }

        this.setState(stateUpdate);
      })
    );
  };

  public getCompareOptions = (timeRange: TimeRange) => {
    const diffDays = Math.ceil(timeRange.to.diff(timeRange.from));

    const matchIndex = DEFAULT_COMPARE_OPTIONS.findIndex(({ value }) => {
      const intervalInMs = rangeUtil.intervalToMs(value);
      return intervalInMs >= diffDays;
    });

    return [
      PREVIOUS_PERIOD_COMPARE_OPTION,
      ...DEFAULT_COMPARE_OPTIONS.slice(matchIndex).map(({ label, value }) => ({ label, value })),
    ];
  };

  public onCompareWithChanged = (compareWith: string) => {
    this.setState({ compareWith });
  };

  public onClearCompare = () => {
    this.setState({ compareWith: undefined });
  };

  public getCompareTimeRange(timeRange: TimeRange): TimeRange | undefined {
    let compareFrom: DateTime;
    let compareTo: DateTime;

    if (this.state.compareWith) {
      if (this.state.compareWith === PREVIOUS_PERIOD_VALUE) {
        const diffMs = timeRange.to.diff(timeRange.from);
        compareFrom = dateTime(timeRange.from!).subtract(diffMs);
        compareTo = dateTime(timeRange.to!).subtract(diffMs);
      } else {
        compareFrom = dateTime(timeRange.from!).subtract(rangeUtil.intervalToMs(this.state.compareWith));
        compareTo = dateTime(timeRange.to!).subtract(rangeUtil.intervalToMs(this.state.compareWith));
      }
      return {
        from: compareFrom,
        to: compareTo,
        raw: {
          from: compareFrom,
          to: compareTo,
        },
      };
    }

    return undefined;
  }

  public getUrlState(): SceneObjectUrlValues {
    return {
      compareWith: this.state.compareWith,
    };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (!values.compareWith) {
      return;
    }

    const compareWith = parseUrlParam(values.compareWith);

    if (compareWith) {
      const compareOptions = this.getCompareOptions(sceneGraph.getTimeRange(this).state.value);

      if (compareOptions.find(({ value }) => value === compareWith)) {
        this.setState({
          compareWith,
        });
      } else {
        this.setState({
          compareWith: '__previousPeriod',
        });
      }
    }
  }
}

function SceneTimeRangeCompareRenderer({ model }: SceneComponentProps<SceneTimeRangeCompare>) {
  const styles = useStyles2(getStyles);

  const { compareWith, compareOptions } = model.useState();
  const [isOpen, setIsOpen] = React.useState(Boolean(compareWith) || false);
  const value = compareOptions.find((o) => o.value === compareWith);
  const enabled = Boolean(value);

  const onClick = () => {
    setIsOpen(!enabled);
    if (enabled && Boolean(compareWith)) {
      model.onClearCompare();
    }
  };

  const menuItems = () => (
    <Menu>
      {compareOptions.map(({ label, value }, idx) => (
        <Menu.Item
          key={idx}
          label={label}
          onClick={() => {
            model.onCompareWithChanged(value);
            setIsOpen(false);
          }}
        />
      ))}
    </Menu>
  );

  return (
    <ButtonGroup>
      <Dropdown overlay={menuItems} placement="bottom-end" onVisibleChange={setIsOpen}>
        <div className={styles.container}>
          <div className={styles.canvas}>
            <Checkbox
              id="timeWindowComparisonToggle"
              value={enabled}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick();
              }}
            />
          </div>

          <ToolbarButton
            variant="canvas"
            tooltip="Enable time frame comparison"
            isOpen={isOpen}
            aria-label="Time frame comparison"
          >
            Time frame comparison
            {enabled && <span className={styles.value}>{value?.label}</span>}
          </ToolbarButton>
        </div>
      </Dropdown>
    </ButtonGroup>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    canvas: css({
      marginRight: '-1px',

      height: theme.spacing(theme.components.height.md),
      padding: theme.spacing(0, 1),
      borderRadius: theme.shape.radius.default,
      lineHeight: `${theme.components.height.md * theme.spacing.gridSize - 2}px`,
      fontWeight: theme.typography.fontWeightMedium,
      border: `1px solid ${theme.colors.secondary.border}`,

      color: theme.colors.text.primary,
      background: theme.colors.secondary.main,

      '&:hover': {
        color: theme.colors.text.primary,
        background: theme.colors.secondary.shade,
        border: `1px solid ${theme.colors.border.medium}`,
      },
    }),
    container: css({ display: 'flex', alignItems: 'center' }),
    value: css({
      marginLeft: theme.spacing(1),
      borderLeft: `1px solid ${theme.colors.border.medium}`,
      paddingLeft: theme.spacing(1),
    }),
  };
}

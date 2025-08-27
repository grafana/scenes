import { t, Trans } from '@grafana/i18n';
import { DataQueryRequest, DateTime, dateTime, FieldType, GrafanaTheme2, rangeUtil, TimeRange } from '@grafana/data';
import { config } from '@grafana/runtime';
import { ButtonGroup, ButtonSelect, Checkbox, ToolbarButton, useStyles2 } from '@grafana/ui';
import { useState } from 'react';
import { sceneGraph } from '../core/sceneGraph';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneDataQuery, SceneObjectState, SceneObjectUrlValues } from '../core/types';
import { DataQueryExtended } from '../querying/SceneQueryRunner';
import { ExtraQueryDescriptor, ExtraQueryDataProcessor, ExtraQueryProvider } from '../querying/ExtraQueryProvider';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';
import { getCompareSeriesRefId } from '../utils/getCompareSeriesRefId';
import { parseUrlParam } from '../utils/parseUrlParam';
import { css } from '@emotion/css';
import { of } from 'rxjs';

interface SceneTimeRangeCompareState extends SceneObjectState {
  compareWith?: string;
  compareOptions: Array<{ label: string; value: string }>;
  hideCheckbox?: boolean;
}

const PREVIOUS_PERIOD_VALUE = '__previousPeriod';
const NO_PERIOD_VALUE = '__noPeriod';

export const PREVIOUS_PERIOD_COMPARE_OPTION = {
  label: 'Previous period',
  value: PREVIOUS_PERIOD_VALUE,
};

export const NO_COMPARE_OPTION = {
  label: 'None',
  value: NO_PERIOD_VALUE,
};

export const DEFAULT_COMPARE_OPTIONS = [
  { label: 'Day before', value: '24h' },
  { label: 'Week before', value: '1w' },
  { label: 'Month before', value: '1M' },
];

export class SceneTimeRangeCompare
  extends SceneObjectBase<SceneTimeRangeCompareState>
  implements ExtraQueryProvider<SceneTimeRangeCompareState>
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
      NO_COMPARE_OPTION,
      PREVIOUS_PERIOD_COMPARE_OPTION,
      ...DEFAULT_COMPARE_OPTIONS.slice(matchIndex).map(({ label, value }) => ({ label, value })),
    ];
  };

  public onCompareWithChanged = (compareWith: string) => {
    if (compareWith === NO_PERIOD_VALUE) {
      this.onClearCompare();
    } else {
      this.setState({ compareWith });
    }
  };

  public onClearCompare = () => {
    this.setState({ compareWith: undefined });
  };

  // Get a time shifted request to compare with the primary request.
  public getExtraQueries(request: DataQueryRequest): ExtraQueryDescriptor[] {
    const extraQueries: ExtraQueryDescriptor[] = [];
    const compareRange = this.getCompareTimeRange(request.range);
    if (!compareRange) {
      return extraQueries;
    }

    const targets = request.targets.filter((query: DataQueryExtended) => query.timeRangeCompare !== false);
    if (targets.length) {
      extraQueries.push({
        req: {
          ...request,
          targets,
          range: compareRange,
        },
        processor: timeShiftAlignmentProcessor,
      });
    }
    return extraQueries;
  }

  // The query runner should rerun the comparison query if the compareWith value has changed and there are queries that haven't opted out of TWC
  public shouldRerun(
    prev: SceneTimeRangeCompareState,
    next: SceneTimeRangeCompareState,
    queries: SceneDataQuery[]
  ): boolean {
    return (
      prev.compareWith !== next.compareWith && queries.find((query) => query.timeRangeCompare !== false) !== undefined
    );
  }

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

// Processor function for use with time shifted comparison series.
// This aligns the secondary series with the primary and adds custom
// metadata and config to the secondary series' fields so that it is
// rendered appropriately.
const timeShiftAlignmentProcessor: ExtraQueryDataProcessor = (primary, secondary) => {
  const diff = secondary.timeRange.from.diff(primary.timeRange.from);
  secondary.series.forEach((series) => {
    series.refId = getCompareSeriesRefId(series.refId || '');
    series.meta = {
      ...series.meta,
      // @ts-ignore Remove when https://github.com/grafana/grafana/pull/71129 is released
      timeCompare: {
        diffMs: diff,
        isTimeShiftQuery: true,
      },
    };
    series.fields.forEach((field) => {
      // Align compare series time stamps with reference series
      if (field.type === FieldType.time) {
        field.values = field.values.map((v) => {
          return diff < 0 ? v - diff : v + diff;
        });
      }

      field.config = {
        ...field.config,
        color: {
          mode: 'fixed',
          fixedColor: config.theme.palette.gray60,
        },
      };
      return field;
    });
  });
  return of(secondary);
};

function SceneTimeRangeCompareRenderer({ model }: SceneComponentProps<SceneTimeRangeCompare>) {
  const styles = useStyles2(getStyles);
  const { compareWith, compareOptions, hideCheckbox } = model.useState();

  const [previousCompare, setPreviousCompare] = useState(compareWith);
  const previousValue = compareOptions.find(({ value }) => value === previousCompare) ?? PREVIOUS_PERIOD_COMPARE_OPTION;

  const value = compareOptions.find(({ value }) => value === compareWith);
  const enabled = Boolean(value);

  const onClick = () => {
    if (enabled) {
      setPreviousCompare(compareWith);
      model.onClearCompare();
    } else if (!enabled) {
      model.onCompareWithChanged(previousValue.value);
    }
  };

  // When hideCheckbox is true, always show select and use NO_COMPARE_OPTION when no comparison is active
  const selectValue = hideCheckbox && !compareWith ? NO_COMPARE_OPTION : value;
  const showSelect = hideCheckbox || enabled;

  // Create display value with "Comparison" prefix when hideCheckbox is true
  const displayValue =
    hideCheckbox && selectValue
      ? {
          ...selectValue,
          label: `Comparison: ${selectValue.label}`,
        }
      : selectValue;

  return (
    <ButtonGroup>
      {!hideCheckbox && (
        <ToolbarButton
          variant="canvas"
          tooltip={t(
            'grafana-scenes.components.scene-time-range-compare-renderer.button-tooltip',
            'Enable time frame comparison'
          )}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
          }}
        >
          <Checkbox label=" " value={enabled} onClick={onClick} />
          <Trans i18nKey="grafana-scenes.components.scene-time-range-compare-renderer.button-label">Comparison</Trans>
        </ToolbarButton>
      )}

      {showSelect ? (
        <ButtonSelect
          variant="canvas"
          value={displayValue}
          options={compareOptions}
          onChange={(v) => {
            model.onCompareWithChanged(v.value!);
          }}
        />
      ) : (
        <ToolbarButton className={styles.previewButton} disabled variant="canvas" isOpen={false}>
          {previousValue.label}
        </ToolbarButton>
      )}
    </ButtonGroup>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    previewButton: css({
      '&:disabled': {
        border: `1px solid ${theme.colors.secondary.border}`,
        color: theme.colors.text.disabled,
        opacity: 1,
      },
    }),
  };
}

import { FieldType, PanelData } from '@grafana/data';
import { config } from '@grafana/runtime';
import { map, Observable } from 'rxjs';
import { getCompareSeriesRefId } from '../utils/getCompareSeriesRefId';

export function timeShiftQueryResponseOperator(data: Observable<[PanelData, PanelData]>) {
  return data.pipe(
    map(([p, s]) => {
      const diff = s.timeRange.from.diff(p.timeRange.from);
      s.series.forEach((series) => {
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

      return {
        ...p,
        series: [...p.series, ...s.series],
      };
    })
  );
}

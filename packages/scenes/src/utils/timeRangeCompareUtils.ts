import { PanelData, FieldType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { from, Observable } from 'rxjs';

export function alignTimeRangeCompareData(data: PanelData, setColor = true): PanelData {
  return {
    ...data,
    series: data.series.map((s) => {
      const tc = s.meta?.timeCompare;
      // @ts-ignore Pending type update in Grafana core (see https://github.com/grafana/grafana/pull/71129)
      if (!tc || !tc.isCompareQuery || tc.isTimeShifted) {
        return s;
      }
      const diffMs = tc.diffMs;
      const aligned = { ...s };
      if (s.name) {
        aligned.name = `${s.name} (comparison)`;
      }
      aligned.fields = aligned.fields.map((f) => {
        const field = { ...f };
        if (field.type !== FieldType.time) {
          if (!field.config.displayName) {
            field.config = { ...field.config, displayName: `${field.name} (comparison)` };
          }
          field.config = {
            ...field.config,
            custom: { ...field.config.custom, timeCompare: { ...tc, isTimeShifted: true } },
          };
        }
        if (field.type === FieldType.time) {
          return {
            ...field,
            values: field.values.map((v) => v + diffMs),
          };
        }
        return field;
      });
      // Remove frame-level meta.timeCompare after setting per-field
      delete aligned.meta.timeCompare;
      if (setColor) {
        for (let f of aligned.fields) {
          if (!f.config.color) {
            f.config.color = { mode: 'fixed', fixedColor: config.theme.palette.gray60 };
          }
        }
      }
      // @ts-ignore Pending type update in Grafana core (see https://github.com/grafana/grafana/pull/71129)
      aligned.meta = { ...aligned.meta, timeCompare: { ...tc, isTimeShifted: true } };
      return aligned;
    }),
  };
}

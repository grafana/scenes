import { VariableValue } from '@grafana/scenes';
import { VariableHide } from '@grafana/schema';

export interface VariableProps {
  name: string;
  label?: string;
  hide?: VariableHide;
  initialValue?: VariableValue;
  skipUrlSync?: boolean;
  allValue?: string;
}

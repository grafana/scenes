import { lookupVariable } from '../../variables/lookupVariable';
import { getTimeRange } from './getTimeRange';
import {
  findObject,
  getData,
  getLayout,
  getVariables,
  hasVariableDependencyInLoadingState,
  interpolate,
  getDataLayers,
} from './sceneGraph';

export const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getDataLayers,
  getLayout,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
  findObject,
};

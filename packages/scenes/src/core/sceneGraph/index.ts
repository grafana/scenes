import { lookupVariable } from '../../variables/lookupVariable';
import { getTimeRange } from './getTimeRange';
import {
  findObject,
  getData,
  getLayout,
  getVariables,
  getDataLayers,
  hasVariableDependencyInLoadingState,
  interpolate,
  getAncestor,
  getQueryController,
} from './sceneGraph';

export const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getLayout,
  getDataLayers,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
  findObject,
  getAncestor,
  getQueryController,
};

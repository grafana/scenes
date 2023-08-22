import { lookupVariable } from '../../variables/lookupVariable';
import { getTimeRange } from './getTimeRange';
import {
  findObject,
  forceRenderChildren,
  getData,
  getLayout,
  getVariables,
  hasVariableDependencyInLoadingState,
  interpolate,
} from './sceneGraph';

export const sceneGraph = {
  getVariables,
  getData,
  getTimeRange,
  getLayout,
  interpolate,
  lookupVariable,
  hasVariableDependencyInLoadingState,
  findObject,
  forceRenderChildren,
};

import { lookupVariable } from '../../variables/lookupVariable';
import { getTimeRange } from './getTimeRange';
import {
  findByKey,
  findByKeyAndType,
  findObject,
  findAllObjects,
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
  findByKey,
  findByKeyAndType,
  findObject,
  findAllObjects,
  getAncestor,
  getQueryController,
};

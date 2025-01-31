import { lookupVariable } from '../../variables/lookupVariable';
import { getQueryController } from './getQueryController';
import { getTimeRange } from './getTimeRange';
import {
  findAllObjects,
  findByKey,
  findByKeyAndType,
  findDescendents,
  findObject,
  getAncestor,
  getData,
  getDataLayers,
  getLayout,
  getVariables,
  hasVariableDependencyInLoadingState,
  interpolate,
} from './sceneGraph';
import { getClosest } from './utils';

export const sceneGraph = {
  findAllObjects,
  findByKey,
  findByKeyAndType,
  findDescendents,
  findObject,
  getAncestor,
  getClosest,
  getData,
  getDataLayers,
  getLayout,
  getQueryController,
  getTimeRange,
  getVariables,
  hasVariableDependencyInLoadingState,
  interpolate,
  lookupVariable,
};

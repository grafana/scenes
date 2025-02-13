import { lookupVariable } from '../../variables/lookupVariable';
import { getQueryController } from './getQueryController';
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
  findDescendents,
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
  findDescendents,
};

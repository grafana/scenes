import { lookupVariable } from '../../variables/lookupVariable';
import { getTimeRange } from './getTimeRange';
import {
  findAllObjects,
  findByKey,
  findByKeyAndType,
  findDescendent,
  findDescendents,
  findObject,
  getAncestor,
  getData,
  getDataLayers,
  getLayout,
  getQueryController,
  getUrlSyncManager,
  getVariables,
  hasVariableDependencyInLoadingState,
  interpolate,
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
  findDescendents,
  getQueryController,
  getUrlSyncManager,
  findDescendent,
};

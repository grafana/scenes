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
  findDescendent,
  findDescendents,
  getQueryController,
  getUrlSyncManager,
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

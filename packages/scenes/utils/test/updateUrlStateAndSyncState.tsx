import { UrlQueryMap } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { UrlSyncManager } from '../../src/services/UrlSyncManager';

export function updateUrlStateAndSyncState(searchParams: UrlQueryMap, urlManager: UrlSyncManager) {
  locationService.partial(searchParams);
  urlManager.handleNewLocation(locationService.getLocation());
}

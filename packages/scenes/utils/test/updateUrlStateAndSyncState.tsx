import { getUrlSyncManager } from '../../src';
import { UrlQueryMap } from '@grafana/data';
import { locationService } from '@grafana/runtime';

export function updateUrlStateAndSyncState(searchParams: UrlQueryMap, urlManager = getUrlSyncManager()) {
  locationService.partial(searchParams);
  urlManager.handleNewLocation(locationService.getLocation());
}

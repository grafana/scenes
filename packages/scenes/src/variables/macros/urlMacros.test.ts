import { TestScene } from '../TestScene';

import { sceneInterpolator } from '../interpolation/sceneInterpolator';
import { config, locationService } from '@grafana/runtime';

describe('url macros', () => {
  it('Can get full url via ${__url}', () => {
    const scene = new TestScene({});
    locationService.push('/my-plugin/my-page?from=now-5m&to=now');

    expect(sceneInterpolator(scene, '$__url')).toBe('/my-plugin/my-page?from=now-5m&to=now');
  });

  it('Can get only path via ${__url.path}', () => {
    const scene = new TestScene({});
    locationService.push('/my-plugin/my-page?from=now-5m&to=now');

    expect(sceneInterpolator(scene, '${__url.path}')).toBe('/my-plugin/my-page');
  });

  it('${__url} and ${__url.path} includes grafana sub path', () => {
    config.appSubUrl = '/grafana';

    const scene = new TestScene({});
    locationService.push('/my-plugin/my-page?from=now-5m&to=now');
    expect(sceneInterpolator(scene, '${__url}')).toBe('/grafana/my-plugin/my-page?from=now-5m&to=now');
    expect(sceneInterpolator(scene, '${__url.path}')).toBe('/grafana/my-plugin/my-page');

    config.appSubUrl = '';
  });

  it('Can get only state via ${__url.params}', () => {
    const scene = new TestScene({});
    locationService.push('/my-plugin/my-page?from=now-5m&to=now');

    expect(sceneInterpolator(scene, '${__url.params}')).toBe('?from=now-5m&to=now');
  });

  it('Can exclude query param via ${__url.params:exclude:from}', () => {
    const scene = new TestScene({});
    locationService.push('/my-plugin/my-page?from=now-5m&to=now&var-test=hello&var-test2=world');

    expect(sceneInterpolator(scene, '${__url.params:exclude:from,var-test}')).toBe('?to=now&var-test2=world');
  });

  it('Can specify query params to include via ${__url.params:include:from,var-test}', () => {
    const scene = new TestScene({});
    locationService.push('/my-plugin/my-page?from=now-5m&to=now&var-test=hello&var-test2=world');

    expect(sceneInterpolator(scene, '${__url.params:include:from,var-test}')).toBe('?from=now-5m&var-test=hello');
  });
});

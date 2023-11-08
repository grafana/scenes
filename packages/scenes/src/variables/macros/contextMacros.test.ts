import { config } from '@grafana/runtime';
import { TestScene } from '../TestScene';

import { sceneInterpolator } from '../interpolation/sceneInterpolator';
import { CurrentUserDTO } from '@grafana/data';

describe('user macro', () => {
  it('Can interpolate ${__user.*} expressions', () => {
    const scene = new TestScene({});

    const user: Partial<CurrentUserDTO> = {
      id: 10,
      login: 'user_login',
      email: 'user_email',
    };

    config.bootData.user = user as CurrentUserDTO;

    expect(sceneInterpolator(scene, '$__user')).toBe('10');
    expect(sceneInterpolator(scene, '${__user.id}')).toBe('10');
    expect(sceneInterpolator(scene, '${__user.login}')).toBe('user_login');
    expect(sceneInterpolator(scene, '${__user.email}')).toBe('user_email');
  });
});

describe('org macro', () => {
  it('Can interpolate ${__org.*} expressions', () => {
    const scene = new TestScene({});

    const user: Partial<CurrentUserDTO> = {
      orgId: 15,
      orgName: 'My cool org',
    };

    config.bootData.user = user as CurrentUserDTO;

    expect(sceneInterpolator(scene, '$__org')).toBe('15');
    expect(sceneInterpolator(scene, '${__org.id}')).toBe('15');
    expect(sceneInterpolator(scene, '${__org.name}')).toBe('My cool org');
  });
});

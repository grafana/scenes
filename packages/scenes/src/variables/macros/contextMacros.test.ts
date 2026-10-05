import { config } from '@grafana/runtime';
import { TestScene } from '../TestScene';

import { sceneInterpolator } from '../interpolation/sceneInterpolator';
import { createTheme, CurrentUserDTO } from '@grafana/data';

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

describe('namespace macro', () => {
  it.each(['stacks-123', 'default', 'org-15'])('Can interpolate $__namespace as %s', (namespace) => {
    const scene = new TestScene({});

    config.namespace = namespace;

    expect(sceneInterpolator(scene, '$__namespace')).toBe(namespace);
    expect(sceneInterpolator(scene, 'apis/dashboard.grafana.app/v1beta1/namespaces/${__namespace}/dashboards')).toBe(
      `apis/dashboard.grafana.app/v1beta1/namespaces/${namespace}/dashboards`
    );
  });
});

describe('theme macro', () => {
  const originalTheme = config.theme2;
  const scene = new TestScene({});

  afterEach(() => {
    config.theme2 = originalTheme;
  });

  it('Can interpolate ${__theme.*} expressions from the current theme', () => {
    const dark = createTheme({ colors: { mode: 'dark' } });
    const light = createTheme({ colors: { mode: 'light' } });

    config.theme2 = dark;
    expect(sceneInterpolator(scene, 'color: ${__theme.colors.text.primary}')).toBe(
      `color: ${dark.colors.text.primary}`
    );

    config.theme2 = light;
    expect(sceneInterpolator(scene, 'color: ${__theme.colors.text.primary}')).toBe(
      `color: ${light.colors.text.primary}`
    );
  });

  it('Interpolates a number token as its string form', () => {
    expect(sceneInterpolator(scene, '${__theme.typography.fontSize}px')).toBe('14px');
  });

  it('Applies the requested format', () => {
    expect(sceneInterpolator(scene, '${__theme.typography.fontFamilyMonospace:html}')).toBe(
      '&#39;Roboto Mono&#39;, monospace'
    );
    expect(sceneInterpolator(scene, '${__theme.typography.fontSize:text}')).toBe('14');
  });

  it.each([
    { desc: 'no path', target: '${__theme}' },
    { desc: 'no braces', target: '$__theme' },
    { desc: 'an object', target: '${__theme.colors.text}' },
    { desc: 'a function', target: '${__theme.spacing}' },
    { desc: 'a missing path', target: '${__theme.colors.nope}' },
  ])('Leaves $desc unresolved', ({ target }) => {
    expect(sceneInterpolator(scene, target)).toBe(target);
  });
});

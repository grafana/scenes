// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { grafanaPrismTheme } = require('./src/theme/prism');

const devPortalHome = 'https://grafana.com/developers';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Grafana Scenes',
  tagline: 'Build highly interactive Grafana apps with ease.',
  url: 'https://grafana.com/',
  baseUrl: 'developers/scenes/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'grafana', // Usually your GitHub org/user name.
  projectName: 'scenes', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'docusaurus-lunr-search',
      {
        disableVersioning: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/grafana/scenes/edit/main/docusaurus/website',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        googleTagManager: {
          containerId: process.env.GTAG_CONTAINER_ID || 'GOOGLE_TAG_MANAGER_ID',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      docs: {
        sidebar: {
          autoCollapseCategories: false,
        },
      },
      navbar: {
        title: 'Grafana Scenes',
        logo: {
          alt: 'Grafana Logo',
          src: 'img/logo.svg',
        },
        items: [
          { href: devPortalHome, label: 'Portal Home', position: 'right', target: '_self' },
          // TODO
          // { href: 'https://community.grafana.com/c/plugin-development/30', label: 'Help', position: 'right' },
          {
            href: 'https://www.github.com/grafana/scenes',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/',
              },
              {
                label: 'Portal Home',
                href: devPortalHome,
                target: '_self',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Github Issues',
                href: 'https://www.github.com/grafana/scenes/issues',
              },
              {
                label: 'Grafana Community Forums',
                href: 'https://community.grafana.com/c/plugin-development/30',
              },
            ],
          },
          {
            title: 'Social',
            items: [
              {
                label: 'GitHub',
                href: 'https://www.github.com/grafana/scenes',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Grafana Labs. Built with Docusaurus.`,
      },
      prism: {
        theme: grafanaPrismTheme,
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;

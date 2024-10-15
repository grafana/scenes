const path = require('path');
const prism = require('prism-react-renderer');

const {
  themes: { oneDark },
} = prism;

// Replace background and color to better match Grafana theme.
const grafanaPrismTheme = {
  ...oneDark,
  plain: {
    color: 'rgb(204, 204, 220)',
    backgroundColor: '#181b1f',
  },
};

const customFields = {
  nodeEnv: process.env.NODE_ENV,
};

/** @type {import('@docusaurus/types').Config} */
const generalConfig = {
  title: 'Grafana Scenes',
  tagline: 'Build highly interactive Grafana apps with ease.',
  baseUrl: 'scenes/',
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
};

const plugins = [
  [
    'docusaurus-lunr-search',
    {
      disableVersioning: true,
    },
  ],
];

const presetsDocs = {
  path: '../docs',
  sidebarPath: require.resolve('./sidebars.js'),
  // Please change this to your repo.
  // Remove this to remove the "edit this page" links.
  editUrl: 'https://github.com/grafana/scenes/edit/main/docusaurus/website',
};

const presetsTheme = {
  customCss: require.resolve('./src/css/custom.css'),
};

const themeConfigNavbar = {
  title: 'Grafana Scenes',
  logo: {
    alt: 'Grafana Logo',
    src: 'img/logo.svg',
  },
  items: [
    { href: 'https://community.grafana.com/c/support/scenes/85', label: 'Help', position: 'right' },
    {
      href: 'https://www.github.com/grafana/scenes',
      label: 'GitHub',
      position: 'right',
    },
  ],
};

const themeConfigFooter = {
  style: 'dark',
  links: [
    {
      title: 'Docs',
      items: [
        {
          label: 'Get Started',
          to: '/',
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
          href: 'https://community.grafana.com/c/support/scenes/85',
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
};

const themeConfigPrism = {
  theme: grafanaPrismTheme,
  additionalLanguages: ['bash', 'diff', 'json'],
  magicComments: [
    {
      className: 'code-block-addition-highlighted-line',
      line: 'addition-highlight-next-line',
      block: { start: 'addition-highlight-start', end: 'addition-highlight-end' },
    },
  ],
};

const themeConfigColorMode = {
  defaultMode: 'dark',
  disableSwitch: true,
  respectPrefersColorScheme: false,
};

module.exports = {
  customFields,
  generalConfig,
  plugins,
  presetsDocs,
  presetsTheme,
  themeConfigNavbar,
  themeConfigFooter,
  themeConfigPrism,
  themeConfigColorMode,
};

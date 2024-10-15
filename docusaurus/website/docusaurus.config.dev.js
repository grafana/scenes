// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {
  customFields,
  generalConfig,
  plugins,
  presetsDocs,
  presetsTheme,
  themeConfigNavbar,
  themeConfigFooter,
  themeConfigPrism,
  themeConfigColorMode,
} = require('./docusaurus.config.base');

const devPortalHome = 'https://grafana-dev.com/developers';
const [docsFooterLinks, ...otherFooterLinks] = themeConfigFooter.links;

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...generalConfig,
  url: 'https://grafana-dev.com/',
  baseUrl: 'developers/scenes/',
  plugins: [],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          ...presetsDocs,
          routeBasePath: '/',
        },
        theme: presetsTheme,
        blog: false,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        ...themeConfigNavbar,
        items: [
          { href: devPortalHome, label: 'Portal Home', position: 'right', target: '_self' },
          ...themeConfigNavbar.items,
        ],
      },
      footer: {
        ...themeConfigFooter,
        links: [
          {
            ...docsFooterLinks,
            items: [
              ...docsFooterLinks.items,
              {
                label: 'Portal Home',
                href: devPortalHome,
                target: '_self',
              },
            ],
          },
          ...otherFooterLinks,
        ],
      },
      prism: themeConfigPrism,
      colorMode: themeConfigColorMode,
    }),
};

module.exports = config;

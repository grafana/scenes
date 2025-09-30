// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {
  generalConfig,
  plugins,
  presetsDocs,
  presetsTheme,
  themeConfigNavbar,
  themeConfigFooter,
  themeConfigPrism,
  themeConfigColorMode,
} = require('./docusaurus.config.base');

const devPortalHome = 'https://grafana.com/developers';
const [docsFooterLinks, ...otherFooterLinks] = themeConfigFooter.links;

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...generalConfig,
  url: 'https://grafana.com/',
  baseUrl: 'developers/scenes/',
  plugins,
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
  customFields: {
    rudderStackTracking: {
      url: "https://rs.grafana.com",
      writeKey: "1sBAgwTlZ2K0zTzkM8YTWorZI00",
      configUrl: "https://rsc.grafana.com",
      sdkUrl: "https://rsdk.grafana.com",
    },
    canSpamUrl: "https://grafana.com/canspam",
    gcomUrl: "https://grafana.com/api",
    oneTrust: {
      enabled: true,
      scriptSrc: 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js',
      domainId: '019644f3-5dcf-741c-8b6d-42fb8feae57f',
      analyticsGroupId: 'C0002', // OneTrust group ID for analytics consent
    },
  },
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

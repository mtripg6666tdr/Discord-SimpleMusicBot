// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Discord-SimpleMusicBot',
  tagline: 'データベース不要のDiscord向けのシンプルな音楽ボット / Simple Music Bot for Discord without any database',
  url: 'https://web.usamyon.moe',
  baseUrl: '/Discord-SimpleMusicBot/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'mtripg6666tdr', // Usually your GitHub org/user name.
  projectName: 'Discord-SimpleMusicBot', // Usually your repo name.
  trailingSlash: false,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: (context) => {
            if(context.docPath.startsWith("guide/commands/")){
              return undefined;
            }
            return `https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/edit/master/docs/${context.versionDocsDirPath}/${context.docPath}`
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Discord-SimpleMusicBot',
        logo: {
          alt: 'Logo',
          src: 'img/icon.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'setup/welcome',
            position: 'left',
            label: 'ドキュメント',
          },
          {
            type: 'doc',
            docId: 'guide/overview',
            position: 'left',
            label: '使い方/ガイド',
          },
          {
            type: "docsVersionDropdown",
            position: "right",
            dropdownItemsAfter: [
            ],
            dropdownActiveClassDisabled: true,
          },
          {
            href: 'https://github.com/mtripg6666tdr/Discord-SimpleMusicBot',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'ドキュメント',
            items: [
              {
                label: 'ボット管理者向けドキュメント',
                to: '/docs/setup/welcome',
              },
              {
                label: 'ボット利用者向け機能ガイド',
                to: '/docs/guide/overview'
              }
            ],
          },
          {
            title: 'コミュニティ/サポート',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.com/invite/7DrAEXBMHe',
              },
            ],
          },
          {
            title: '開発',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/mtripg6666tdr/Discord-SimpleMusicBot',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} mtripg6666tdr. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

  stylesheets: [
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP&display=swap'
  ]
};

module.exports = config;

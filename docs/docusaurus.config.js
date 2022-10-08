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
          editUrl:
            'https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/master/docs/',
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
          alt: 'My Site Logo',
          src: 'img/icon.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'docs/welcome',
            position: 'left',
            label: 'ドキュメント',
          },
          {
            type: 'doc',
            docId: 'commands/overview',
            position: 'left',
            label: 'ガイド',
          },
          {
            href: 'https://github.com/mtripg6666tdr/Discord-SimpleMusicBot',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'ドキュメント',
            items: [
              {
                label: 'ドキュメント',
                to: '/docs/docs/welcome',
              },
              {
                label: 'ガイド',
                to: '/docs/commands/overview'
              }
            ],
          },
          {
            title: 'コミュニティ',
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
};

module.exports = config;

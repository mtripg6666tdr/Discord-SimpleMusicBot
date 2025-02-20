import styles from "./styles.module.css";

const githubRepoUrl = 'https://github.com/mtripg6666tdr/Discord-SimpleMusicBot';
const supportGuildUrl = 'https://sr.usamyon.moe/8QZw';

export default function HomepageCommunity(): JSX.Element {
  return (
    <section className={styles.community}>
      <h2 className='text--center'>Discord-SimpleMusicBot プロジェクトは、コミュニティによって支えられています。</h2>
      <div className={styles.community_row}>
        <a href={githubRepoUrl} target='_blank' rel='noopener noreferrer'>
          <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/mtripg6666tdr/Discord-SimpleMusicBot" />
        </a>
        <a href={githubRepoUrl} target='_blank' rel='noopener noreferrer'>
          <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/mtripg6666tdr/Discord-SimpleMusicBot?style=social" />
        </a>
        <a href={supportGuildUrl} target='_blank' rel='noopener noreferrer'>
          <img alt="Discord" src="https://img.shields.io/discord/847435307582095360?style=social&logo=discord&label=Discord" />
        </a>
      </div>
      <p className='text--center margin-top--lg'>プロジェクトが気に入った場合には、いずれかの方法での支援をお願いいたします。</p>
      <ul className={styles.support_list}>
        <li><a href={githubRepoUrl} target='_blank' rel='noopener noreferrer'>GitHub のリポジトリ</a>に Star をつけていただく。</li>
        <li><a href={supportGuildUrl} target='_blank' rel='noopener noreferrer'>サポートサーバー</a>に参加していただく。</li>
        <li>
          公開ボットをホストしていただく。
          <ul>
            <li>ぜひ<a href={supportGuildUrl} target='_blank' rel='noopener noreferrer'>サポートサーバー</a>でお知らせください。</li>
            <li>承諾いただければ、サーバー内やドキュメントサイトに掲載いたします。</li>
          </ul>
        </li>
        <li>GitHub の Issue や Pull Request を通して、開発の協力をしていただく。</li>
        <li><a href='https://crowdin.com/project/discord-simplemusicbot' target='_blank' rel='noreferrer noopener'>Crowdin</a> を通して、翻訳の協力をしていただく。</li>
        <li><a href="https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/network/dependencies" target='_blank' rel='noopener noreferrer'>利用している各種ライブラリ</a>の開発者に寄付をしていただく。</li>
        <li style={{ color: "rgba(0, 0, 0, 0.3)" }}>
          <a href={githubRepoUrl} target='_blank' rel='noopener noreferrer' style={{ color: 'inherit' }}>GitHub のリポジトリ</a>
          から開発者に寄付していただく。
        </li>
      </ul>
    </section>
  );
}

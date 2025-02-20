import { useEffect, useState } from "react";
import HomepageZoneContainer from "../HomepageZoneContainer";
import styles from "./styles.module.css";
import clsx from "clsx";

export default function HomepageStatsOverview(): JSX.Element {
  const [ version, setVersion ] = useState<string | null>(null);
  const [ years, setYears ] = useState<number | null>(null);

  useEffect(() => {
    setYears(Math.floor((Date.now() - new Date("2021-05-21T14:16:28.000Z").getTime()) / 1000 / 60 / 60 / 24 / 365));
    
    const abortController = new AbortController();

    window.fetch("https://cdn.jsdelivr.net/gh/mtripg6666tdr/Discord-SimpleMusicBot@master/package.json", { signal: abortController.signal })
      .then(res => res.json())
      .then(data => setVersion(data.version))
      .catch(() => setVersion("取得失敗"));

    return () => {
      abortController.abort();
    }
  }, []);

  return (
    <HomepageZoneContainer title="数字で見る Discord-SimpleMusicBot">
      <div className={clsx("container", styles.stats)}>
        <div className="row">
          <div className="col col--4">
            <p>60+</p>
            <p>現在のGitHubリポジトリのスター数</p>
          </div>
          <div className="col col--4">
            <p>35,000+</p>
            <p>Dockerイメージの総計ダウンロード数</p>
          </div>
          <div className="col col--4">
            <p>{version}</p>
            <p>最新のバージョン</p>
          </div>
        </div>
        <div className="row">
          <div className="col col--4">
            <p>40+</p>
            <p>稼働中ボット数</p>
          </div>
          <div className="col col--4">
            <p>500+</p>
            <p>稼働中の延べサーバー数</p>
          </div>
          <div className="col col--4">
            <p>{years?.toLocaleString()}+</p>
            <p>プロジェクト継続年数</p>
          </div>
        </div>
      </div>
    </HomepageZoneContainer>
  );
}

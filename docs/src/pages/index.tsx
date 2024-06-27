import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [detectUrl, setDetectUrl] = useState<string|null>("");

  // dirty workaround to get the current version url
  useEffect(() => {
    if(typeof window === "object"){
      const navBarItem = document.querySelector("nav .navbar__item") as HTMLAnchorElement
      if(navBarItem){
        const observer = new window!.MutationObserver(() => {
          setDetectUrl(navBarItem.href.split(siteConfig.baseUrl)?.[1]);
        });
        observer.observe(navBarItem, {
          attributes: true,
          attributeFilter: ["href"]
        });
        return () => observer.disconnect();
      }
    }
  }, []);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to={detectUrl || "/docs/setup/welcome"}>
            🎵&nbsp;ドキュメントに進む&nbsp;▶️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title={`ドキュメント`}
      description="Discord-SimpleMusicBotのドキュメントサイト">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}

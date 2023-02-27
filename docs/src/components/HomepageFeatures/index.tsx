import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Translate from '@docusaurus/Translate';

type FeatureItem = {
  title: JSX.Element;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: <Translate id='home.feature.highquality'>高音質</Translate>,
    Svg: require('@site/static/img/headphone.svg').default,
    description: (
      <Translate id='home.feature.highqualitydescription'>
        元の音質とボイスチャンネルのビットレートを考慮し、できる限り高音質で再生できるようにしています。
      </Translate>
    ),
  },
  {
    title: <Translate id='home.feature.commandtype'>メッセージベースのコマンドとスラッシュコマンド</Translate>,
    Svg: require('@site/static/img/keyboard.svg').default,
    description: (
      <Translate id='home.feature.commandtypedescription'>
        小規模で使用する場合には、昔ながらのメッセージベースのコマンドとスラッシュコマンドの両方に対応。使用しやすいほうを使用することができます。
      </Translate>
    ),
  },
  {
    title: <Translate id='home.feature.ts'>TypeScriptで構築</Translate>,
    Svg: require('@site/static/img/ts.svg').default,
    description: (
      <Translate id='home.feature.tsdescription'>
        ボットのソースコードはTypeScriptで構築されています。
      </Translate>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center feature_svg">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

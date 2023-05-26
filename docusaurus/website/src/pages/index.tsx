import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import GrafanaLogo from './homepage_logo.svg';

import styles from './index.module.css';
import HomepageGettingStarted from '../components/HomepageGettingStarted';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={styles.heroImageContainer}>
        <GrafanaLogo style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
      </div>
      <div className={clsx('container', styles.heroContent)}>
        <h1 className="hero__title">
          {siteConfig.title} <span style={{ fontWeight: 'normal' }}> | public preview</span>
        </h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg button--outline" to="/docs/getting-started">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`${siteConfig.title}`} description="Build highly interactive Grafana apps with ease.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageGettingStarted />
      </main>
    </Layout>
  );
}
